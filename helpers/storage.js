const multer = require("multer");

// <----------------------memoryStorage------------------------->
const storage = multer.memoryStorage();
const limits = {
    fileSize: 5024 * 5024 * 1, // 25MB
};

const upload = multer({ storage, limits });
module.exports = { upload }