require('dotenv').config();
const db = require('../../config/db')
const { Op, Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { error } = require('console');
const { upload } = require('../../helpers/storage');


const addMenu = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal" && req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { about_meal, menu_time, menu_date, menu_type, student_id, menu_days, is_all } = req.body
        let school_id = null
        if (req.user.role == "principal" || req.user.role == "teacher") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        if (student_id) {
            const student = await db.Student.findOne({
                where: { id: student_id, request_status: "accepted", school_id }
            })

            if (!student) {
                return res.status(404).json({ status: 0, message: "Student not found" })
            }
        }

        if (Array.isArray(menu_days) && menu_days.length === 0) {
            return res.status(400).json({ status: 0, message: 'Please select at menu_days.' });
        }

        const menu = await db.Menu.create({
            school_id: school_id,
            about_meal,
            menu_time,
            menu_date,
            menu_type,
            student_id: student_id || null,
            is_all: is_all || false,
            admin_id: req.user.id
        })

        const MenuDay = menu_days.map(day => ({
            menu_id: menu.id,
            menu_day: day
        }));
        await db.MenuDay.bulkCreate(MenuDay);

        return res.status(200).json({
            status: 1,
            message: 'Add meal track successfully',
            data: menu
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}


const editMenu = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal" && req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { menu_id, about_meal, menu_time, menu_date, menu_type, student_id, menu_days, is_all } = req.body
        let school_id = null
        if (req.user.role == "principal" || req.user.role == "teacher") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const menu = await db.Menu.findOne({
            where: {
                id: menu_id,
                school_id: school_id
            }
        })

        if (!menu) {
            return res.status(404).json({ status: 0, message: 'Menu not found' })
        }

        if (student_id) {
            const student = await db.Student.findOne({
                where: { id: student_id, request_status: "accepted", school_id }
            })
            if (!student) {
                return res.status(404).json({ status: 0, message: "Student not found" })
            }
            menu.is_all = false
        } else{
            menu.student_id = null
        }

        if (menu_days) {
            if (Array.isArray(menu_days) && menu_days.length === 0) {
                return res.status(400).json({ status: 0, message: 'Please select at menu_days.' });
            }
            await db.MenuDay.destroy({
                where: {menu_id}
            })
            const MenuDay = menu_days.map(day => ({
                menu_id: menu.id,
                menu_day: day
            }));
            await db.MenuDay.bulkCreate(MenuDay);
        }

        await menu.update({
            about_meal: about_meal || menu.about_meal,
            menu_time: menu_time || menu.menu_time,
            menu_date: menu_date || menu.menu_date,
            menu_type: menu_type || menu.menu_type,
            student_id: student_id || null,
            is_all: is_all || false,
        })

        await menu.save()

        return res.status(200).json({
            status: 1,
            message: 'Edit meal track successfully',
            data: menu
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }

}