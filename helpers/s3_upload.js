const { S3, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command  } = require("@aws-sdk/client-s3");
const fs = require('fs-extra');
const path = require('path')
const ffmpeg = require("fluent-ffmpeg");
const url = require("url");
const { v4: uuidv4 } = require('uuid'); // You can install uuid with npm install uuid
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
let bucketName = process.env.DO_SPACES_NAME;
console.log("bucketName",bucketName);

const s3Client = new S3({
  forcePathStyle: false,
  endpoint: "https://nyc3.digitaloceanspaces.com",
  region: "nyc3",
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
});
ffmpeg.setFfmpegPath('C:/ffmpeg/bin/ffmpeg.exe');

const upload_file = async (file, folder_Name, res) => {
  console.log("upload_file", file);

  const folderName = folder_Name;
  let uploadParameters = {
    Bucket: process.env.DO_SPACES_NAME,
    ContentType: file.mimetype,
    Body: file.buffer,
    ACL: "public-read",
    Key:
      folderName +
      +Date.now() + '-' + file.originalname.replace(/\s+/g, '_'),
    CacheControl: "no-cache",
  };
  try {
    const data = await s3Client.send(new PutObjectCommand(uploadParameters));
    // console.log("url", https://${process.env.DO_SPACES_NAME}.nyc3.cdn.digitaloceanspaces.com/${uploadParameters.Key})
    // console.log("s3Client.config.endpoint", s3Client.config.endpoint)
    // console.log("Successfully uploaded object: " + uploadParameters.Key, data);
    return `https://${process.env.DO_SPACES_NAME}.nyc3.digitaloceanspaces.com/${uploadParameters.Key}`;
  } catch (err) {
    console.log("err", err);
    // return res.status(400).json({ status: 0, message: "error occuring while uploading image" });
  }
};

const deleteFromS3 = async (fileUrl) => {
  try {
    // Extract bucket name and key from the file URL
    const bucketName = process.env.DO_SPACES_NAME;
    const urlParts = new URL(fileUrl);
    const key = urlParts.pathname.substring(1); // Remove the leading '/'

    const s3DeleteParams = {
      Bucket: bucketName,
      Key: key,
    };

    // Delete the file using the DeleteObjectCommand
    const command = new DeleteObjectCommand(s3DeleteParams);
    await s3Client.send(command); // Send the command using the client
    console.log(`File deleted successfully from S3: ${fileUrl}`);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
};


async function removeLocalFiles(directory) {
  const files = fs.readdirSync(directory);
  files.forEach((file) => {
    const filePath = path.join(directory, file);
    fs.removeSync(filePath); // Delete each file
  });
  fs.removeSync(directory);
  console.log(`Local files in ${directory} removed.`);
}
async function uploadToS3(filePath, s3Key) {
  try {
    console.log("filePath", filePath);
    console.log("s3Key", s3Key);
    console.log("Final URLs", `https://${bucketName}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${s3Key}`);
    const fileContent = fs.readFileSync(filePath);
    console.log("fileContent", fileContent)

    const params = {
      Bucket: bucketName,
      ACL: "public-read", // Allow public read access if needed
      Key: s3Key,
      Body: fileContent,
      ContentType: "application/octet-stream", // Adjust content type as needed
      CacheControl: "no-cache",
    };
    // Upload to DigitalOcean Space (which is S3-compatible)
    const data = await s3Client.send(new PutObjectCommand(params));
    console.log("Successfully uploaded object: " + JSON.stringify(data));
    return `https://${bucketName}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${s3Key}`;
  } catch (error) {
    console.log("Error in Uploading ", error)
  }

}
async function uploadVideo(file) {
  console.log("Creating HLS segments...", file);

  // var safeFileName = `hls/${path.parse(file.originalname).name}`
  var safeFileName = path.parse(file.originalname).name;
  console.log("safeFileName", safeFileName)
  var outputPath = path.join('hls', safeFileName);

  fs.ensureDirSync(outputPath);

  const resolutions = [
    { height: 720, bitrate: 2500, maxrate: 2675, bufsize: 3750, audio: 128 },
  ];

  const tempFilePath = path.join(outputPath, 'temp_video.mp4');
  await fs.writeFile(tempFilePath, file.buffer);

  const s3outputBasePath = `${Date.now()}-${uuidv4()}`;

  const promises = resolutions.map(res => {
    const output = path.join(outputPath, `${res.height}p.m3u8`);
    return new Promise((resolve, reject) => {
      ffmpeg(tempFilePath)
        .outputOptions([
          `-vf scale=-2:${res.height}`,
          `-c:v libx264`,
          `-preset veryfast`,
          `-b:v ${res.bitrate}k`,
          `-maxrate ${res.maxrate}k`,
          `-bufsize ${res.bufsize}k`,
          `-c:a aac`,
          `-b:a ${res.audio}k`,
          `-hls_time 4`,
          `-hls_playlist_type vod`
        ])
        .output(output)
        .on('start', commandLine => {
          console.log(`FFmpeg command: ${commandLine}`);
        })
        .on('error', (err, stdout, stderr) => {
          console.error(`stdout: ${stdout}`);
          console.error(`Error: ${err.message}`, err);
          console.error(`FFmpeg stderr: ${stderr}`);
          reject(err);
        })
        .on('end', async () => {
          console.log(`HLS stream for ${res.height}p created at ${output}`);
          try {
            const s3Key = `${s3outputBasePath}/${safeFileName}${res.height}p.m3u8`;

            const m3u8URL = await uploadToS3(output, s3Key);
            console.log("Playlist uploaded to DigitalOcean Space.");
            resolve(m3u8URL);

            setImmediate(async () => {
              const files = fs.readdirSync(outputPath);
              for (const tsFile of files) {
                if (tsFile.endsWith(".ts")) {
                  const tsFilePath = path.join(outputPath, tsFile);
                  console.log("Uploading .ts file", tsFilePath);
                  await uploadToS3(tsFilePath, `${s3outputBasePath}/${tsFile}`);
                  console.log(`Uploaded ${tsFile} to DigitalOcean Space.`);
                }
              }

              await removeLocalFiles(outputPath);
              console.log('Local files removed after upload.');
            });

          } catch (error) {
            console.error("Error during upload or file deletion:", error);
            reject(error);
          }
        })
        .run();
    });
  });

  return await Promise.all(promises).then(result => result[0]);
}


module.exports = {
  upload_file,
  deleteFromS3,
  uploadVideo
}