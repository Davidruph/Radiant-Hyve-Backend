require('dotenv').config();
const db = require('../../config/db')
const { Op, Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { error } = require('console');
const { upload } = require('../../helpers/storage');


const addSleepLog = async (req, res) => {
    try {
        const { start_time, end_time, student_name, student_id } = req.body;
        const admin_id = req.user.id;

        const student = await db.Student.findByPk(student_id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const sleep_log = await db.SleepLoag.create({
            start_time,
            end_time,
            student_name,
            student_id,
            parent_id: student.parent_id,
            admin_id
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
    try {
        const { id, start_time, end_time, student_name, student_id } = req.body;
        const admin_id = req.user.id;

        const sleep_log = await db.SleepLoag.findByPk(id);
        if (!sleep_log) {
            return res.status(404).json({ message: 'Sleep log not found' });
        }

        if (student_id) {
            var student = await db.Student.findByPk(student_id);

            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }
        }

        await sleep_log.update({
            parent_id: student.parent_id || sleep_log.parent_id,
        }, req.body);

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
    try {
        const { search, page = 1 } = req.query;
        const limit = 10
        const offset = (page - 1) * limit

        let whereCondition = {};

        if (search) {
            whereCondition.student_name = {
                [Op.like]: `%${search}%`
            }
        }

        const sleepLogs = await db.SleepLoag.findAndCountAll({
            where: { ...whereCondition },
            include: [
                {
                    model: db.Student,
                    as: "",
                    include: [
                        {
                            model: db.User,
                            as: ""
                        }
                    ]
                },
            ],
            order: [['id','DESC']],
            limit,
            offset
        });

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
        return res.status(500).json({ status: 0, message: "Internal Server Error", error: error.message });
    }
}