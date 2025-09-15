const { check, validationResult } = require('express-validator');
const fs = require('fs');
const moment = require('moment')



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


exports.ediStaffValidation = () => {
    return [
        [
            check('full_name').optional().not().isEmpty().withMessage('full_name is required'),
            check('iso_code').optional().not().isEmpty().withMessage('iso_code is required'),
            check('country_code').optional().not().isEmpty().withMessage('country_code is required'),
            check('mobile_no').optional().not().isEmpty().withMessage('mobile_no is required'),
            check('experience').optional().not().isEmpty().withMessage('experience is required'),
            check('about_staff').optional().not().isEmpty().withMessage('about_staff is required'),
            check("joining_date").optional()
                .custom(value => moment(value, "YYYY-MM-DD", true).isValid())
                .withMessage("Invalid date format for joining_date"), check("gender").optional().not().isEmpty().withMessage("gender is required")
                    .isIn(['male', 'female', 'other']).withMessage("Invalid gender, valid gender are: 'male', 'female', 'other'"),
            check("dob").optional()
                .custom(value => moment(value, "YYYY-MM-DD", true).isValid())
                .withMessage("Invalid date format for dob"),
            check("profile_pic")
                .custom((value, { req }) => {
                    const maxFiles = 1;
                    const allowedMimeTypes = [
                        'image/jpeg',
                        'image/jpg',
                        'image/png',
                        'image/gif',
                        'application/octet-stream',
                    ];
                    const maxSize = 10 * 1024 * 1024; // 5 MB

                    const files = req.files?.profile_pic;

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
    ];
}

exports.applyLeaveValidation = () => {
    return [
        [
            check("date")
                .custom(value => moment(value, "YYYY-MM-DD", true).isValid())
                .withMessage("Invalid date format for dob"), 
            check('leave_type').not().isEmpty().withMessage('leave_type is required'),
            check('reason').not().isEmpty().withMessage('reason is required'),
        ],
        validation
    ];
}


exports.studeneAttedanceValidation = () => {
    return [
        [
            check('student_id').not().isEmpty().withMessage('student_id is required'),
            check("attendance_status").not().isEmpty().withMessage("attendance_status is required")
                .isIn(['out', 'present', 'absent']).withMessage("Invalid attendance_status, valid attendance_status are: 'out', 'present', 'absent'"),
            check('parent_name').optional().not().isEmpty().withMessage('parent_name is required'),
            check('relation_to_child').optional().not().isEmpty().withMessage('relation_to_child is required'),
        ],
        validation
    ];
}


exports.listAttedanceValidation = () => {
    return [
        [
            check('page').not().isEmpty().withMessage('page is required'),
            check("type").not().isEmpty().withMessage("type is required")
                .isIn(['out', 'present', 'absent']).withMessage("Invalid type, valid type are: 'out', 'present', 'absent'"),
            check("date").optional()
                .custom(value => moment(value, "YYYY-MM-DD", true).isValid())
                .withMessage("Invalid date format for dob"),
        ],
        validation
    ];
}

exports.getAttedanceValidation = () => {
    return [
        [
            check('page').not().isEmpty().withMessage('page is required'),
            check('student_id').not().isEmpty().withMessage('student_id is required'),
        ],
        validation
    ];
}