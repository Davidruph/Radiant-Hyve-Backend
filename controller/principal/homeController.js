require('dotenv').config();
const db = require('../../config/db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { Op, Sequelize, literal } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { PhoneNumberUtil, PhoneNumberFormat } = require("google-libphonenumber");
const { error } = require('console');
const { upload_file, deleteFromS3, uploadVideo } = require("../../helpers/s3_upload")
const phoneUtil = PhoneNumberUtil.getInstance()
const moment = require('moment');
const { ObjectAttributes } = require('@aws-sdk/client-s3');
const { send_notification } = require('../../helpers/notification')


const Attendance = async (req, res) => {
    if (req.user.role != "teacher" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { address, latitude, longitude } = req.body;
        const user = await db.User.findOne({
            where: { id: req.user.id, is_deleted: false }
        })

        const existigAttendance = await db.Attendance.findOne({
            where: { user_id: user.id, is_clock_in: true, school_id: user.school_id }
        })

        if (existigAttendance) {
            await existigAttendance.update({
                is_clock_in: false,
                clock_out_time: moment().toDate(),
                clock_out_address: address,
                clock_out_latitude: latitude,
                clock_out_longitude: longitude,
            })
            return res.status(200).json({
                status: 1,
                message: "Clock out successfully",
                data: existigAttendance
            })
        } else if (!existigAttendance) {
            const attendance = await db.Attendance.create({
                user_id: user.id,
                school_id: user.school_id,
                is_clock_in: true,
                date: moment().format('YYYY-MM-DD'),
                clock_in_time: moment().toDate(),
                clock_out_time: null,
                clock_in_address: address,
                clock_in_latitude: latitude,
                clock_in_longitude: longitude,
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

const listAttendance = async (req, res) => {
    if (req.user.role != "teacher" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page } = req.query
        if (!page) {
            return res.status(400).json({ status: 0, message: "page is required" });
        }
        const limit = 15;
        const offset = (page - 1) * limit;

        const lastAttendance = await db.Attendance.findOne({
            where: {
                user_id: req.user.id,
            },
            order: [['id', 'DESC']],
        });

        const attendance = await db.Attendance.findAndCountAll({
            where: {
                user_id: req.user.id,
                // date: {
                //     [Op.gte]: Sequelize.literal('CURRENT_DATE - INTERVAL 30 DAY')
                // }
            },
            order: [['id', 'DESC']],
            limit: limit,
            offset: offset,
        });

        return res.status(200).json({
            status: 1,
            message: 'Attendance retrieved successfully',
            is_clock_in: lastAttendance ? lastAttendance.is_clock_in : false,
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

const getAttendance = async (req, res) => {
    if (req.user.role != "teacher" && req.user.role != "principal") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { attendance_id } = req.query
        if (!attendance_id) {
            return res.status(400).json({ status: 0, message: "attendance_id is required" })
        }

        const attendance = await db.Attendance.findOne({
            where: {
                id: attendance_id,
                user_id: req.user.id,
            },
        });
        if (!attendance) {
            return res.status(404).json({ status: 0, message: 'Attendance not found' });
        }
        return res.status(200).json({
            status: 1,
            message: 'Attendance retrieved successfully',
            data: attendance
        });
    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error", error: error.message });
    }
}

const editPrincipal = async (req, res) => {
    if (req.user.role !== "principal") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" });
    }

    try {
        const { full_name, dob, qualification, gender, designation, experience, mobile_no, country_code, iso_code } = req.body;
        const principal = await db.User.findOne({
            where: {
                id: req.user.id,
                role: 'principal',
                is_deleted: false
            },
        })

        if (!principal) {
            return res.status(404).json({ status: 0, message: "Principal not found" })
        }

        let profileImage = null;
        if (req.files && req.files.profile_pic && req.files.profile_pic.length > 0) {
            profileImage = req.files.profile_pic[0];
            var newProfilePicPath = await upload_file(profileImage, 'profile_pic/')
        }

        if (req.files?.profile_pic && principal.profile_pic) {
            await deleteFromS3(principal.profile_pic);
        }

        if (mobile_no) {
            const existMobile = await db.User.findOne({
                where: {
                    mobile_no,
                    iso_code,
                    country_code,
                    id: { [Op.not]: req.user.id },
                    is_deleted: false
                }
            })

            if (existMobile) {
                return res.status(409).json({
                    status: 0,
                    message: 'This mobile number is already registered.'
                });
            }
        }

        if (mobile_no && iso_code && country_code) {
            try {
                var number = phoneUtil.parse(req.body.mobile_no, req.body.iso_code);

            } catch {
                return res.status(400).json({ Status: 0, message: "Number or ISO code not matched." });
            }

            const isValid = phoneUtil.isValidNumber(number);
            if (!isValid) return res.status(400).json({ Status: 0, message: "Phone number is not correct." });

            const isCorrectISO = phoneUtil.getRegionCodeForNumber(number) === req.body.iso_code;
            if (!isCorrectISO) return res.status(400).json({ Status: 0, message: "Phone number is not correct." });

        }
        await principal.update({
            gender: gender || principal.gender,
            full_name: full_name || principal.full_name,
            mobile_no: mobile_no || principal.mobile_no,
            country_code: country_code || principal.country_code,
            iso_code: iso_code || principal.iso_code,
            dob: dob || principal.dob,
            qualification: qualification || principal.qualification,
            designation: designation || principal.designation,
            profile_pic: newProfilePicPath || principal.profile_pic,
            experience: experience || principal.experience,
        })

        return res.status(200).json({ status: 1, message: "Principal updated successfully", data: principal });

    } catch (error) {
        console.error('Error edit principal:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
};

const listOtherAttedance = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page, user_id } = req.query
        if (!page) {
            return res.status(400).json({ status: 0, message: "page is required" });
        }
        if (!user_id) {
            return res.status(400).json({ status: 0, message: "user_id is required" })
        }
        const limit = 10;
        const offset = (page - 1) * limit;
        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const user = await db.User.findOne({
            where: {
                id: user_id,
                school_id,
                role: {
                    [Op.or]: ['teacher', 'principal']
                }
            },
        })

        if (!user) {
            return res.status(404).json({ status: 0, message: "User not found" })
        }

        const attendance = await db.Attendance.findAndCountAll({
            where: {
                user_id: user_id,
                school_id,
                // date: {
                //     [Op.gte]: Sequelize.literal('CURRENT_DATE - INTERVAL 30 DAY')
                // }
            },
            order: [['id', 'DESC']],
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

const todayAttedance = async (req, res) => {
    if (req.user.role != "teacher" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page } = req.query
        if (!page) {
            return res.status(400).json({ status: 0, message: "page is required" });
        }
        const limit = 15;
        const offset = (page - 1) * limit;

        const lastAttendance = await db.Attendance.findOne({
            where: {
                user_id: req.user.id,
            },
            order: [['id', 'DESC']],
        });

        const attendance = await db.Attendance.findAndCountAll({
            where: {
                user_id: req.user.id,
                date: moment().toDate()
            },
            order: [['id', 'DESC']],
            limit: limit,
            offset: offset,
        });

        return res.status(200).json({
            status: 1,
            message: 'Attendance retrieved successfully',
            is_clock_in: lastAttendance ? lastAttendance.is_clock_in : false,
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

const listLeave = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page } = req.query
        if (!page) {
            return res.status(400).json({ status: 0, message: "page is required" });
        }
        const limit = 10;
        const offset = (page - 1) * limit;

        let school_id = null
        if (req.user.role != "school") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const leave = await db.Leave.findAndCountAll({
            where: {
                school_id,
                leave_request_status: "pending"
            },
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                           SELECT t2.full_name
                           FROM tbl_user t2
                           WHERE t2.id = Leave.teacher_id
                        )`),
                        'teacher_name',
                    ]
                ]
            },
            order: [['id', 'DESC']],
            limit: limit,
            offset: offset,
        });

        return res.status(200).json({
            status: 1,
            message: 'leave retrieved successfully',
            total_leave: leave.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(leave.count / limit),
            data: leave.rows
        });
    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const getLeave = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page, date } = req.query

        const limit = 10;
        const offset = (page - 1) * limit;

        let school_id = null
        if (req.user.role != "school") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const leave = await db.Leave.findAndCountAll({
            where: {
                school_id,
                date: date
            },
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                           SELECT t2.full_name
                           FROM tbl_user t2
                           WHERE t2.id = Leave.teacher_id
                        )`),
                        'teacher_name',
                    ]
                ]
            },
            order: [['id', 'DESC']],
            limit: limit,
            offset: offset,
        });

        return res.status(200).json({
            status: 1,
            message: 'leave retrieved successfully',
            total_leave: leave.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(leave.count / limit),
            data: leave.rows
        });
    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const updateLeaveStatus = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { leave_id, leave_request_status } = req.body

        let school_id = null
        if (req.user.role != "school") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const leave = await db.Leave.findOne({
            where: {
                id: leave_id,
                school_id,
                leave_request_status: "pending"
            },
        });

        if (!leave) {
            return res.status(404).json({ status: 0, message: 'Leave not found' });
        }

        await leave.update({
            leave_request_status
        })

        const formattedStartDate = moment.utc(leave.date).format("DD MMMM YYYY");
        const notiType = `leave_status`;
        const message = {
            title: `Leave application Status.`,
            body: `💬 Leave request for ${leave.leave_type} on ${formattedStartDate} has been ${leave_request_status} by the principal.`,
        };
        const Data = {
            notification_by: req.user.id,
            notification_to: leave.teacher_id,
            notification_type: notiType,
            body: message.body,
            title: message.title,
            school_id: school_id,
        };
        await send_notification(leave.teacher_id, message, notiType, Data);
        await db.Notification.create(Data);

        return res.status(200).json({
            status: 1,
            message: 'Leave updated successfully',
            data: leave
        });
    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error", error: error.message });
    }
}

const upcomingBirthday = async (req, res) => {
    if (req.user.role != "principal" && req.user.role != "school") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page, type } = req.query
        const limit = 10;
        const offset = (page - 1) * limit;

        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }
        const today = moment();
        const after30 = moment().add(30, 'days');

        const start = today.format("MM-DD");
        const end = after30.format("MM-DD");
        let data
        if (type == "staff") {
            data = await db.User.findAndCountAll({
                where: {
                    school_id: school_id,
                    role: "teacher",
                    is_deleted: false,
                    is_blocked: false,
                    [Op.and]: [
                        literal(`DATE_FORMAT(dob, '%m-%d') >= '${start}'`),
                        literal(`DATE_FORMAT(dob, '%m-%d') <= '${end}'`)
                    ]
                },
                order: [literal("DATE_FORMAT(dob, '%m-%d') ASC")],
                limit: limit,
                offset: offset,
            });
        }
        if (type == "student") {
            data = await db.Student.findAndCountAll({
                where: {
                    school_id: school_id,
                    request_status: "accepted",
                    [Op.and]: [
                        literal(`DATE_FORMAT(dob, '%m-%d') >= '${start}'`),
                        literal(`DATE_FORMAT(dob, '%m-%d') <= '${end}'`)
                    ]
                },
                order: [literal("DATE_FORMAT(dob, '%m-%d') ASC")],
                limit: limit,
                offset: offset,
            });
        }
        if (type == "principal") {
            data = await db.User.findAndCountAll({
                where: {
                    school_id: school_id,
                    role: "principal",
                    is_deleted: false,
                    is_blocked: false,
                    [Op.and]: [
                        literal(`DATE_FORMAT(dob, '%m-%d') >= '${start}'`),
                        literal(`DATE_FORMAT(dob, '%m-%d') <= '${end}'`)
                    ]
                },
                order: [literal("DATE_FORMAT(dob, '%m-%d') ASC")],
                limit: limit,
                offset: offset,
            });
        }

        return res.status(200).json({
            status: 1,
            message: 'Upcoming  birthdays retrieved successfully',
            total_birthday: data.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(data.count / limit),
            data: data.rows
        });

    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error", error: error.message });
    }
}


module.exports = {
    Attendance,
    listAttendance,
    editPrincipal,
    getAttendance,

    listOtherAttedance,
    todayAttedance,

    listLeave,
    getLeave,
    updateLeaveStatus,
    upcomingBirthday
};
