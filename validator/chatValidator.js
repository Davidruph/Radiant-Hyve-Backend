const { check, validationResult } = require('express-validator');
const fs = require('fs');

const validation = (req, res, next) => {
    console.log("API path", `------>BaseUrl/${req.url}`);
    console.log("<<input>>req.query", req.query);
    console.log("<<input>>req.body", req.body);
    console.log("<<input>>req.files", req.files);
    console.log("<<input>>req.file", req.file);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (error) {
                console.log(error);
            }
        }

        if (req.files) {
            Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => {
                    try {
                        fs.unlinkSync(file.path);
                    } catch (error) {
                        console.log(error);
                    }
                });
            });
        }
        return res.status(400).json({
            Status: 0,
            message: errors.array()[0].msg,
            type: errors.array()[0].type,
            value: errors.array()[0].value,
            path: errors.array()[0].path,
            location: errors.array()[0].location,
            error: errors
        });
    }
    next();
}



exports.getChatMessages = () => {
    return [
        [
            check("chat_id").not().isEmpty().withMessage("chat_id is required"),
            check("page").optional().isNumeric().withMessage("page must be a number"),
        ],
        validation
    ]
}


exports.sendMessageValidator = () => {
    return [
        [
            check("chat_id").not().isEmpty().withMessage("chat_id is required"),
            check("other_id").not().isEmpty().withMessage("other_id is required"),
            check("message_type").isString().withMessage("message_type is required"),
            check("file_name").optional().isString().withMessage("file_name is required"),
            check("media_text").optional().isString().withMessage("media_text is required"),
            check("message_text").optional().isString().withMessage("message_text must be a string"),
            check("media")
                .custom((value, { req }) => {
                    const maxFiles = 10;
                    const allowedMimeTypes = [
                        'image/jpeg',
                        'image/jpg',
                        'image/png',
                        'image/gif',
                        'video/mp4',
                        'video/avi',
                        'video/webm',
                        'video/x-msvideo',
                        'video/quicktime',
                        'video/mpeg',
                        'video/x-matroska',
                        'video/3gpp',
                        'video/3gpp2',
                        'video/x-flv',
                        'video/x-ms-wmv',
                        'video/x-ms-asf',
                        'video/x-m4v',
                        'application/octet-stream'
                    ];
                    const maxSize = 20 * 1024 * 1024;

                    const files = req.files?.media;

                    if (!files || !Array.isArray(files) || files.length === 0) {
                        return true;
                    }

                    if (files.length > maxFiles) {
                        files.forEach(file => {
                            try {
                                fs.unlinkSync(file.path);
                            } catch (e) {
                                console.log("File already deleted or not found");
                            }
                        });
                        throw new Error(`Maximum ${maxFiles} file(s) allowed!`);
                    }

                    const file = files[0];

                    if (!allowedMimeTypes.includes(file.mimetype)) {
                        try {
                            fs.unlinkSync(file.path);
                        } catch (e) {
                            console.log("File already deleted or not found");
                        }
                        throw new Error(`Only JPG, JPEG, PNG,  GIF, mp4, avi, webm, x-msvideo, quicktime, mpeg and x-m4v files are allowed!`);
                    }

                    if (file.size > maxSize) {
                        try {
                            fs.unlinkSync(file.path);
                        } catch (e) {
                            console.log("File already deleted or not found");
                        }
                        throw new Error("File size must be less than 5 MB!");
                    }

                    return true;
                }),
            check("thumbnail")
                .custom((value, { req }) => {
                    const maxFiles = 10;
                    const allowedMimeTypes = [
                        'image/jpeg',
                        'image/jpg',
                        'image/png',
                        'image/gif',
                        'application/octet-stream',
                    ];
                    const maxSize = 20 * 1024 * 1024; // 5 MB

                    const files = req.files?.thumbnail;

                    if (!files || !Array.isArray(files) || files.length === 0) {
                        return true;
                    }

                    if (files.length > maxFiles) {
                        files.forEach(file => {
                            try {
                                fs.unlinkSync(file.path);
                            } catch (e) {
                                console.log("File already deleted or not found");
                            }
                        });
                        throw new Error(`Maximum ${maxFiles} file(s) allowed!`);
                    }

                    const file = files[0];

                    if (!allowedMimeTypes.includes(file.mimetype)) {
                        try {
                            fs.unlinkSync(file.path);
                        } catch (e) {
                            console.log("File already deleted or not found");
                        }
                        throw new Error("Only JPG, JPEG, PNG,  files are allowed!");
                    }

                    if (file.size > maxSize) {
                        try {
                            fs.unlinkSync(file.path);
                        } catch (e) {
                            console.log("File already deleted or not found");
                        }
                        throw new Error("File size must be less than 5 MB!");
                    }

                    return true;
                }),
        ],
        validation
    ]
}
