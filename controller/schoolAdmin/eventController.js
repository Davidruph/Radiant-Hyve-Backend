require('dotenv').config();
const db = require('../../config/db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { Op, Sequelize, col, fn, where } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { PhoneNumberUtil, PhoneNumberFormat } = require("google-libphonenumber");
const { error } = require('console');
const { upload_file, deleteFromS3, uploadVideo } = require("../../helpers/s3_upload");
const phoneUtil = PhoneNumberUtil.getInstance()



const createEvent = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { color_name, about_event, end_time, start_time, event_date, event_name, is_principal, is_teacher, is_parent, is_all } = req.body

        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const event = await db.Event.create({
            event_name: event_name,
            event_date: event_date,
            start_time: start_time,
            end_time: end_time,
            about_event: about_event,
            color_name: color_name,
            school_id,
            admin_id: req.user.id,
            is_principal, is_teacher, is_parent, is_all
        })

        return res.status(200).json({
            status: 1,
            message: "Event created successfully",
            data: event
        })

    } catch (error) {
        console.error('Error add event:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const editEvent = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { event_id, is_principal, is_teacher, is_parent, is_all, color_name, about_event, end_time, start_time, event_date, event_name } = req.body

        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const event = await db.Event.findOne({
            where: { id: event_id, school_id }
        })

        if (!event) {
            return res.status(404).json({ status: 0, message: "Event not found" })
        }

        await event.update({
            event_name: event_name || event.event_name,
            event_date: event_date || event.event_date,
            start_time: start_time || event.start_time,
            end_time: end_time || event.end_time,
            about_event: about_event || event.about_event,
            color_name: color_name || event.color_name,
            is_principal: is_principal || event.is_principal,
            is_teacher: is_teacher || event.is_teacher,
            is_parent: is_parent || event.is_parent,
            is_all: is_all || event.is_all
        })

        return res.status(200).json({
            status: 1,
            message: "Event updated successfully",
            data: event
        })

    } catch (error) {
        console.error('Error edit event:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const deleteEvent = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { event_id } = req.query
        if (!event_id) {
            return res.status(400).json({ status: 0, message: "event_id is required" })
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

        const event = await db.Event.findOne({
            where: { id: event_id, school_id }
        })

        if (!event) {
            return res.status(404).json({ status: 0, message: "Event not found" })
        }

        await event.destroy()
        return res.status(200).json({ status: 1, message: "Event deleted successfully" })
    } catch (error) {
        console.error('Error delete event:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const getEvent = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { event_id } = req.query
        if (!event_id) {
            return res.status(400).json({ status: 0, message: "event_id is required" })
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

        const event = await db.Event.findOne({
            where: { id: event_id, school_id }
        })

        if (!event) {
            return res.status(404).json({ status: 0, message: "Event not found" })
        }

        return res.status(200).json({ status: 1, message: "Event get successfully", data: event })
    } catch (error) {
        console.error('Error delete event:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }

}

const listEvent = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { month, year } = req.query
        if (!month || !year) {
            return res.status(400).json({ status: 0, message: "month and year is required" })
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

        const event = await db.Event.findAll({
            where: {
                school_id,
                [Op.and]: [
                    where(fn('MONTH', col('event_date')), month),
                    where(fn('YEAR', col('event_date')), year)
                ]
            }
        })

        return res.status(200).json({ status: 1, message: "Event get successfully", data: event })
    } catch (error) {
        console.error('Error delete event:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

module.exports = {
    createEvent,
    editEvent,
    deleteEvent,
    getEvent,
    listEvent
}