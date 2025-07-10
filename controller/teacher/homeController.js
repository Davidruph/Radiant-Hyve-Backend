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
const moment = require('moment')



const editProfile = async (req, res) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { full_name, gender, dob, about_staff, joining_date, experience, mobile_no, country_code, iso_code } = req.body

        const staff = await db.User.findOne({
            where: { id: req.user.id, role: "teacher", is_deleted: false }
        })

        if (!staff) {
            return res.status(404).json({ status: 0, message: "Staff not found" })
        }

        let newProfilePicPath;
        if (req.files?.profile_pic?.[0]) {
            newProfilePicPath = await upload_file(req.files.profile_pic[0], 'profile_pic/')
            if (staff.profile_pic) await deleteFromS3(staff.profile_pic)
        }

        if (mobile_no) {
            const existMobile = await db.User.findOne({
                where: {
                    mobile_no, iso_code, country_code,
                    id: { [Op.not]: req.user.id },
                    is_deleted: false
                }
            })

            if (existMobile) {
                return res.status(409).json({ status: 0, message: 'This mobile number is already registered.' })
            }

            try {
                const number = phoneUtil.parse(mobile_no, iso_code)
                if (!phoneUtil.isValidNumber(number) || phoneUtil.getRegionCodeForNumber(number) !== iso_code) {
                    return res.status(400).json({ status: 0, message: "Phone number is not correct." })
                }
            } catch {
                return res.status(400).json({ status: 0, message: "Number or ISO code not matched." })
            }
        }

        const updateData = {}
        if (full_name) updateData.full_name = full_name
        if (gender) updateData.gender = gender
        if (dob) updateData.dob = dob
        if (about_staff) updateData.about_staff = about_staff
        if (joining_date) updateData.joining_date = joining_date
        if (experience) updateData.experience = experience
        if (mobile_no) {
            updateData.mobile_no = mobile_no
            updateData.country_code = country_code
            updateData.iso_code = iso_code
        }
        if (newProfilePicPath) updateData.profile_pic = newProfilePicPath

        await staff.update(updateData)

        return res.status(200).json({ status: 1, message: "Profile updated successfully", data: staff })

    } catch (error) {
        console.error('Error editing profile:', error)
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message })
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
                [Op.or]: [
                    {
                        student_id: {
                            [Op.in]: studentIds
                        }
                    },
                    {
                        is_all: true
                    }
                ],
                school_id: req.user.school_id
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
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                           SELECT t2.email
                           FROM tbl_user t2
                           WHERE t2.id = Student.parent_id
                        )`),
                        'email',
                    ],
                ]
            },
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
    if (req.user.role !== "teacher") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" });
    }

    try {
        const { page, search } = req.query;
        if (!page) {
            return res.status(400).json({ status: 0, message: 'Page is required' });
        }
        const limit = 10;
        const offset = (page - 1) * limit;

        const student = await db.Student.findAll({
            where: {
                teacher_id: req.user.id,
                request_status: 'accepted',
            },
        });
        const studentIds = student.map(s => s.id);

        let whereClause = {
            student_id: {
                [Op.in]: studentIds,
            },
        };

        if (search) {
            whereClause = {
                ...whereClause,
                [Op.or]: [
                    {
                        doctor_name: {
                            [Op.like]: `%${search}%`, // Case-insensitive search for doctor_name
                        },
                    },
                    {
                        '$MedicationInfoStudent.full_name$': {
                            [Op.like]: `%${search}%`, // Case-insensitive search for student_name
                        },
                    },
                ],
            };
        }

        const medication = await db.MedicationInfo.findAndCountAll({
            where: whereClause,
            attributes: [
                "id",
                "student_id",
                "mobile_no",
                "country_code",
                "iso_code",
                "medication_details",
                "type_disease",
                "doctor_name",
                [
                    Sequelize.literal(`(
                        SELECT t2.full_name
                        FROM tbl_student t2
                        WHERE t2.id = MedicationInfo.student_id
                    )`),
                    'student_name',
                ],
            ],
            include: [
                {
                    model: db.Student,
                    as: 'MedicationInfoStudent',
                    attributes: [],
                },
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });

        return res.status(200).json({
            status: 1,
            message: 'Medication retrieved successfully',
            total_medication: medication.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(medication.count / limit),
            data: medication.rows,
        });
    } catch (error) {
        console.error('Error getting medication:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
};

const listStudetMenu = async (req, res) => {
    if (req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { search } = req.query;
        const whereClause = {
            teacher_id: req.user.id,
            request_status: 'accepted',
        };
        if (search) {
            whereClause[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
            ];
        }

        const student = await db.Student.findAll({
            where: whereClause,
            attributes: ['id', 'full_name'],
        });

        return res.status(200).json({
            status: 1,
            message: 'student retrieved successfully',
            data: student
        });
    } catch (error) {
        console.error('Error fetching student menu:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}


module.exports = {
    editProfile,
    listMenu,
    listSleepLog,
    listMedication,
    listStudetMenu,
};