require('dotenv').config();
const db = require('../../config/db')
const { Op, Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { error } = require('console');
const moment = require('moment')


const Attendance = async (req, res) => {
    if (req.user.role != "teacher" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const user = await db.User.findOne({
            where: { id: req.user.id, is_deleted: false }
        })

        const existigAttendance = await db.Attendance.findOne({
            where: { user_id: user.id, is_clock_in: true, school_id: user.school_id }
        })

        if (existigAttendance) {
            await existigAttendance.update({
                is_clock_in: false,
                clock_out_time: moment().format('HH:mm:ss'),
            })
             return res.status(200).json({
                status: 1,
                message: "Clock out successfully",
                data: existigAttendance
            })
        } else if(!existigAttendance) {
            const attendance = await db.Attendance.create({
                user_id: user.id,
                school_id: user.school_id,
                is_clock_in: true,
                date: moment().format('YYYY-MM-DD'),
                clock_in_time: moment().format('HH:mm:ss'),
                clock_out_time: null,
                role: user.role
            })

            return res.status(200).json({
                status: 1,
                message: "Clock in successfully",
                data: attendance
            })
        }

    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const getAttendance = async (req, res) => {
        if (req.user.role != "teacher" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const {page} = req.query
        if(!page){
            return res.status(400).json({ status: 0, message: "page is required" });
        }
        const limit = 10; 
        const offset = (page - 1) * limit; 

        const attendance = await db.Attendance.findAndCountAll({
            where: {
                user_id: req.user.id,
                // date: {
                //     [Op.gte]: Sequelize.literal('CURRENT_DATE - INTERVAL 30 DAY')
                // }
            },
            order: [['date', 'DESC']],
            limit: limit,
            offset: offset,
        });

         return res.status(200).json({
            status: 1,
            message: 'Attendance retrieved successfully',
            total_attendance: attendance.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(attendance.count / limit),
            data: attendance.rows
        });
    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}


module.exports = {
    Attendance,
    getAttendance
};
