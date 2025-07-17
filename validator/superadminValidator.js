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


exports.addSchoolValidation = () => {
    return [
        [
            check('name').not().isEmpty().withMessage('School Name is required'),
            check('email').not().isEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
            check('address').not().isEmpty().withMessage('address is required'),
        ],
        validation
    ];
}

exports.updateSchoolValidation = () => {
    return [
        [
            check('name').optional().not().isEmpty().withMessage('School Name is required'),
            check('address').optional().not().isEmpty().withMessage('address is required'),
            check('id').not().isEmpty().withMessage('School id is required'),
        ],
        validation
    ];
}

exports.changeSchoolPasswordValidation = () => {
    return [
        [
            check('id').not().isEmpty().withMessage('School id is required'),
             check("password")
                .notEmpty().withMessage("Password is required")
                .isLength({ min: 8, max: 20 }).withMessage("Password must be between 8 and 20 characters long"),
        ],
        validation
    ];
}

