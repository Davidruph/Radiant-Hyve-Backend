// Import the necessary components from AWS SDK v3
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

// Initialize S3 client with credentials and configuration
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Function to upload a file to S3
const uploadToS3 = async (file, folder) => {
    const fileExt = file.originalname.split('.')[1];
    // const fileExt = file.mimetype.split('/')[1];
    // console.log("file", file)
    const key = `${folder}/${uuidv4()}.${fileExt}`;

    const s3UploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    // Upload the file to S3 using the PutObjectCommand
    const command = new PutObjectCommand(s3UploadParams);
    try {
        const data = await s3Client.send(command); // Send the command using the client
        // console.log("S3-Link", `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`)
        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
        console.error('Error uploading file to S3:', error);
        throw new Error('Failed to upload file to S3');
    }
};

// Function to delete a file from S3
const deleteFromS3 = async (fileUrl) => {
    try {
        // Extract bucket name and key from the file URL
        const bucketName = process.env.AWS_BUCKET_NAME;
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

const uploadMediaInChat = async (media, thumbnails, mediaType, mediaText, documentText, messageText, latitude, longitude) => {
    const uploadedMedia = [];
    try {
        const types = mediaType;
        // const types = mediaType.includes(",") ? mediaType.split(",") : [mediaType];
        let thumbnailIndex = 0;
        let mediaTextIndex = 0;
        let documentTextIndex = 0;
        console.log("types[0]", types[0])
        if (types[0] == "Text" || types[0] == "Location") {
            const object = {
                image: messageText,
                thumbnail: null,
                media_text: null,
                file_name: null,
                message_type: types[0],
                latitude: latitude,
                longitude: longitude
            };
            uploadedMedia.push(object);
        } else {
            for (const [index, element] of media.entries()) {
                const imageUrl = await uploadToS3(element, "chat_images");
                let fileName = null;
                fileName = element.originalname.split('.')[0];
                const object = {
                    image: imageUrl,
                    thumbnail: null,
                    media_text: null,
                    file_name: fileName,
                    message_type: types[index],
                    latitude: latitude,
                    longitude: longitude
                };
                if (types[index] == 'Video' || types[index] == 'Video/Text') {
                    if (thumbnails && thumbnails[thumbnailIndex]) {
                        const thumbnailUrl = await uploadToS3(thumbnails[thumbnailIndex], "chat_images");
                        object.thumbnail = thumbnailUrl;
                        thumbnailIndex++; // Increment thumbnail index only when used
                    }
                }
                if (types[index] == 'Image/Text' || types[index] == 'Video/Text') {
                    if (mediaText && mediaText[mediaTextIndex]) {
                        object.media_text = mediaText[mediaTextIndex];
                        mediaTextIndex++; // Increment thumbnail index only when used
                    }
                }
                if (types[index] == 'Document') {
                    if (documentText && documentText[documentTextIndex]) {
                        object.file_name = documentText[documentTextIndex];
                        documentTextIndex++; // Increment thumbnail index only when used
                    }
                }
                uploadedMedia.push(object);
            }
        }
        return uploadedMedia;

    } catch (error) {
        console.error('Error uploading media to S3:', error);
        throw new Error('Failed to upload media to S3');
    }
};

module.exports = { uploadToS3, deleteFromS3, uploadMediaInChat };
