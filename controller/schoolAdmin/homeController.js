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

        let dobCondition = {};
        const today = moment().format('MM-DD');

        if (filter === 'today') {
            dobCondition = db.sequelize.where(
                db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dob'), 'MM-DD'),
                today
            );
        } else if (filter === 'week') {
            const pastWeekDates = [...Array(7)].map((_, i) =>
                moment().subtract(i, 'days').format('MM-DD')
            );
            dobCondition = db.sequelize.where(
                db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dob'), 'MM-DD'),
                {
                    [Op.in]: pastWeekDates
                }
            );
        } else if (filter === 'month') {
            const pastMonthDates = [...Array(30)].map((_, i) =>
                moment().subtract(i, 'days').format('MM-DD')
            );
            dobCondition = db.sequelize.where(
                db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dob'), 'MM-DD'),
                {
                    [Op.in]: pastMonthDates
                }
            );
        } else {
            return res.status(400).json({ status: 0, message: "Invalid filter type. Use 'today', 'week', or 'month'." });
        }

        // const birthdayCount = await db.User.count({
        //     where: {
        //         ...dobCondition,
        //         school_id: req.user.id,
        //         is_deleted: false,
        //         is_blocked: false,
        //         role: {
        //             [Op.in]: ['teacher', 'principal']
        //         },
        //     }
        // });

        // const studentCount = await db.Student.count({
        //     where: {
        //         ...dobCondition,
        //         school_id: req.user.id,
        //         request_status: 'accepted',
        //     }
        // });

                const birthdayCount = await db.User.count({
            where: {
                [Op.and]: [
                    dobCondition,
                    { school_id: req.user.id },
                    { is_deleted: false },
                    { is_blocked: false },
                    {
                        role: {
                            [Op.in]: ['teacher', 'principal']
                        }
                    }
                ]
            }
        });

        // 👨‍🎓 Count student birthdays
        const studentCount = await db.Student.count({
            where: {
                [Op.and]: [
                    dobCondition,
                    { school_id: req.user.id },
                    { request_status: 'accepted' }
                ]
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



module.exports = {
    desbordCount,
    getProfile,
    birthdaysCount,
}

