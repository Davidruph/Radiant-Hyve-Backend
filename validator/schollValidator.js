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


exports.updateSchoolValidation = () => {
    return [
        [
            check('name').optional().not().isEmpty().withMessage('School Name is required'),
            check('address').optional().not().isEmpty().withMessage('address is required'),
        ],
        validation
    ];
}

exports.addPrincipalValidation = () => {
    return [
        [
            check('full_name').not().isEmpty().withMessage('full_name is required'),
            check('email').not().isEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
            check('iso_code').not().isEmpty().withMessage('iso_code is required'),
            check('country_code').not().isEmpty().withMessage('country_code is required'),
            check('mobile_no').not().isEmpty().withMessage('mobile_no is required'),
            check('experience').not().isEmpty().withMessage('experience is required'),
            check('designation').not().isEmpty().withMessage('designation is required'),
            check('qualification').not().isEmpty().withMessage('qualification is required'),
            check("gender").not().isEmpty().withMessage("gender is required")
                .isIn(['male', 'female', 'other']).withMessage("Invalid gender, valid gender are: 'male', 'female', 'other'"),
            check("dob")
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
                        throw new Error("profile_pic required!");
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

exports.editPrincipalValidation = () => {
    return [
        [
            check('principal_id').not().isEmpty().withMessage('principal_id is required'),
            check('full_name').optional().not().isEmpty().withMessage('full_name is required'),
            check('iso_code').optional().not().isEmpty().withMessage('iso_code is required'),
            check('country_code').optional().not().isEmpty().withMessage('country_code is required'),
            check('mobile_no').optional().not().isEmpty().withMessage('mobile_no is required'),
            check('experience').optional().not().isEmpty().withMessage('experience is required'),
            check('designation').optional().not().isEmpty().withMessage('designation is required'),
            check('qualification').optional().not().isEmpty().withMessage('qualification is required'),
            check("gender").optional().not().isEmpty().withMessage("gender is required")
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

exports.changePrincipalPasswordValidation = () => {
    return [
        [
            check('principal_id').not().isEmpty().withMessage('principal_id is required'),
            check("password")
                .notEmpty().withMessage("Password is required")
                .isLength({ min: 8, max: 20 }).withMessage("Password must be between 8 and 20 characters long"),
        ],
        validation
    ];
}


exports.addStaffValidation = () => {
    return [
        [
            check('full_name').not().isEmpty().withMessage('full_name is required'),
            check('email').not().isEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
            check('iso_code').not().isEmpty().withMessage('iso_code is required'),
            check('country_code').not().isEmpty().withMessage('country_code is required'),
            check('mobile_no').not().isEmpty().withMessage('mobile_no is required'),
            check('experience').not().isEmpty().withMessage('experience is required'),
            check('about_staff').not().isEmpty().withMessage('about_staff is required'),
            check("gender").not().isEmpty().withMessage("gender is required")
                .isIn(['male', 'female', 'other']).withMessage("Invalid gender, valid gender are: 'male', 'female', 'other'"),
            check("dob")
                .custom(value => moment(value, "YYYY-MM-DD", true).isValid())
                .withMessage("Invalid date format for dob"),
            check("joining_date")
                .custom(value => moment(value, "YYYY-MM-DD", true).isValid())
                .withMessage("Invalid date format for joining_date"),
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
                        throw new Error("profile_pic required!");
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

exports.ediStaffValidation = () => {
    return [
        [
            check('staff_id').not().isEmpty().withMessage('staff_id is required'),
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

exports.changeStaffPasswordValidation = () => {
    return [
        [
            check('staff_id').not().isEmpty().withMessage('staff_id is required'),
            check("password")
                .notEmpty().withMessage("Password is required")
                .isLength({ min: 8, max: 20 }).withMessage("Password must be between 8 and 20 characters long"),
        ],
        validation
    ];
}

exports.getAsingnStudentValidation = () => {
    return [
        [
            check('staff_id').not().isEmpty().withMessage('staff_id is required'),
            check('page').not().isEmpty().withMessage('page is required'),
        ],
        validation
    ];
}

exports.addShiftValidation = () => {
    return [
        [
            check('shift_fee').not().isEmpty().withMessage('shift_fee is required'),
            check('shift_name').not().isEmpty().withMessage('shift_name is required'),
        ],
        validation
    ];
}

exports.editShiftValidation = () => {
    return [
        [
            check('shift_id').not().isEmpty().withMessage('shift_id is required'),
            check('shift_fee').optional().not().isEmpty().withMessage('shift_fee is required'),
            check('shift_name').optional().not().isEmpty().withMessage('shift_name is required'),
        ],
        validation
    ];
}

exports.assignStudentValidation = () => {
    return [
        [
            check('student_id').not().isEmpty().withMessage('student_id is required'),
            check('teacher_id').optional().not().isEmpty().withMessage('teacher_id is required'),
            check('status').not().isEmpty().withMessage('status is required').isIn(['accepted', 'rejected']).withMessage("Invalid value for status. allowed valued are 'accepted', 'rejected'"),
        ],
        validation
    ];
}

exports.listStudentValidation = () => {
    return [
        [
            check('shift_id').not().isEmpty().withMessage('shift_id is required'),
            check('page').not().isEmpty().withMessage('page is required'),
        ],
        validation
    ];
}


exports.addparentlValidation = () => {
    return [
        [
            check('full_name').not().isEmpty().withMessage('full_name is required'),
            check('email').not().isEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
            check('iso_code').not().isEmpty().withMessage('iso_code is required'),
            check('address').not().isEmpty().withMessage('address is required'),
            check('country_code').not().isEmpty().withMessage('country_code is required'),
            check('mobile_no').not().isEmpty().withMessage('mobile_no is required'),
            check("gender").not().isEmpty().withMessage("gender is required")
                .isIn(['male', 'female', 'other']).withMessage("Invalid gender, valid gender are: 'male', 'female', 'other'"),
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

exports.editparentlValidation = () => {
    return [
        [
            check('parent_id').not().isEmpty().withMessage('parent_id is required'),
            check('full_name').optional().not().isEmpty().withMessage('full_name is required'),
            check('iso_code').optional().not().isEmpty().withMessage('iso_code is required'),
            check('country_code').optional().not().isEmpty().withMessage('country_code is required'),
            check('mobile_no').optional().not().isEmpty().withMessage('mobile_no is required'),
            check('address').optional().not().isEmpty().withMessage('address is required'),
            check("gender").optional().not().isEmpty().withMessage("gender is required")
                .isIn(['male', 'female', 'other']).withMessage("Invalid gender, valid gender are: 'male', 'female', 'other'"),
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

exports.changeParentPasswordValidation = () => {
    return [
        [
            check('parent_id').not().isEmpty().withMessage('parent_id is required'),
            check("password")
                .notEmpty().withMessage("Password is required")
                .isLength({ min: 8, max: 20 }).withMessage("Password must be between 8 and 20 characters long"),
        ],
        validation
    ];
}


exports.addCertificateValidation = () => {
    return [
        [
            check('institution_name').not().isEmpty().withMessage('institution_name is required'),
            check('hire_checklist').not().isEmpty().withMessage('hire_checklist is required'),
            check('staff_id').not().isEmpty().withMessage('staff_id is required'),
        ],
        validation
    ];
}

exports.editCertificateValidation = () => {
    return [
        [
            check('certificate_id').not().isEmpty().withMessage('certificate_id is required'),
            check('institution_name').optional().not().isEmpty().withMessage('institution_name is required'),
            check('hire_checklist').optional().not().isEmpty().withMessage('hire_checklist is required'),
            check('staff_id').optional().not().isEmpty().withMessage('staff_id is required'),
        ],
        validation
    ];
}

exports.addMedificationValidation = () => {
    return [
        [
            check('mobile_no').not().isEmpty().withMessage('mobile_no is required'),
            check('country_code').not().isEmpty().withMessage('country_code is required'),
            check('iso_code').not().isEmpty().withMessage('iso_code is required'),
            check('medication_details').not().isEmpty().withMessage('medication_details is required'),
            check('type_disease').not().isEmpty().withMessage('type_disease is required'),
            check('doctor_name').not().isEmpty().withMessage('doctor_name is required'),
            check('student_id').not().isEmpty().withMessage('student_id is required'),
        ],
        validation
    ];
}

exports.editMedificationValidation = () => {
    return [
        [
            check('medication_id').not().isEmpty().withMessage('medication_id is required'),
            check('mobile_no').optional().not().isEmpty().withMessage('mobile_no is required'),
            check('country_code').optional().not().isEmpty().withMessage('country_code is required'),
            check('iso_code').not().optional().isEmpty().withMessage('iso_code is required'),
            check('medication_details').optional().not().isEmpty().withMessage('medication_details is required'),
            check('type_disease').optional().not().isEmpty().withMessage('type_disease is required'),
            check('doctor_name').optional().not().isEmpty().withMessage('doctor_name is required'),
            check('student_id').optional().not().isEmpty().withMessage('student_id is required'),
        ],
        validation
    ];
}


exports.addEventValidation = () => {
    return [
        [
            check('event_name').not().isEmpty().withMessage('event_name is required'),
            check('about_event').not().isEmpty().withMessage('about_event is required'),
            check('color_name').not().isEmpty().withMessage('color_name is required'),
            check('is_all').not().isEmpty().withMessage('is_all is required'),
            check('is_parent').not().isEmpty().withMessage('is_parent is required'),
            check('is_teacher').not().isEmpty().withMessage('is_teacher is required'),
            check('is_principal').not().isEmpty().withMessage('is_principal is required'),
            check("event_date")
                .custom(value => moment(value, "YYYY-MM-DD", true).isValid())
                .withMessage("Invalid event_date format for dob"),
            check("start_time").custom(value => moment(value, "HH:mm", true).isValid())
                .withMessage("Invalid time format for start_time"),
            check("end_time").custom(value => moment(value, "HH:mm", true).isValid())
                .withMessage("Invalid time format for start_time"),
        ],
        validation
    ];
}

exports.editEventValidation = () => {
    return [
        [
            check('event_id').not().isEmpty().withMessage('event_id is required'),
            check('event_name').optional().not().isEmpty().withMessage('event_name is required'),
            check('about_event').optional().not().isEmpty().withMessage('about_event is required'),
            check('color_name').optional().not().isEmpty().withMessage('color_name is required'),
            check('is_all').optional().not().isEmpty().withMessage('is_all is required'),
            check('is_parent').optional().not().isEmpty().withMessage('is_parent is required'),
            check('is_teacher').optional().not().isEmpty().withMessage('is_teacher is required'),
            check('is_principal').optional().not().isEmpty().withMessage('is_principal is required'),
            check("event_date").optional()
                .custom(value => moment(value, "YYYY-MM-DD", true).isValid())
                .withMessage("Invalid event_date format for dob"),
            check("start_time").optional().custom(value => moment(value, "HH:mm", true).isValid())
                .withMessage("Invalid time format for start_time"),
            check("end_time").optional().custom(value => moment(value, "HH:mm", true).isValid())
                .withMessage("Invalid time format for end_time"),
        ],
        validation
    ];
}


exports.addSleepLoagValidation = () => {
    return [
        [
            check('student_id').not().isEmpty().withMessage('student_id is required'),
            check("start_time").custom(value => moment(value, "HH:mm", true).isValid())
                .withMessage("Invalid time format for start_time"),
            check("end_time").custom(value => moment(value, "HH:mm", true).isValid())
                .withMessage("Invalid time format for start_time"),
        ],
        validation
    ];
}

exports.editSleepLoagValidation = () => {
    return [
        [
            check('id').not().isEmpty().withMessage('sleep loag id is required'),
            check("start_time").optional().custom(value => moment(value, "HH:mm", true).isValid())
                .withMessage("Invalid time format for start_time"),
            check("end_time").optional().custom(value => moment(value, "HH:mm", true).isValid())
                .withMessage("Invalid time format for start_time"),
        ],
        validation
    ];
}

exports.addMenuValidation = () => {
    return [
        [
            check('student_id').optional().not().isEmpty().withMessage('student_id is required'),
            check('is_all').not().isEmpty().withMessage('is_all is required'),
            check('menu_days').not().isEmpty().withMessage('menu_days is required'),
            check('menu_type').not().isEmpty().withMessage('menu_type is required'),
            check("menu_date")
                .custom(value => moment(value, "YYYY-MM-DD", true).isValid())
                .withMessage("Invalid menu_date format for dob"),
            check('about_meal').not().isEmpty().withMessage('about_meal is required'),
            check("menu_time").custom(value => moment(value, "HH:mm", true).isValid())
                .withMessage("Invalid time format for start_time"),
        ],
        validation
    ];
}

exports.editMenuValidation = () => {
    return [
        [
            check('menu_id').not().isEmpty().withMessage('menu_id is required'),
            check('student_id').optional().not().isEmpty().withMessage('student_id is required'),
            check('is_all').optional().not().isEmpty().withMessage('is_all is required'),
            check('menu_days').optional().not().isEmpty().withMessage('menu_days is required'),
            check('menu_type').optional().not().isEmpty().withMessage('menu_type is required'),
            check("menu_date").optional()
                .custom(value => moment(value, "YYYY-MM-DD", true).isValid())
                .withMessage("Invalid menu_date format for dob"),
            check('about_meal').optional().not().isEmpty().withMessage('about_meal is required'),
            check("menu_time").optional().custom(value => moment(value, "HH:mm", true).isValid())
                .withMessage("Invalid time format for start_time"),
        ],
        validation
    ];
}

exports.getAttedanceCountValidation = () => {
    return [
        [
            check('user_id').not().isEmpty().withMessage('user_id is required'),
            check('year').not().isEmpty().withMessage('year is required'),
        ],
        validation
    ];
}

exports.makePaymentValidation = () => {
    return [
        [
            check('student_id').not().isEmpty().withMessage('student_id is required'),
            check('month').not().isEmpty().withMessage('month is required'),
            check('year').optional().not().isEmpty().withMessage('year is required'),
            check('comment').optional().not().isEmpty().withMessage('comment is required'),
            check('payment_type').optional().not().isEmpty().withMessage('payment_type is required'),
        ],
        validation
    ];
}

exports.remainingFeesValidation = () => {
    return [
        [
            check('student_id').not().isEmpty().withMessage('student_id is required'),
            check('month').not().isEmpty().withMessage('month is required'),
            check('year').optional().not().isEmpty().withMessage('year is required'),
            check('title').not().isEmpty().withMessage('title is required'),
            check('body').not().isEmpty().withMessage('body is required'),
        ],
        validation
    ];
}

exports.getStudentFeesValidation = () => {
    return [
        [
            check('month').optional().not().isEmpty().withMessage('month is required'),
            check('page').not().isEmpty().withMessage('page is required'),
            check('year').optional().not().isEmpty().withMessage('year is required'),
            check('search').optional().not().isEmpty().withMessage('search is required'),
            check('type').optional().not().isEmpty().withMessage('type is required'),
        ],
        validation
    ];
}



