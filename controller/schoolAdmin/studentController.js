require('dotenv').config();
const db = require('../../config/db')
const { Op, Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { error } = require('console');
const { upload } = require('../../helpers/storage');
const { studentRequestAccesseptEmail, studentRequestRejectEmail } = require('../../helpers/email')
const { send_notification } = require('../../helpers/notification')


const getNewStudent = async (req, res) => {
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
        const whereClause = { school_id, request_status: 'pending' };

        if (search) {
            whereClause[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
                { parent_name: { [Op.like]: `%${search}%` } },
            ];
        }

        const student = await db.Student.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        })

        return res.status(200).json({
            status: 1,
            message: 'student request retrieved successfully',
            total_student: student.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(student.count / limit),
            data: student.rows
        });
    } catch (error) {
        console.error('Error get student:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const getAllStudent = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" });
    }
    try {
        const { page, shift_id, search } = req.query;
        if (!page) {
            return res.status(400).json({ status: 0, message: 'page is required' });
        }

        const limit = 10;
        const offset = (page - 1) * limit;

        let school_id = null;
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            });
            school_id = principal.school_id;
        } else {
            school_id = req.user.id;
        }

        const whereClause = {
            school_id,
            request_status: { [Op.or]: ['accepted', 'feesPending'] },
        };

        if (shift_id && parseInt(shift_id) !== 0) {
            const shift = await db.Shift.findOne({ where: { school_id } });
            if (!shift) {
                return res.status(404).json({ status: 0, message: 'shift not found' });
            }
            whereClause.shift_id = shift_id;
        }

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
                    ]
                ]
            },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });

        return res.status(200).json({
            status: 1,
            message: 'student request retrieved successfully',
            total_student: student.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(student.count / limit),
            data: student.rows
        });

    } catch (error) {
        console.error('Error get student:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
};


const getStudent = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { student_id } = req.query

        if (!student_id) {
            return res.status(400).json({ status: 0, message: "student_id is require" })
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

        const student = await db.Student.findOne({
            where: { id: student_id, school_id },
            include: [
                {
                    model: db.User,
                    as: "Teacher",
                    attributes: ['id', 'full_name']
                },
                {
                    model: db.Shift,
                    as: "Shift",
                    attributes: ['id', 'shift_name']
                }
            ],
        })

        if (!student) {
            return res.status(404).json({ status: 2, message: "Student not found" })
        }

        return res.status(200).json({
            status: 1,
            message: 'Student retrieved successfully',
            data: student
        })

    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error" });
    }
}

const editStatus = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { student_id, status, rejected_reason } = req.body
        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const student = await db.Student.findOne({
            where: {
                id: student_id,
                request_status: {
                    [Op.or]: ['pending', 'waiting']
                }
                , school_id
            },
        })

        if (!student) {
            return res.status(404).json({ status: 0, message: "Student not found" })
        }

        await student.update({
            request_status: status,
            rejected_reason: rejected_reason || student.rejected_reason
        })

        if (status === 'accepted') {
            const parent = await db.User.findByPk(student.parent_id)
            const school = await db.User.findByPk(school_id)
            await studentRequestAccesseptEmail(student.full_name, parent.email, school.school_name, student.parent_name);
        } else if (status === 'rejected') {
            const parent = await db.User.findByPk(student.parent_id)
            const school = await db.User.findByPk(school_id)
            await studentRequestRejectEmail(student.full_name, parent.email, school.school_name, student.parent_name);
        }

        const notiType = `student_status`;
        const message = {
            title: `Student application Status.`,
            body: ` Student request for ${student.full_name} has been ${status} by the principal.`,
        };
        const Data = {
            notification_by: req.user.id,
            notification_to: student.parent_id,
            notification_type: notiType,
            body: message.body,
            title: message.title,
            school_id: school_id,
        };
        await send_notification(Data.notification_to, message, notiType, Data);
        await db.Notification.create(Data);

        return res.status(200).json({
            status: 1,
            message: 'Student status updated successfully',
            data: student
        })

    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error" });
    }
}

const studentAssignTeacher = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { request_status, student_id, teacher_id } = req.body

        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const student = await db.Student.findOne({
            where: { id: student_id, school_id },
        })

        if (!student) {
            return res.status(404).json({ status: 2, message: "Student not found" })
        };

        if (teacher_id) {
            const teacher = await db.User.findOne({
                where: { id: teacher_id, role: "teacher", school_id },
            })

            if (!teacher) {
                return res.status(404).json({ status: 0, message: "Teacher not found" })
            }
            await student.update({
                teacher_id: teacher_id || student.teacher_id,
            })
            const notiType = `student_assign_teacher`;
            const message = {
                title: `Student Assign you.`,
                body: ` ${student.full_name} has been assign you.`,
            };
            const Data = {
                notification_by: req.user.id,
                notification_to: teacher_id,
                notification_type: notiType,
                body: message.body,
                title: message.title,
                school_id: school_id,
            };
            await send_notification(Data.notification_to, message, notiType, Data);
            await db.Notification.create(Data);
        }

        if (request_status) {
            await student.update({
                request_status: request_status || student.request_status
            })
            if (request_status === 'accepted') {
                const parent = await db.User.findByPk(student.parent_id)
                const school = await db.User.findByPk(school_id)
                await studentRequestAccesseptEmail(student.full_name, parent.email, school.school_name, student.parent_name);
            } else if (request_status === 'rejected') {
                const parent = await db.User.findByPk(student.parent_id)
                const school = await db.User.findByPk(school_id)
                await studentRequestRejectEmail(student.full_name, parent.email, school.school_name, student.parent_name);
            }

            const notiType = `student_status`;
            const message = {
                title: `Student application Status.`,
                body: ` Student request for ${student.full_name} has been ${request_status} by the principal.`,
            };
            const Data = {
                notification_by: req.user.id,
                notification_to: student.parent_id,
                notification_type: notiType,
                body: message.body,
                title: message.title,
                school_id: school_id,
            };
            await send_notification(Data.notification_to, message, notiType, Data);
            await db.Notification.create(Data);
        }

        return res.status(200).json({
            status: 1,
            message: 'Student assign teacher successfully',
            data: student
        })

    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error" });
    }
}

const listTeacher = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }
        const teachers = await db.User.findAll({
            where: { role: "teacher", is_deleted: false, school_id },
            attributes: ["id", "full_name", "profile_pic"],
        })

        return res.status(200).json({
            status: 1,
            message: 'List of teachers',
            data: teachers
        })

    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error" });
    }
}

const getShift = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal" && req.user.role != "teacher" && req.user.role != "parent") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        let school_id = null
        if (req.user.role != "school") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const shift = await db.Shift.findAll({
            where: { school_id, is_deleted: false },
        })

        return res.status(200).json({
            status: 1,
            message: 'List of shifts',
            data: shift
        })

    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error" });
    }
}

const listWaitingStudent = async (req, res) => {
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
        const whereClause = { school_id, request_status: 'waiting' };

        if (search) {
            whereClause[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
                { parent_name: { [Op.like]: `%${search}%` } },
            ];
        }

        const student = await db.Student.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        })

        return res.status(200).json({
            status: 1,
            message: 'Waiting student retrieved successfully',
            total_student: student.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(student.count / limit),
            data: student.rows
        });

    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error" });
    }
}

const studentAttendance = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page, student_id } = req.query
        if (!page || !student_id) {
            return res.status(400).json({ status: 0, message: 'page or student_id is required' });
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

        const student = await db.Student.findOne({
            where: {
                school_id,
                id: student_id
            },
        })

        if (!student) {
            return res.status(404).json({ status: 2, message: 'Student not found' })
        }

        const attedance = await db.StudentAttendance.findAndCountAll({
            where: {
                student_id: student_id
            },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        })

        return res.status(200).json({
            status: 1,
            message: 'student attedance retrieved successfully',
            total_student_attedance: attedance.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(attedance.count / limit),
            data: attedance.rows
        });

    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error" });
    }
}

const listParantStudent = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page, parent_id } = req.query
        if (!page || !parent_id) {
            return res.status(400).json({ status: 0, message: 'page or parent_id is required' });
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

        const parent = await db.User.findOne({
            where: {
                school_id,
                id: parent_id,
                is_deleted: false,
                role: "parent"
            },
        })

        if (!parent) {
            return res.status(404).json({ status: 2, message: 'parent not found' })
        }

        const Student = await db.Student.findAndCountAll({
            where: {
                parent_id: parent_id,
                request_status: { [Op.ne]: 'inActive' }
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
            offset,
            order: [['createdAt', 'DESC']],
        })

        return res.status(200).json({
            status: 1,
            message: 'student retrieved successfully',
            total_student: Student.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(Student.count / limit),
            data: Student.rows
        });

    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error" });
    }
}

const listTeacherStudent = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page, shift_id, search, teacher_id } = req.query;
        if (!page) {
            return res.status(400).json({ status: 0, message: 'page is required' });
        }

        const limit = 10;
        const offset = (page - 1) * limit;

        let school_id = null;
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            });
            school_id = principal.school_id;
        } else {
            school_id = req.user.id;
        }

        const user = await db.User.findOne({
            where: { id: teacher_id, is_deleted: false },
        })

        if (!user) {
            return res.status(404).json({ status: 2, message: 'Teacher not found' })
        }
        const whereClause = {
            school_id,
            request_status: 'accepted',
            teacher_id
        };

        if (shift_id && parseInt(shift_id) !== 0) {
            const shift = await db.Shift.findOne({ where: { school_id } });
            if (!shift) {
                return res.status(404).json({ status: 0, message: 'shift not found' });
            }
            whereClause.shift_id = shift_id;
        }

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
                ]
            },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });

        return res.status(200).json({
            status: 1,
            message: 'student request retrieved successfully',
            total_student: student.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(student.count / limit),
            data: student.rows
        });

    } catch (error) {
        console.error('Error get student:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }

}

const listInvoice = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { month, year } = req.query

        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const invoice = await db.Invoice.findAll({
            where: {
                school_id,
                month,
                year
            },
            attributes: {
                include: [
                    [
                        db.sequelize.literal(`(
                            SELECT t1.full_name 
                            FROM tbl_student t1 
                            WHERE t1.id = Invoice.student_id
                        )`),
                        'student_name'
                    ],
                    [
                        db.sequelize.literal(`(
                            SELECT t1.parent_name 
                            FROM tbl_user t1 
                            WHERE t1.id = Invoice.parent_id
                        )`),
                        'parent_name'
                    ]
                ]
            }
        })

        return res.status(200).json({ status: 1, message: "Invoice get successfully", data: invoice })

    }
    catch (error) {
        console.error('Error get student:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

module.exports = {
    getNewStudent,
    getAllStudent,
    getStudent,
    editStatus,
    studentAssignTeacher,
    listTeacher,
    getShift,
    listWaitingStudent,
    studentAttendance,
    listParantStudent,
    listTeacherStudent,

    listInvoice
}