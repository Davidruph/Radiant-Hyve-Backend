require('dotenv').config();
const db = require('../../config/db')
const { Op, Sequelize } = require('sequelize');
const fs = require('fs').promises;
const bcrypt = require('bcrypt')
const path = require("path");
const { error } = require('console');
const { upload } = require('../../helpers/storage');
const { upload_file, deleteFromS3, uploadVideo } = require("../../helpers/s3_upload")
const { PhoneNumberUtil, PhoneNumberFormat } = require("google-libphonenumber");
const phoneUtil = PhoneNumberUtil.getInstance()
const { AddRoleEmail, updateRolePasswordEmail, deleteEmail, blockEmail, unblockEmail } = require('../../helpers/email');

function generateCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstvwxyz0123456789@#$%&*!';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const addStaff = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { email, full_name, gender, dob, about_staff, joining_date, experience, mobile_no, country_code, iso_code } = req.body
        const profileImage = req.files.profile_pic[0];

        const existingUser = await db.User.findOne({ where: { email, is_deleted: false, } })
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" })
        }

        if (req.files && req.files.profile_pic) {
            var newProfilePicPath = await upload_file(profileImage, 'profile_pic/')
        }
        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }
        if (mobile_no) {
            const existMobile = await db.User.findOne({
                where: { mobile_no, iso_code, country_code, is_deleted: false }
            })

            if (existMobile) {
                return res.status(409).json({
                    status: 0,
                    message: 'This mobile number is already registered.'
                });
            }
        }

        if (mobile_no && iso_code && country_code) {
            try {
                var number = phoneUtil.parse(req.body.mobile_no, req.body.iso_code);

            } catch {
                return res.status(400).json({ Status: 0, message: "Number or ISO code not matched." });
            }

            const isValid = phoneUtil.isValidNumber(number);
            if (!isValid) return res.status(400).json({ Status: 0, message: "Phone number is not correct." });

            const isCorrectISO = phoneUtil.getRegionCodeForNumber(number) === req.body.iso_code;
            if (!isCorrectISO) return res.status(400).json({ Status: 0, message: "Phone number is not correct." });
        }
        const password = generateCode(8)
        const hashedPassword = await bcrypt.hash(password, 10)
        const Staff = await db.User.create({
            email: email,
            password: hashedPassword,
            full_name: full_name,
            gender: gender,
            mobile_no,
            country_code,
            iso_code,
            dob: dob,
            joining_date: joining_date,
            about_staff: about_staff,
            profile_pic: newProfilePicPath,
            experience: experience,
            role: 'teacher',
            school_id: school_id
        })

        const school = await db.User.findByPk(school_id)
        await AddRoleEmail(school.school_name, email, password, "Teacher")

        await db.AddRole.create({
            school_id,
            add_to: Staff.id,
            add_by: req.user.id,
            add_role: "teacher"
        })

        return res.status(200).json({
            status: 1,
            message: "Staff Added Successfully",
            data: Staff
        })

    } catch (error) {
        console.error('Error adding principal:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const editStaff = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { staff_id, full_name, gender, dob, about_staff, joining_date, experience, mobile_no, country_code, iso_code } = req.body

        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }
        const staff = await db.User.findOne({
            where: {
                id: staff_id,
                role: "teacher",
                school_id,
                is_deleted: false
            },
        })

        if (!staff) {
            return res.status(404).json({ status: 0, message: "staff not found" })
        }

        let profileImage = null;
        if (req.files && req.files.profile_pic && req.files.profile_pic.length > 0) {
            profileImage = req.files.profile_pic[0];
            var newProfilePicPath = await upload_file(profileImage, 'profile_pic/')
        }

        if (req.files?.profile_pic && staff.profile_pic) {
            await deleteFromS3(staff.profile_pic);
        }

        if (mobile_no) {
            const existMobile = await db.User.findOne({
                where: {
                    mobile_no,
                    iso_code,
                    country_code,
                    id: { [Op.not]: staff_id },
                    is_deleted: false
                }
            })

            if (existMobile) {
                return res.status(409).json({
                    status: 0,
                    message: 'This mobile number is already registered.'
                });
            }
        }

        if (mobile_no && iso_code && country_code) {
            try {
                var number = phoneUtil.parse(req.body.mobile_no, req.body.iso_code);

            } catch {
                return res.status(400).json({ Status: 0, message: "Number or ISO code not matched." });
            }

            const isValid = phoneUtil.isValidNumber(number);
            if (!isValid) return res.status(400).json({ Status: 0, message: "Phone number is not correct." });

            const isCorrectISO = phoneUtil.getRegionCodeForNumber(number) === req.body.iso_code;
            if (!isCorrectISO) return res.status(400).json({ Status: 0, message: "Phone number is not correct." });
        }

        await staff.update({
            gender: gender || staff.gender,
            full_name: full_name || staff.full_name,
            mobile_no: mobile_no || staff.mobile_no,
            country_code: country_code || staff.country_code,
            iso_code: iso_code || staff.iso_code,
            dob: dob || staff.dob,
            about_staff: about_staff || staff.about_staff,
            joining_date: joining_date || staff.joining_date,
            profile_pic: newProfilePicPath || staff.profile_pic,
            experience: experience || staff.experience,
        })

        return res.status(200).json({ status: 1, message: "staff updated successfully", data: staff });

    } catch (error) {
        console.error('Error edit staff:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
};

const changeStaffPassword = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { password, staff_id } = req.body

        let school_id = null
        // let principal = {};
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const staff = await db.User.findOne({
            where: {
                id: staff_id,
                school_id,
                role: "teacher",
                is_deleted: false
            },
        })

        if (!staff) {
            return res.status(404).json({ status: 0, message: "staff not found" })
        }
        const hashedPassword = await bcrypt.hash(password, 10)

        await staff.update({
            password: hashedPassword
        })

        const school = await db.User.findByPk(school_id)
        await updateRolePasswordEmail(school.school_name, staff.email, password, "Teacher")

        await db.Token.destroy({
            where: {
                user_id: staff_id,
            },
        });

        return res.status(200).json({
            status: 1,
            message: "Password changed successfully",
        })

    } catch (error) {
        console.error('Error edit principal:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const listStaff = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page, search } = req.query
        if (!page) {
            return res.status(400).json({ status: 0, message: 'page is required' });
        }
        const limit = 10
        const offset = (page - 1) * limit

        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const whereCondition = {
            role: "teacher",
            school_id,
            is_deleted: false
        };

        if (search) {
            whereCondition[Op.or] = [
                { full_name: { [Op.like]: `${search}%` } },
                { email: { [Op.like]: `${search}%` } }
            ];
        }

        const Staff = await db.User.findAndCountAll({
            where: whereCondition,
            attributes: ["id", "email", "full_name", "gender", "is_blocked", "is_deleted",
                [
                    Sequelize.literal(`(
                          SELECT t2.clock_in_time
                          FROM tbl_attendance t2
                          WHERE t2.user_id = User.id
                          ORDER BY t2.id DESC
                          LIMIT 1
                        )`),
                    'clock_in_time'
                ],
                [
                    Sequelize.literal(`(
                          SELECT t2.clock_out_time
                          FROM tbl_attendance t2
                          WHERE t2.user_id = User.id
                          ORDER BY t2.id DESC
                          LIMIT 1
                        )`),
                    'clock_out_time'
                ],

            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        })

        return res.status(200).json({
            status: 1,
            message: 'Staff retrieved successfully',
            total_staff: Staff.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(Staff.count / limit),
            data: Staff.rows
        });

    } catch (error) {
        console.error('Error list Staff:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const getStaff = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { staff_id } = req.query

        if (!staff_id) {
            return res.status(400).json({ status: 0, message: 'staff_id is requried' })
        }

        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const Staff = await db.User.findOne({
            where: {
                id: staff_id,
                is_deleted: false,
                role: "teacher",
                school_id
            },
            attributes: ["id", "email", "password", "full_name", "gender", "dob", "about_staff", "joining_date", "experience", "mobile_no", "country_code", "iso_code", "profile_pic", "is_blocked", "is_deleted",
                [
                    Sequelize.literal(`(
                                SELECT COUNT(*) 
                                FROM tbl_student t2 
                                WHERE t2.teacher_id = ${staff_id}
                            )`),
                    "total_student"
                ],
                [
                    Sequelize.literal(`(
                        SELECT t2.id
                        FROM tbl_chat t2
                        WHERE (
                        (t2.chat_by = User.id AND t2.chat_to = ${req.user.id}) OR
                         (t2.chat_by = ${req.user.id} AND t2.chat_to = User.id)
                       )
                    )`),
                    'chat_id',
                ],
            ],
        })

        if (!Staff) {
            return res.status(404).json({ status: 2, message: "Staff not found" })
        }

        return res.status(200).json({
            status: 1,
            message: 'Staff get successfully',
            data: Staff
        });

    } catch (error) {
        console.error('Error get Staff:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const deleteStaff = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { staff_id, delete_reason } = req.query

        if (!staff_id) {
            return res.status(400).json({ status: 0, message: 'staff_id is requried' })
        }

        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const Staff = await db.User.findOne({
            where: {
                id: staff_id,
                role: "teacher",
                school_id,
                is_deleted: false
            },
        })

        if (!Staff) {
            return res.status(404).json({ status: 0, message: "Staff not found" })
        }

        await db.Chat.destroy({
            where: {
                chat_by: school_id,
                chat_to: staff_id,
                school_id
            }
        })

        await Staff.update({
            is_deleted: true
        })

        const school = await db.User.findByPk(school_id);
        const reason = delete_reason || "No reason admin";
        await deleteEmail(school.school_name, Staff.email, reason, "Teacher", Staff.full_name);

        await db.Token.destroy({
            where: {
                user_id: staff_id
            }
        })

        return res.status(200).json({
            status: 1,
            message: 'Staff deleted successfully',
        })

    } catch (error) {
        console.error('Error delete Staff:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const blockStaff = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { staff_id, block_reason } = req.body

        if (!staff_id) {
            return res.status(400).json({ status: 0, message: 'staff_id is requried' })
        }

        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const Staff = await db.User.findOne({
            where: {
                id: staff_id,
                role: "teacher",
                school_id,
                is_deleted: false
            },
        })

        if (!Staff) {
            return res.status(404).json({ status: 0, message: "Staff not found" })
        }

        const wasBlocked = Staff.is_blocked;
        const newIsBlockedStatus = !wasBlocked;

        await Staff.update({
            is_blocked: newIsBlockedStatus,
            block_reason: block_reason || null
        });

        const school = await db.User.findByPk(school_id);
        if (Staff.is_blocked == true) {
            await db.Token.destroy({ where: { user_id: staff_id } });
            const reason = block_reason || "No reason admin";
            await blockEmail(Staff.full_name, school.school_name, Staff.email, "Teacher", reason)
        } else {
            await unblockEmail(Staff.full_name, school.school_name, Staff.email, "Teacher")
        }

        return res.status(200).json({
            status: 1,
            message: newIsBlockedStatus
                ? "Staff blocked successfully"
                : "Staff unblocked successfully",
            data: {
                id: Staff.id,
                is_blocked: Staff.is_blocked,
                block_reason: Staff.block_reason
            }
        });
    } catch (error) {
        console.error("Error processing block/unblock request:", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error" });
    }
}

const assignStudentList = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { staff_id, page, search, shift_id } = req.query
        const limit = 10
        const offset = (page - 1) * limit
        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const Staff = await db.User.findOne({
            where: {
                id: staff_id,
                role: "teacher",
                school_id,
                is_deleted: false
            },
        })

        if (!Staff) {
            return res.status(404).json({ status: 0, message: "Staff not found" })
        }

        if (shift_id) {
            const shift = await db.Shift.findAll({
                where: { id: shift_id, school_id },
            })
            if (!shift) {
                return res.status(404).json({ status: 0, message: "Shift not found" })
            }
        }

        const whereClause = {
            teacher_id: staff_id,
            ...(shift_id && { shift_id: shift_id })
        };

        if (search) {
            whereClause[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
                { parent_name: { [Op.like]: `%${search}%` } },
            ];
        }

        const student = await db.Student.findAndCountAll({
            where: whereClause,
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                        SELECT t2.shift_name
                        FROM tbl_shift t2
                        WHERE t2.id = Student.shift_id
                    )`),
                        'shift_name',
                    ],
                    [
                        Sequelize.literal(`(
                        SELECT t2.full_name
                        FROM tbl_user t2
                        WHERE t2.id = Student.teacher_id
                    )`),
                        'teacher_name',
                    ],
                ]
            },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        })

        return res.status(200).json({
            status: 1,
            message: 'Staff assign student retrieved successfully',
            total_school: student.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(student.count / limit),
            data: student.rows
        });
    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error" });
    }
}

const allLeave = async (req, res) => {
    if (req.user.role != "school") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page, type } = req.query

        if (!page) {
            return res.status(400).json({ status: 0, message: 'page is required' });
        }
        const limit = 10;
        const offset = (parseInt(page) - 1) * limit;
        const whereClause = { school_id: req.user.id }
        if (type) {
            whereClause.leave_request_status = type
        }

        const leave = await db.Leave.findAndCountAll({
            where: whereClause,
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                           SELECT t2.full_name
                           FROM tbl_user t2
                           WHERE t2.id = Leave.teacher_id
                        )`),
                        'teacher_name',
                    ],
                    [
                        Sequelize.literal(`(
                           SELECT t2.profile_pic
                           FROM tbl_user t2
                           WHERE t2.id = Leave.teacher_id
                        )`),
                        'profile_pic',
                    ]
                ]
            },
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        return res.status(200).json({
            status: 1,
            message: 'Leave retrieved successfully',
            total_leave: leave.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(leave.count / limit),
            data: leave.rows
        });

    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error" });
    }
}



module.exports = {
    editStaff,
    addStaff,
    getStaff,
    listStaff,
    changeStaffPassword,
    deleteStaff,
    blockStaff,
    assignStudentList,
    allLeave
}