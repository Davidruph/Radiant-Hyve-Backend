require('dotenv').config();
const db = require('../../config/db')
const { Op, Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { error } = require('console');
const { upload } = require('../../helpers/storage');


const addSleepLog = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal" && req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { start_time, end_time, student_id } = req.body;

        let school_id = null
        if (req.user.role == "principal" || req.user.role == "teacher") {
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
                school_id
            }
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const sleep_log = await db.SleepLoag.create({
            start_time,
            end_time,
            student_name: student.full_name,
            student_id,
            parent_id: student.parent_id,
            admin_id: req.user.id
        });

        return res.status(200).json({
            status: 1,
            message: 'add sleep log successfully',
            data: sleep_log
        });

    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error", error: error.message });
    }
}

const editSleepLog = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal" && req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { id, start_time, end_time } = req.body;

        const sleep_log = await db.SleepLoag.findByPk(id);
        if (!sleep_log) {
            return res.status(404).json({ message: 'Sleep log not found' });
        }

        await sleep_log.update({
            start_time: start_time || sleep_log.start_time,
            end_time: end_time || sleep_log.end_time
        });

        return res.status(200).json({
            status: 1,
            message: 'edit sleep log successfully',
            data: sleep_log
        });

    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error", error: error.message });
    }
};

const listSleepLog = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal" && req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { search, page } = req.query;
        if (!page) {
            return res.status(400).json({ status: 0, message: "page is required" })
        }
        const limit = 10
        const offset = (page - 1) * limit

        let school_id = null
        if (req.user.role == "principal" || req.user.role == "teacher") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const whereClause = {
            school_id,
            request_status: 'accepted',
        };

        if (search) {
            whereClause[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
                { parent_name: { [Op.like]: `%${search}%` } },
            ];
        }

        const sleepLogs = await db.Student.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: db.SleepLoag,
                    as: "SleepLoag",
                },
            ],
            order: [['id', 'DESC']],
            limit,
            offset
        });

        return res.status(200).json({
            status: 1,
            message: 'student sleepLogs retrieved successfully',
            total_student: sleepLogs.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(sleepLogs.count / limit),
            data: sleepLogs.rows
        });

    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error", error: error.message });
    }
}

const getSleepLog = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal" && req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ status: 0, message: "id is required" })
        }
        const sleep_log = await db.SleepLoag.findByPk(id);
        if (!sleep_log) {
            return res.status(404).json({ message: 'Sleep log not found' });
        }

        const sleepLogs = await db.SleepLoag.findOne({
            where: { id: id },
            order: [['id', 'DESC']],
            limit,
            offset
        });

        return res.status(200).json({
            status: 1,
            message: 'student sleepLogs retrieved successfully',
            data: sleepLogs
        });

    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error", error: error.message });
    }
}


module.exports ={
    addSleepLog,
    editSleepLog,
    listSleepLog,
    getSleepLog
}