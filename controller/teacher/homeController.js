require('dotenv').config();
const db = require('../../config/db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { Op, Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { PhoneNumberUtil, PhoneNumberFormat } = require("google-libphonenumber");
const { error } = require('console');
const { upload_file, deleteFromS3, uploadVideo } = require("../../helpers/s3_upload")
const phoneUtil = PhoneNumberUtil.getInstance()



const editProfile = async (req, res) => {
    if (req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { full_name, gender, dob, about_staff, joining_date, experience, mobile_no, country_code, iso_code } = req.body

        const staff = await db.User.findOne({
            where: {
                id: req.user.id,
                role: "teacher",
                is_deleted: false
            },
        })

        if (!staff) {
            return res.status(404).json({ status: 0, message: "staff not found" })
        }

        let profileImage = null;
        if (req.files && req.files.profile_pic && req.files.profile_pic.length > 0) {
            profileImage = req.files.profile_pic[0];
            var newProfilePicPath = await upload_file(profileImage, 'profile_pic/')
        }

        if (req.files?.profile_pic && staff.profile_pic) {
            await deleteFromS3(staff.profile_pic);
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
            if (!isCorrectISO) return res.status(400).json({ Status: 0, message: "ISO CODE does not match country code." });

        }

        await staff.update({
            gender: gender || staff.gender,
            full_name: full_name || staff.full_name,
            mobile_no: mobile_no || staff.mobile_no,
            country_code: country_code || staff.country_code,
            iso_code: iso_code || staff.iso_code,
            dob: dob || staff.dob,
            about_staff: about_staff || staff.about_staff,
            joining_date: joining_date || staff.joining_date,
            profile_pic: newProfilePicPath || staff.profile_pic,
            experience: experience || staff.experience,
        })

        return res.status(200).json({ status: 1, message: "profile updated successfully", data: staff });

    } catch (error) {
        console.error('Error edit staff:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
};

const listMenu = async (req, res) => {
    if (req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page } = req.query;
        if (!page) {
            return res.status(400).json({ status: 0, message: "page is required" })
        }
        const limit = 10
        const offset = (page - 1) * limit


        const student = await db.Student.findAll({
            where: {
                teacher_id: req.user.id,
                request_status: 'accepted',
            },
        });
        const studentIds = student.map(s => s.id);

        const menu = await db.Menu.findAndCountAll({
            where: {
                student_id: {
                    [Op.in]: studentIds
                },
            },
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                      SELECT t2.full_name
                      FROM tbl_student t2
                      WHERE t2.id = Menu.student_id
                    )`),
                        'student_name'
                    ],
                ]
            },
            order: [['createdAt', 'DESC']],
            limit,
            offset,
        });

        return res.status(200).json({
            status: 1,
            message: 'Menu retrieved successfully',
            total_menu: menu.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(menu.count / limit),
            data: menu.rows
        });
    } catch (error) {
        console.error('Error fetching menu:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
};

const listSleepLog = async (req, res) => {
    if (req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { search, page } = req.query;
        if (!page) {
            return res.status(400).json({ status: 0, message: "page is required" })
        }
        const limit = 10
        const offset = (page - 1) * limit

        const whereClause = {
            teacher_id: req.user.id,
            request_status: 'accepted',
        };

        if (search) {
            whereClause[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
                { parent_name: { [Op.like]: `%${search}%` } },
            ];
        }

        const sleepLogs = await db.Student.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: db.SleepLoag,
                    as: "SleepLoag",
                },
            ],
            order: [['id', 'DESC']],
            limit,
            offset
        });

        return res.status(200).json({
            status: 1,
            message: 'student sleepLogs retrieved successfully',
            total_student: sleepLogs.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(sleepLogs.count / limit),
            data: sleepLogs.rows
        });

    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error", error: error.message });
    }
}

const listMedication = async (req, res) => {
    if (req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { page } = req.query
        if (!page) {
            return res.status(400).json({ status: 0, message: 'page is required' });
        }
        const limit = 10
        const offset = (page - 1) * limit

        const student = await db.Student.findAll({
            where: {
                teacher_id: req.user.id,
                request_status: 'accepted',
            },
        });
        const studentIds = student.map(s => s.id);

        const medication = await db.MedicationInfo.findAndCountAll({
            where: {
                student_id: {
                    [Op.in]: studentIds
                },
            },
            attributes: ["id", "student_id", "mobile_no", "country_code", "iso_code", "medication_details", "type_disease", "doctor_name",
                [
                    Sequelize.literal(`(
                      SELECT t2.full_name
                      FROM tbl_student t2
                      WHERE t2.id = MedicationInfo.student_id
                    )`),
                    'student_name'
                ]
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        })

        return res.status(200).json({
            status: 1,
            message: 'medication retrieved successfully',
            total_medication: medication.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(medication.count / limit),
            data: medication.rows
        });

    } catch (error) {
        console.error('Error get medication:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

module.exports = {
    editProfile,
    listMenu,
    listSleepLog,
    listMedication
};