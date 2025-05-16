require('dotenv').config();
const db = require('../../config/db')
const { Op, Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { error } = require('console');
const { upload } = require('../../helpers/storage');


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
                { full_name: { [Op.iLike]: `%${search}%` } },
                { parent_name: { [Op.iLike]: `%${search}%` } },
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
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page, shift_id, search } = req.query
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
        const shift = await db.Shift.findOne({
            where: { school_id }
        })

        if (!shift) {
            return res.status(404).json({ status: 0, message: 'shift not found' })
        }
        const whereClause = {
            school_id,
            request_status: 'accepted',
            shift_id,
            // ...(teacher_id != null && { teacher_id })

        };

        if (search) {
            whereClause[Op.or] = [
                { full_name: { [Op.iLike]: `%${search}%` } },
                { parent_name: { [Op.iLike]: `%${search}%` } },
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
                where: {id:req.user.id, is_deleted: false}
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const student = await db.Student.findOne({
            where: { id: student_id,school_id },
        })

        if (!student) {
            return res.status(404).json({ status: 0, message: "Student not found" })
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
        const { student_id, status } = req.body
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
            where: { id: student_id, status: "pending" , school_id},
        })

        if (!student) {
            return res.status(404).json({ status: 0, message: "Student not found" })
        }

        await student.update({
            status: status
        })
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
        const { student_id, teacher_id } = req.body

         let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: {id:req.user.id, is_deleted: false}
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const student = await db.Student.findOne({
            where: { id: student_id, status: "accepted", school_id },
        })

        if (!student) {
            return res.status(404).json({ status: 0, message: "Student not found" })
        }

        const teacher = await db.User.findOne({
            where: { id: teacher_id , role: "teacher", school_id},
        })

        if (!teacher) {
            return res.status(404).json({ status: 0, message: "Teacher not found" })
        }

        await student.update({
            teacher_id
        })
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
                where: {id:req.user.id, is_deleted: false}
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
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
         let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: {id:req.user.id, is_deleted: false}
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const shift = await db.Shift.findAll({
            where: { school_id },
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

module.exports = {
    getNewStudent,
    getAllStudent,
    getStudent,
    editStatus,
    studentAssignTeacher,
    listTeacher,
    getShift,
}