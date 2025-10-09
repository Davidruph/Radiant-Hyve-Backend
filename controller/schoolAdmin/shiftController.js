require('dotenv').config();
const db = require('../../config/db')
const { Op, Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { error } = require('console');
const bcrypt = require('bcrypt')
const { upload } = require('../../helpers/storage');


const addShift = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { shift_name, shift_fee, penalty } = req.body

        let school_id = null
        if (req.user.role == "principal") {
            var principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const shift = await db.Shift.create({
            shift_name,
            shift_fee,
            admin_id: req.user.id,
            school_id,
            penalty
        });

        return res.status(200).json({
            status: 1,
            message: "Shift added successfully",
            data: shift
        })
    } catch (error) {
        console.error('Error adding shift:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const editShift = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { shift_id, shift_name, shift_fee, penalty } = req.body

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
            where: {
                id: shift_id,
                school_id,
                is_deleted: false
            }
        })
        if (!shift) {
            return res.status(404).json({ status: 0, message: "Shift not found" })
        }

        await shift.update({
            shift_name: shift_name || shift.shift_name,
            shift_fee: shift_fee || shift.shift_fee,
            penalty: penalty || shift.penalty
        })

        return res.status(200).json({
            status: 1,
            message: "Shift added successfully",
            data: shift
        })

    } catch (error) {
        console.error('Error edit shift:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const listShift = async (req, res) => {
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
        const whereCondition = { school_id, is_deleted: false };

        if (search) {
            whereCondition[Op.or] = [
                { shift_name: { [Op.like]: `${search}%` } },
            ];
        }
        const shift = await db.Shift.findAndCountAll({
            where: whereCondition,
            limit,
            offset,
            order: [['id', 'DESC']]
        })

        return res.status(200).json({
            status: 1,
            message: 'shift retrieved successfully',
            total_shift: shift.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(shift.count / limit),
            data: shift.rows
        });

    } catch (error) {
        console.error('Error edit shift:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const deleteShift = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { shift_id } = req.query
        if (!shift_id) {
            return res.status(400).json({ status: 0, message: "shift_id is required" })
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

        const shift = await db.Shift.findOne({ where: { id: shift_id, school_id, is_deleted: false } })
        if (!shift) {
            return res.status(404).json({ status: 0, message: "Shift not found" })
        }

        await shift.update({ is_deleted: true })
        return res.status(200).json({ status: 1, message: "Shift deleted successfully" })
    } catch (error) {
        console.error('Error delete shift:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}


module.exports = {
    addShift,
    editShift,
    listShift,
    deleteShift
}