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
            attributes: ["id", "full_name", "relation_to_child",
                [
                    [
                        Sequelize.literal(`(
                           SELECT t2.shift_name
                           FROM tbl_shift t2
                           WHERE t2.id = Student.shift_id
                        )`),
                        'shift_name',
                    ],
                ]

            ],
            where: {
                parent_id: req.user.id,
                request_status: {
                    [Op.not]: 'inActive'
                }
            },
            limit,
            offset,
            order: [['id', 'DESC']],
        })

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
                ]
            },
            where: {
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
            attributes: ["id", "full_name", "relation_to_child",
                [
                    [
                        Sequelize.literal(`(
                           SELECT t2.shift_name
                           FROM tbl_shift t2
                           WHERE t2.id = Student.shift_id
                        )`),
                        'shift_name',
                    ],
                ]

            ],
            where: {
                parent_id: req.user.id,
                request_status: "accepted"
            },
            limit,
            offset,
            order: [['id', 'DESC']],
        })

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
        const { student_id, type } = req.query

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
        if (type = "menu") {
            details =  await db.Menu.findAll({
                where: {student_id},
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
            })
        } else if(type = "sleeplog"){
            details = await db.SleepLoag.findOne({
                where: {student_id},
            })
        } else if(type = "medication"){
            details = await db.MedicationInfo.findAll({
                where: {student_id},
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







module.exports = {
    listStudent,
    getStudent,
    studentDetails,
    listActiveStudent,
}