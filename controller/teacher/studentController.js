require('dotenv').config();
const db = require('../../config/db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { Op, Sequelize, where } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { PhoneNumberUtil, PhoneNumberFormat } = require("google-libphonenumber");
const { error } = require('console');
const { upload_file, deleteFromS3, uploadVideo } = require("../../helpers/s3_upload")
const phoneUtil = PhoneNumberUtil.getInstance()
const moment = require('moment');
const messsage = require('../../model/messsage');



const studentAttendance = async (req, res) => {
    if (req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { student_id, attendance_status } = req.body;

        const student = await db.Student.findOne({
            where: {
                id: student_id,
                teacher_id: req.user.id,
                request_status: 'accepted',
            },
        });

        if (!student) {
            return res.status(404).json({ status: 0, message: "Student not found" });
        }

        let attendance = {}
        attendance = await db.StudentAttendance.findOne({
            where: {
                student_id: student_id,
                date: moment().format('YYYY-MM-DD')
            },
        });

        if (attendance && attendance.is_submitted) {
            return res.status(400).json({ status: 0, message: "Attendance already submitted for today" });
        }

        if (!attendance && attendance_status === 'out') {
            return res.status(400).json({ status: 0, message: "Attendance not found for today" });
        }

        if (attendance && attendance_status == "out") {
            await attendance.update({ out_time: moment().toDate(), is_out : true })
        }

        if (attendance && (attendance_status === 'present' || attendance_status === 'absent')) {
            await attendance.update({ present_time: moment().toDate(), attendance_status : attendance_status })
        }

        // await attendance.save();
        if (!attendance && attendance_status != 'out') {
            attendance = await db.StudentAttendance.create({
                student_id: student_id,
                date: moment().format('YYYY-MM-DD'),
                attendance_status: attendance_status,
                teacher_id: req.user.id,
                school_id: req.user.school_id,
                parent_id: student.parent_id,
                present_time: moment().toDate()
            });
        }

        return res.status(200).json({
            status: 1,
            message: "Attendance updated successfully",
            data: attendance
        });

    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const submittedAttedance = async (req, res) => {
    if (req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const attendance = await db.StudentAttendance.update(
            {
                is_submitted: true
            },
            {
                where: {
                    teacher_id: req.user.id,
                    date: moment().format('YYYY-MM-DD')
                }
            }
        );
        if (attendance.is_submitted) {
            return res.status(400).json({ status: 0, messsage: "Attendance allready submitted" })
        }

        return res.status(200).json({
            status: 1,
            message: "Attendance submitted successfully",
        })

    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const listStudentAttedance = async (req, res) => {
    if (req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { type, page, date, search } = req.query
        const limit = 10;
        const offset = (page - 1) * limit;

        const whereCondition = {
            teacher_id: req.user.id,
            ...(date ? { date } : { date: moment().format('YYYY-MM-DD') }),
            attendance_status: type
        };

        if (search) {
            whereCondition[Op.or] = [
                Sequelize.where(
                    Sequelize.literal(`(
        SELECT t2.full_name
        FROM tbl_student t2
        WHERE t2.id = StudentAttendance.student_id
      )`),
                    {
                        [Op.like]: `%${search}%`
                    }
                )
            ];
        }

        const outWhereCondition = {
            teacher_id: req.user.id,
            ...(date ? { date } : { date: moment().format('YYYY-MM-DD') }),
            is_out: true
        };

        if (search) {
            outWhereCondition[Op.or] = [
                Sequelize.where(
                    Sequelize.literal(`(
        SELECT t2.full_name
        FROM tbl_student t2
        WHERE t2.id = StudentAttendance.student_id
      )`),
                    {
                        [Op.like]: `%${search}%`
                    }
                )
            ];
        }

        let attendance = []
        if (type == "present" || type == "absent") {
            attendance = await db.StudentAttendance.findAndCountAll({
                where: whereCondition,
                include: [
                    {
                        model: db.Student,
                        as: 'studentAttendance',
                        attributes: [],
                    }
                ],
                attributes: {
                    include: [
                        [
                            Sequelize.literal(`(
                           SELECT t2.full_name
                           FROM tbl_student t2
                           WHERE t2.id = StudentAttendance.student_id
                        )`),
                            'student_name',
                        ],
                    ]
                },
                limit,
                offset,
                order: [['id', 'DESC']]
            });
        } else if (type == "out") {
            attendance = await db.StudentAttendance.findAndCountAll({
                where: outWhereCondition,
                include: [
                    {
                        model: db.Student,
                        as: 'studentAttendance',
                        attributes: [],
                    }
                ],
                attributes: {
                    include: [
                        [
                            Sequelize.literal(`(
                            SELECT t2.full_name
                            FROM tbl_student t2
                            WHERE t2.id = StudentAttendance.student_id
                        )`),
                            'student_name',
                        ],
                    ]
                },
                limit,
                offset,
                order: [['id', 'DESC']]
            });
        }

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

const listStudentTeacher = async (req, res) => {
    if (req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { shift_id, page, search } = req.query

        if (!page) {
            return res.status(400).json({ status: 0, message: "page number is required" })
        }


        const limit = 10
        const offset = (parseInt(page) - 1) * limit
        if (shift_id) {
            const shift = await db.Shift.findAll({
                where: { id: shift_id, school_id: req.user.school_id },
            })
            if (!shift) {
                return res.status(404).json({ status: 0, message: "Shift not found" })
            }
        }

        const student = await db.Student.findAndCountAll({
            where: {
                teacher_id: req.user.id,
                request_status: 'accepted',
                ...(search && {
                    full_name: {
                        [Op.like]: `%${search}%`
                    }
                }),
                ...(shift_id && { shift_id: shift_id })
            },
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

                ]
            },
            limit,
            offset
        })

        return res.status(200).json({
            status: 1,
            message: "Student list retrieved successfully",
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
    if (req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { student_id } = req.query

        if (!student_id) {
            return res.status(400).json({ status: 0, message: "student_id is required" })
        }

        const student = await db.Student.findOne({
            where: {
                id: student_id,
                teacher_id: req.user.id
            },
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
            include: [
                {
                    model: db.User,
                    as: 'StudentParent',
                    attributes: ['id', 'full_name', 'gender', 'address', 'mobile_no', 'country_code', 'iso_code'],
                }
            ]
        })

        if (!student) {
            return res.status(404).json({ status: 0, message: "Student not found" })
        }

        return res.status(200).json({
            status: 1,
            messsage: "student retrieved successfully",
            data: student
        })

    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const getStudentAttedance = async (req, res) => {
    if (req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { student_id, page } = req.query
        const limit = 10
        const offset = (page - 1) * limit

        const student = await db.Student.findOne({
            where: {
                id: student_id,
                teacher_id: req.user.id
            },
        })

        if (!student) {
            return res.status(404).json({ status: 0, message: "Student not found" })
        }

        const attendance = await db.StudentAttendance.findAndCountAll({
            where: {
                student_id: student_id,
                teacher_id: req.user.id
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

const getStudent = async (req, res) => {
    if (req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page, search } = req.query
        if (!page) {
            return res.status(400).json({ status: 0, message: "page number is required" })
        }
        const limit = 10
        const offset = (page - 1) * limit

        const student = await db.Student.findAndCountAll({
            attributes: ["id", "full_name"],
            where: {
                teacher_id: req.user.id,
                ...(search
                    ? {
                        full_name: {
                            [Op.like]: `%${search}%`
                        }
                    }
                    : {})
            },
            include: [
                {
                    model: db.StudentAttendance,
                    as: 'Attendance',
                    where: {
                        teacher_id: req.user.id,
                        date: moment().format('YYYY-MM-DD')
                    },
                    required: false
                }
            ],
            limit,
            offset,
            order: [['id', 'DESC']],
        })

        const studentIds = student.rows.map((student) => student.id)

        const existeAttedance = await db.StudentAttendance.findAll({
            where: {
                student_id: { [Op.in]: studentIds },
                date: moment().format('YYYY-MM-DD')
            }
        })

        let is_attedance = false
        if (student.length === existeAttedance.length) {
            is_attedance = true
        }

        return res.status(200).json({
            status: 1,
            message: "student retrieved successfully",
            is_attedance,
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

const studentProfilePicEdit = async (req, res) => {
    if (req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { student_id } = req.body
        const profileImage = req.files?.profile_pic[0];

        if (!student_id) {
            return res.status(400).json({ status: 0, message: "student_id is required" })
        }

        const student = await db.Student.findOne({
            where: {
                id: student_id,
                teacher_id: req.user.id
            },
        })

        if (!student) {
            return res.status(404).json({ status: 0, message: "Student not found" })
        }

        if (profileImage && student.profile_pic) {
            await deleteFromS3(student.profile_pic);
        }
        if (req.files && req.files.profile_pic) {
            var newProfilePicPath = await upload_file(profileImage, 'profile_pic/')
        }

        await student.update({
            profile_pic: newProfilePicPath
        })

        return res.status(200).json({
            status: 1,
            messsage: "student profile pic edit successfully",
            data: student
        })

    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}



module.exports = {
    studentAttendance,
    submittedAttedance,
    listStudentAttedance,

    listStudentTeacher,
    studentDetails,
    getStudentAttedance,
    getStudent,

    studentProfilePicEdit,

}