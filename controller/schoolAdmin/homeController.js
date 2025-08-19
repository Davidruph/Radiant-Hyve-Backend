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

const homeCount = async (req, res) => {
    if (req.user.role !== "school") {
        return res.status(403).json({
            status: 0,
            message: "You are not authorized to perform this action"
        });
    }

    try {
        const { filter } = req.query;
        const schoolId = req.user.id;

        const getDateRange = (type) => {
            if (type === "today") {
                return [moment().startOf("day").toDate(), moment().endOf("day").toDate()];
            }
            if (type === "week") {
                return [moment().startOf("week").toDate(), moment().endOf("week").toDate()];
            }
            if (type === "month") {
                return [moment().startOf("month").toDate(), moment().endOf("month").toDate()];
            }
            return null;
        };

        const getBirthdayCondition = (type) => {
            const todayMD = moment().format("MM-DD");

            if (type === "today") {
                return db.sequelize.where(
                    db.sequelize.fn("DATE_FORMAT", db.sequelize.col("dob"), "%m-%d"),
                    todayMD
                );
            }

            let end;
            if (type === "week") {
                end = moment().endOf("week").format("MM-DD");
            } else if (type === "month") {
                end = moment().endOf("month").format("MM-DD");
            } else {
                return null;
            }

            return db.sequelize.where(
                db.sequelize.fn("DATE_FORMAT", db.sequelize.col("dob"), "%m-%d"),
                { [Op.between]: [todayMD, end] }
            );
        };

        if (!["today", "week", "month"].includes(filter)) {
            return res.status(400).json({
                status: 0,
                message: "Invalid filter type. Use 'today', 'week', or 'month'."
            });
        }

        const [startDate, endDate] = getDateRange(filter);
        const birthdayCondition = getBirthdayCondition(filter);

        const invoiceCondition = { school_id: schoolId, createdAt: { [Op.between]: [startDate, endDate] } };
        const sosCondition = { school_id: schoolId, createdAt: { [Op.between]: [startDate, endDate] } };

        // 🔹 Run queries in parallel
        const [birthdayCount, studentCount, invoiceCount, sosCount] = await Promise.all([
            db.User.count({
                where: {
                    school_id: schoolId,
                    is_deleted: false,
                    is_blocked: false,
                    role: { [Op.in]: ["teacher", "principal"] },
                    [Op.and]: birthdayCondition
                }
            }),
            db.Student.count({
                where: { school_id: schoolId, request_status: "accepted" , [Op.and]: birthdayCondition}
            }),
            db.Invoice.count({ where: invoiceCondition }),
            db.Sos.count({ where: sosCondition })
        ]);

        return res.status(200).json({
            status: 1,
            message: "Count retrieved successfully",
            birthday_count: birthdayCount + studentCount,
            invoice_count: invoiceCount,
            sos_count: sosCount,
        });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            status: 0,
            message: "Internal server error",
            error: error.message
        });
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
    homeCount,
    createSos,
    getSos,
    addSosType,
    listSos
}

