require('dotenv').config();
const db = require('../../config/db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { Op, Sequelize, where, col, fn } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { PhoneNumberUtil, PhoneNumberFormat } = require("google-libphonenumber");
const { error } = require('console');
const { upload_file, deleteFromS3, uploadVideo } = require("../../helpers/s3_upload");
const { admin } = require('googleapis/build/src/apis/admin');
const { send_notification } = require('../../helpers/notification')
const phoneUtil = PhoneNumberUtil.getInstance()
const moment = require('moment')


const desbordCount = async (req, res) => {
    if (req.user.role != "school") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const principal = await db.User.count({ where: { school_id: req.user.id, role: "principal", is_deleted: false } })
        const staff = await db.User.count({ where: { school_id: req.user.id, role: "teacher", is_deleted: false } })
        const parent = await db.User.count({ where: { school_id: req.user.id, role: "parent", is_deleted: false } })
        const student = await db.Student.count({ where: { school_id: req.user.id, request_status: 'accepted' } })

        const today = moment();
        const nextMonth = moment().add(1, 'months');

        const startMonth = today.format('MM');
        const endMonth = nextMonth.format('MM');

        // MySQL doesn't support TO_CHAR, so we use DATE_FORMAT
        const upcomingBirthday = await db.User.count({
            where: {
                school_id: req.user.id,
                is_deleted: false,
                [Op.and]: [
                    where(
                        fn('DATE_FORMAT', col('dob'), '%m'),
                        startMonth < endMonth
                            ? { [Op.between]: [startMonth, endMonth] }
                            : {
                                [Op.or]: [
                                    { [Op.between]: [startMonth, '12'] },
                                    { [Op.between]: ['01', endMonth] }
                                ]
                            }
                    )
                ]
            }
        });

        return res.status(200).json({
            status: 1,
            message: "Desbord count successfully",
            data: {
                total_principal: principal,
                total_staff: staff,
                total_parent: parent,
                total_student: student,
                total_upcoming_birthday: upcomingBirthday
            }
        })

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const getProfile = async (req, res) => {
    if (req.user.role != "school") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ status: 0, message: "id is required" });
        }
        const user = await db.User.findOne({
            where: { id: id, is_deleted: false, school_id: req.user.id },
        })
        if (!user) {
            return res.status(404).json({ status: 0, message: "User not found" });
        }
        return res.status(200).json({
            status: 1,
            message: "Profile retrieved successfully",
            data: user
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const birthdaysCount = async (req, res) => {
    if (req.user.role !== "school") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" });
    }

    try {
        const { filter } = req.query;
        const today = moment().format('MM-DD');
        let dateCondition = {};

        if (filter === 'today') {
            const today = moment().format('MM-DD');
            dateCondition = {
                [Op.and]: db.sequelize.where(
                    db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dob'), '%m-%d'),
                    today
                )
            };
        } else if (filter === 'week') {
            const nextWeekDates = [...Array(7)].map((_, i) =>
                moment().add(i, 'days').format('MM-DD')
            );
            dateCondition = {
                [Op.and]: db.sequelize.where(
                    db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dob'), '%m-%d'),
                    { [Op.in]: nextWeekDates }
                )
            };
            console.log("nextWeekDates", nextWeekDates);
        } else if (filter === 'month') {
            const nextMonthDates = [...Array(30)].map((_, i) =>
                moment().add(i, 'days').format('MM-DD')
            );
            dateCondition = {
                [Op.and]: db.sequelize.where(
                    db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dob'), '%m-%d'),
                    { [Op.in]: nextMonthDates }
                )
            };
            console.log("nextMonthDates", nextMonthDates);
        } else {
            return res.status(400).json({ status: 0, message: "Invalid filter type. Use 'today', 'week', or 'month'." });
        }

        const birthdayCount = await db.User.count({
            where: {
                ...dateCondition,
                school_id: req.user.id,
                is_deleted: false,
                is_blocked: false,
                role: {
                    [Op.in]: ['teacher', 'principal']
                },
            }
        });

        const studentCount = await db.Student.count({
            where: {
                ...dateCondition,
                school_id: req.user.id,
                request_status: 'accepted',
            }
        });

        const totalCount = parseInt(birthdayCount) + parseInt(studentCount);

        return res.status(200).json({
            status: 1,
            message: "Count retrieved successfully",
            birthday_count: totalCount
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
};

const createSos = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { sos_type_id } = req.body
        if (!sos_type_id) {
            return res.status(400).json({ status: 0, message: "sos_type_id is required" })
        }
        let school_id = req.user.id
        if (req.user.role == "principal") {
            school_id = req.user.school_id
        }
        const sosType = await db.SosType.findOne({
            where: {
                id: sos_type_id,
            }
        })
        if (!sosType) {
            return res.status(400).json({ status: 0, message: "Sos type not found" })
        }
        const sos = await db.Sos.create({
            sos_type_id: sos_type_id,
            school_id: school_id
        })
        const users = await db.User.findAll({
            where: {
                id: { [Op.in]: [req.user.id] },
                school_id: school_id,
                is_deleted: false,
                is_blocked: false,
            }
        })
        for (const user of users) {
            const notiType = `sos`;
            const message = {
                title: `SOS Alert`,
                body: `An SOS request from ${sosType.sos_name} has been triggered. Please check immediately.`
            };
            const Data = {
                notification_by: req.user.id,
                notification_to: user.id,
                notification_type: notiType,
                body: message.body,
                title: message.title,
                school_id: school_id,
            };
            await send_notification(user.id, message, notiType, Data);
            await db.Notification.create(Data);
        }
        return res.status(200).json({ status: 1, message: "Sos created successfully", data: sos })
    } catch (error) {
        console.error('Error:', error)
        return res.status(500).json({ status: 0, message: "Internal server error", error: error.message })
    }
}

const getSos = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const sos = await db.SosType.findAll()
        return res.status(200).json({ status: 1, message: "Sos retrieved successfully", data: sos })
    } catch (error) {
        console.error('Error:', error)
        return res.status(500).json({ status: 0, message: "Internal server error", error: error.message })
    }
}

const addSosType = async (req, res) => {
    try {
        const { sos_name } = req.body
        if (!sos_name) {
            return res.status(400).json({ status: 0, message: "sos_name is required" })
        }
        const sosType = await db.SosType.create({
            sos_name: sos_name
        })
        return res.status(200).json({ status: 1, message: "Sos type added successfully", data: sosType })
    } catch (error) {
        console.error('Error:', error)
        return res.status(500).json({ status: 0, message: "Internal server error", error: error.message })
    }
}

const listSos = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page } = req.query
        if (!page) {
            return res.status(400).json({ status: 0, message: "page is required" })
        }
        const limit = 10
        const offset = (page - 1) * limit
        const sos = await db.Sos.findAll({
            where: {
                school_id: req.user.id
            },
            attributes:{
                include:[
                    [
                        Sequelize.literal(`(
                           SELECT t2.sos_name
                           FROM tbl_sos_type t2
                           WHERE t2.id = Sos.sos_type_id
                        )`),
                        'sos_name',
                    ],
                ]

            },
            limit: limit,
            offset: offset
        })
        return res.status(200).json({ status: 1, message: "Sos retrieved successfully", data: sos })
    } catch (error) {
        console.error('Error:', error)
        return res.status(500).json({ status: 0, message: "Internal server error", error: error.message })
    }
}


module.exports = {
    desbordCount,
    getProfile,
    birthdaysCount,
    createSos,
    getSos,
    addSosType,
    listSos
}

