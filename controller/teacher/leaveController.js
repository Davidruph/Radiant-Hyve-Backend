require('dotenv').config();
const db = require('../../config/db')
const { Op, Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { error } = require('console');
const moment = require('moment')


const applyLeave = async (req, res) => {
    if (req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { reason, leave_type, date } = req.body;

        const leave = await db.Levave.create({
            reason: reason,
            leave_type: leave_type,
            date: date,
            teacher_id: req.user.id,
            leave_request_status: 'pending'
        });

        return res.status(200).json({
            status: 1,
            message: "Leave applied successfully",
            data: leave
        });

    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const getLeave = async (req, res) => {
    if (req.user.role != "teacher" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { month, year } = req.query;
        if (!month || !year) {
            return res.status(400).json({ status: 0, message: "month and year is required" })
        }
        const leaves = await db.Levave.findAll({
            where: {
                teacher_id: req.user.id,
                [Op.and]: [
                    where(fn('MONTH', col('event_date')), month),
                    where(fn('YEAR', col('event_date')), year)
                ]
            },
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            status: 1,
            message: "Leaves fetched successfully",
            data: leaves
        });

    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}


module.exports = {
    applyLeave,
    getLeave,
};