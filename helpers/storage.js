const multer = require("multer");

// <----------------------memoryStorage------------------------->
const storage = multer.memoryStorage();
const limits = {
    fileSize: 5024 * 5024 * 1, // 25MB
};

const upload = multer({ storage, limits });


// exports.upload = multer({
//     storage: multer.diskStorage({
//         destination: (req, file, cb) => {
//             let folder = '';
//             if (file.fieldname === 'profile_pic') folder = 'profile_pic';
//             else if (file.fieldname === 'service_pic') folder = 'service_pic';
//             else if (file.fieldname === 'banner_image') folder = 'banner_image';
//             else if (file.fieldname === 'document') folder = 'document';
//             else if (file.fieldname === 'service_image') folder = 'service_image';
//             else if (file.fieldname === 'thumbnail') folder = 'thumbnail';
//             else if (file.fieldname === 'back_id_proof') folder = 'id_proof';
//             else if (file.fieldname === 'front_id_proof') folder = 'id_proof';
//             else if (file.fieldname === 'review_image') folder = 'review_image';
//             else if (file.fieldname === 'chat_media') folder = 'chat_media';
//             else if (file.fieldname === 'service_document') folder = 'service_document';

//             else return cb(new Error('Invalid file fieldname'), false);
//             const uploadPath = `./uploads/${folder}`;
//             if (!fs.existsSync(uploadPath)) {
//                 fs.mkdirSync(uploadPath, { recursive: true });
//             }
//             cb(null, uploadPath);
//         },
//         filename: (req, file, cb) => {
//             cb(null, `${Date.now()}-${file.originalname}`);
//         },
//     })
// });

module.exports = { upload }