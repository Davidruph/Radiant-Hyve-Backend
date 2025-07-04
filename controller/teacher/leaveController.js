require('dotenv').config();
const db = require('../../config/db')
const { Op, fn, col, where } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { error } = require('console');
const moment = require('moment')
const { send_notification } = require('../../helpers/notification')


const applyLeave = async (req, res) => {
    if (req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { reason, leave_type, date } = req.body;

        const existingLeave = await db.Leave.findOne({
            where: {
                teacher_id: req.user.id, date: date,
                leave_request_status: {
                    [Op.or]: ["pending", "accepted"]
                },
            }
        })

        if (existingLeave) {
            return res.status(400).json({ status: 0, message: "You have already applied for leave on this date." });
        }
        const leave = await db.Leave.create({
            reason: reason,
            leave_type: leave_type,
            date: date,
            teacher_id: req.user.id,
            leave_request_status: 'pending',
            school_id: req.user.school_id
        });

        const user = await db.User.findAll({
            where: {
                school_id: req.user.school_id,
                role: {
                    [Op.in]: ['school', 'principal']
                }, 
                is_deleted: false,
                is_blocked: false
            }
        });

        for (const data of user) {
            const formattedStartDate = moment.utc(date).format("DD MMMM YYYY");
            const notiType = "leave_request";
            const message = {
                title: "New leave request Received",
                body: ` ${req.user.full_name} requested a ${leave.leave_type} absence for ${formattedStartDate}.`,
            };
            const Data = {
                notification_by: req.user.id,
                notification_to: data.id,
                notification_type: notiType,
                body: message.body,
                title: message.title,
                school_id: req.user.school_id,
            };
            await send_notification(data.id, message, notiType, Data);
            await db.Notification.create(Data);
        }

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
        let { month, year, page } = req.query;
        if (!page) {
            return res.status(400).json({ status: 0, message: 'page is required' });
        }
        const limit = 10
        const offset = (page - 1) * limit
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

        const leaves = await db.Leave.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            status: 1,
            message: "Leaves fetched successfully",
            total_leave: leaves.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(leaves.count / limit),
            data: leaves.rows
        });

    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
};

const cancelLeave = async (req, res) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" });
    }

    try {
        const { leave_id } = req.body;
        if (!leave_id) {
            return res.status(400).json({ status: 0, message: "leave_id is required" });
        }

        const leave = await db.Leave.findOne({
            where: {
                id: leave_id,
                teacher_id: req.user.id,
                leave_request_status: 'pending'
            }
        });

        if (!leave) {
            return res.status(404).json({ status: 0, message: "Leave not found or cannot be cancelled" });
        }

        leave.leave_request_status = 'cancelled';
        await leave.save();

        return res.status(200).json({
            status: 1,
            message: "Leave cancelled successfully",
            data: leave
        });

    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
};

module.exports = {
    applyLeave,
    listLeave,
    cancelLeave
};