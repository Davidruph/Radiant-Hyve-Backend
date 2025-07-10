require('dotenv').config();
const db = require('../../config/db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { Op, Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { PhoneNumberUtil, PhoneNumberFormat } = require("google-libphonenumber");
const { error } = require('console');
const { upload_file, deleteFromS3, uploadVideo } = require("../../helpers/s3_upload")
const phoneUtil = PhoneNumberUtil.getInstance()



const listStudent = async (req, res) => {
    if (req.user.role != "parent") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page } = req.query
        if (!page) {
            return res.status(400).json({ status: 0, message: "page number is required" })
        }
        const limit = 10
        const offset = (page - 1) * limit

        const student = await db.Student.findAndCountAll({
            attributes: {
                include: [
                    [Sequelize.literal(`(
            SELECT t2.shift_name
            FROM tbl_shift t2
            WHERE t2.id = Student.shift_id
        )`), 'shift_name'],
                    [Sequelize.literal(`(
            SELECT t2.full_name
            FROM tbl_user t2
            WHERE t2.id = Student.teacher_id
        )`), 'teacher_name']
                ]
            },
            where: {
                parent_id: req.user.id,
                request_status: {
                    [Op.not]: 'inActive'
                }
            },
            limit,
            offset,
            order: [['id', 'DESC']],
        });


        return res.status(200).json({
            status: 1,
            message: "student retrieved successfully",
            total_student: student.count,
            current_page: parseInt(page),
            total_page: Math.ceil(student.count / limit),
            data: student.rows
        })

    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const getStudent = async (req, res) => {
    if (req.user.role != "parent") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { student_id } = req.query

        if (!student_id) {
            return res.status(400).json({ status: 0, message: "student_id is required" })
        }

        const student = await db.Student.findOne({
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
                    [
                        Sequelize.literal(`(
                           SELECT t2.profile_pic
                           FROM tbl_user t2
                           WHERE t2.id = Student.teacher_id
                        )`),
                        'teacher_profile_pic',
                    ],
                    [
                        Sequelize.literal(`(
                        SELECT t2.id
                        FROM tbl_chat t2
                        WHERE (
                        (t2.chat_by = Student.teacher_id AND t2.chat_to = ${req.user.id}) OR
                         (t2.chat_by = ${req.user.id} AND t2.chat_to = Student.teacher_id)
                       )
                    )`),
                        'chat_id',
                    ],
                ]
            },
            where: {
                id: student_id,
                parent_id: req.user.id,
                request_status: {
                    [Op.not]: 'inActive'
                }
            },
        })

        if (!student) {
            return res.status(404).json({ status: 0, message: 'Student not found' })
        }

        return res.status(200).json({
            status: 1,
            message: "student retrieved successfully",
            data: student
        })

    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const listActiveStudent = async (req, res) => {
    if (req.user.role != "parent") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page } = req.query
        if (!page) {
            return res.status(400).json({ status: 0, message: "page number is required" })
        }
        const limit = 10
        const offset = (page - 1) * limit

        const student = await db.Student.findAndCountAll({
            attributes: [
                "id",
                "full_name",
                "relation_to_child",
                "request_status",
                [Sequelize.literal(`(
            SELECT t2.shift_name
            FROM tbl_shift t2
            WHERE t2.id = Student.shift_id
        )`), 'shift_name']
            ],
            where: {
                parent_id: req.user.id,
                request_status: "accepted"
            },
            limit,
            offset,
            order: [['id', 'DESC']],
        });

        return res.status(200).json({
            status: 1,
            message: "student retrieved successfully",
            total_student: student.count,
            current_page: parseInt(page),
            total_page: Math.ceil(student.count / limit),
            data: student.rows
        })

    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const studentDetails = async (req, res) => {
    if (req.user.role != "parent") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { student_id, type, page } = req.query
        let limit = 10
        let offset = (page - 1) * limit;

        const student = await db.Student.findOne({
            where: {
                parent_id: req.user.id,
                request_status: "accepted"
            },
        })

        if (!student) {
            return res.status(404).json({ status: 0, message: 'Student not found' })
        }

        let details
        if (type == "menu") {
            details = await db.Menu.findAll({
                where: {
                    [Op.or]: {
                        student_id: student_id,
                        is_all: true
                    },
                    school_id: req.user.school_id
                },
                include: [
                    {
                        model: db.MenuDay,
                        as: 'MenuDay',
                    },
                    {
                        model: db.Student,
                        as: 'student',
                        attributes: ["id", "full_name"]
                    }
                ],
                order: [['id', 'DESC']],
                limit,
                offset
            })
        } else if (type == "sleeplog") {
            details = await db.SleepLoag.findOne({
                where: { student_id },
            })
        } else if (type == "medication") {
            details = await db.MedicationInfo.findAll({
                where: { student_id },
                attributes: {
                    include: [
                        [
                            Sequelize.literal(`(
                           SELECT t2.full_name
                           FROM tbl_student t2
                           WHERE t2.id = MedicationInfo.student_id
                        )`),
                            'student_name',
                        ],
                    ]
                },
                order: [['id', 'DESC']],
                limit,
                offset
            })
        }

        return res.status(200).json({
            status: 1,
            message: "student details retrieved successfully",
            data: details
        })

    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const editProfile = async (req, res) => {
    if (req.user.role != "parent") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { full_name, gender, mobile_no, country_code, iso_code, address } = req.body

        const parent = await db.User.findOne({
            where: {
                id: req.user.id,
                school_id: req.user.school_id,
                is_deleted: false
            },
        })

        if (!parent) {
            return res.status(404).json({ status: 0, message: "parent not found" })
        }

        let profileImage = null;
        if (req.files && req.files.profile_pic && req.files.profile_pic.length > 0) {
            profileImage = req.files.profile_pic[0];
            var newProfilePicPath = await upload_file(profileImage, 'profile_pic/')
        }

        if (req.files?.profile_pic && parent.profile_pic) {
            await deleteFromS3(parent.profile_pic);
        }

        if (mobile_no) {
            const existMobile = await db.User.findOne({
                where: {
                    mobile_no,
                    iso_code,
                    country_code,
                    id: { [Op.not]: req.user.id },
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

        await parent.update({
            gender: gender || parent.gender,
            full_name: full_name || parent.full_name,
            mobile_no: mobile_no || parent.mobile_no,
            country_code: country_code || parent.country_code,
            iso_code: iso_code || parent.iso_code,
            address: address || parent.address,
            profile_pic: newProfilePicPath || parent.profile_pic,
        })

        return res.status(200).json({ status: 1, message: "parent updated successfully", data: parent });

    } catch (error) {
        console.error('Error edit parent:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
};

const getStudentAttedance = async (req, res) => {
    if (req.user.role != "parent") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { student_id, page } = req.query
        if (!student_id || !page) {
            return res.status(400).json({ status: 0, message: "Please provide student_id or page" })
        }
        const limit = 10
        const offset = (page - 1) * limit

        const student = await db.Student.findOne({
            where: {
                id: student_id,
                parent_id: req.user.id,
                school_id: req.user.school_id,
            },
        })

        if (!student) {
            return res.status(404).json({ status: 0, message: "Student not found" })
        }

        const attendance = await db.StudentAttendance.findAndCountAll({
            where: {
                student_id: student_id,
                is_submitted: true
            },
            limit,
            offset,
            order: [['id', 'DESC']]
        })

        return res.status(200).json({
            status: 1,
            message: "Attendance retrieved successfully",
            total_attedance: attendance.count,
            current_page: parseInt(page),
            total_page: Math.ceil(attendance.count / limit),
            data: attendance.rows

        })

    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }

}



module.exports = {
    listStudent,
    getStudent,
    studentDetails,
    listActiveStudent,
    editProfile,
    getStudentAttedance
}