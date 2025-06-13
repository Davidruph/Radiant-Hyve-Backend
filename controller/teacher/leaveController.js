require('dotenv').config();
const db = require('../../config/db')
const { Op, fn, col, where } = require('sequelize');
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

const listLeave = async (req, res) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" });
    }

    try {
        let { month, year } = req.query;

        let monthArray = [];
        if (month) {
            monthArray = Array.isArray(month)
                ? month.map(Number)
                : typeof month === 'string'
                    ? month.split(',').map(Number)
                    : [];
        }

        const whereClause = {
            teacher_id: req.user.id
        };

        const andConditions = [];

        if (year) {
            andConditions.push(where(fn('YEAR', col('date')), year));
        }

        if (monthArray.length > 0) {
            andConditions.push(where(fn('MONTH', col('date')), { [Op.in]: monthArray }));
        }

        if (andConditions.length > 0) {
            whereClause[Op.and] = andConditions;
        }

        const leaves = await db.Levave.findAll({
            where: whereClause,
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
};


module.exports = {
    applyLeave,
    listLeave,
};