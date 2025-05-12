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


exports.loginValidation = () => {
    return [
        [
            check("email").not().isEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format"),
            check("role").not().isEmpty().withMessage("Role is required")
                .isIn(['super_admin', 'school', 'teacher', 'parent', 'principal']).withMessage("Invalid role, valid roles are: super_admin, school, teacher, parent, principal"),
            check("password").not().isEmpty().withMessage("password is required").trim(),
            check("device_type").not().isEmpty().withMessage("Device type is required").trim(),
            check("device_token").not().isEmpty().withMessage("Device token is required").trim(),
            check("device_id").not().isEmpty().withMessage("Device ID is required").trim(),
        ],
        validation
    ];
}

exports.superAdminLoginValidation = () => {
    return [
        [
            check("email").not().isEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format"),
            check("password").not().isEmpty().withMessage("password is required").trim(),
            check("device_type").not().isEmpty().withMessage("Device type is required").trim(),
            check("device_token").not().isEmpty().withMessage("Device token is required").trim(),
            check("device_id").not().isEmpty().withMessage("Device ID is required").trim(),
        ],
        validation
    ];
}

exports.forgotPasswordValidation = () => {
    return [
        [
            check("email").not().isEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format"),
            check("role").not().isEmpty().withMessage("Role is required")
                .isIn(['super_admin', 'school', 'teacher', 'parent', 'principal']).withMessage("Invalid role, valid roles are: super_admin, school, teacher, parent, principal"),
        ],
        validation
    ]
}

exports.forgoteVerifyValidation = () => {
    return [
        [
            check("email").not().isEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format"),
            check("otp").not().isEmpty().withMessage("otp is required").trim(),
            check("role")
                .notEmpty().withMessage("role is required")
                .isIn(['super_admin', 'school', 'teacher', 'parent', 'principal']).withMessage("Invalid role, valid roles are: super_admin, school, teacher, parent, principal"),
        ],
        validation
    ];
}

exports.resetPasswordValidation = () => {
  return [
    [
      check("email").not().isEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format"),
      check("newPassword")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 8, max: 20 }).withMessage("Password must be between 8 and 20 characters long")
    ],
    validation
  ];
}

exports.changePasswordValidation = () => {
  return [
    [
      check("password").notEmpty().withMessage("old_password is required"),
      check("newPassword")
        .notEmpty().withMessage("newPassword is required")
        .isLength({ min: 8, max: 20 }).withMessage("Password must be between 8 and 20 characters long")
    ],
    validation
  ]
}