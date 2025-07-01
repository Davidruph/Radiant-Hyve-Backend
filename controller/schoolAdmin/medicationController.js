require('dotenv').config();
const db = require('../../config/db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { Op, Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { PhoneNumberUtil, PhoneNumberFormat } = require("google-libphonenumber");
const { error } = require('console');
const { upload_file, deleteFromS3, uploadVideo } = require("../../helpers/s3_upload");
const { admin } = require('googleapis/build/src/apis/admin');
const phoneUtil = PhoneNumberUtil.getInstance()


const addMedication = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal" && req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { student_id, doctor_name, type_disease, medication_details, iso_code, country_code, mobile_no } = req.body

        let school_id = null
        if (req.user.role == "principal" || req.user.role == "teacher") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
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

        const student = await db.Student.findOne({
            where: { id: student_id, school_id }
        })

        if (!student) {
            return res.status(404).json({ status: 0, message: "Student not found" })
        }

        const medication = await db.MedicationInfo.create({
            student_id: student_id,
            doctor_name: doctor_name,
            type_disease: type_disease,
            medication_details: medication_details,
            iso_code: iso_code,
            country_code: country_code,
            mobile_no: mobile_no,
            school_id,
            admin_id: req.user.id
        })

        return res.status(200).json({
            status: 1,
            message: "Medication added successfully",
            data: medication
        })

    } catch (error) {
        console.error('Error adding medication:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const editMedication = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal" && req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { medication_id, student_id, doctor_name, type_disease, medication_details, iso_code, country_code, mobile_no } = req.body

        let school_id = null
        if (req.user.role == "principal" || req.user.role == "teacher") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const medication = await db.MedicationInfo.findOne({
            where: {
                id: medication_id,
                school_id: school_id
            }
        })

        if (!medication) {
            return res.status(404).json({ status: 0, message: "Medication not found " })
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


        if (student_id) {
            const student = await db.Student.findOne({
                where: { id: student_id, school_id }
            })

            if (!student) return res.status(404).json({ status: 0, message: "Student not found" })
        }

        await medication.update({
            student_id: student_id || medication.student_id,
            doctor_name: doctor_name || medication.doctor_name,
            type_disease: type_disease || medication.type_disease,
            medication_details: medication_details || medication.medication_details,
            iso_code: iso_code || medication.iso_code,
            country_code: country_code || medication.country_code,
            mobile_no: mobile_no || medication.mobile_no,
        })

        return res.status(200).json({
            status: 1,
            message: "Medication edit successfully",
            data: medication
        })

    } catch (error) {
        console.error('Error edit medication:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const getMedication = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal" && req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { medication_id } = req.query

        if (!medication_id) {
            return res.status(400).json({ status: 0, message: "medication_id is required" })
        }

        let school_id = null
        if (req.user.role == "principal" || req.user.role == "teacher") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const medication = await db.MedicationInfo.findOne({
            where: {
                id: medication_id,
                school_id: school_id
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
        })

        if (!medication) {
            return res.status(404).json({ status: 0, message: "Medication not found " })
        }

        return res.status(200).json({ status: 1, message: "get medication ditails successfully", data: medication })

    } catch (error) {
        console.error('Error edit medication:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}


const listMedication = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal" && req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { page } = req.query
        if (!page) {
            return res.status(400).json({ status: 0, message: 'page is required' });
        }
        const limit = 10
        const offset = (page - 1) * limit

        let school_id = null
        if (req.user.role == "principal" || req.user.role == "teacher") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const medication = await db.MedicationInfo.findAndCountAll({
            where: {
                school_id: school_id
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

const deleteMedication = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal" && req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { medication_id } = req.query

        if (!medication_id) {
            return res.status(400).json({ status: 0, message: "medication_id is required" })
        }

        let school_id = null
        if (req.user.role == "principal" || req.user.role == "teacher") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const medication = await db.MedicationInfo.findOne({
            where: {
                id: medication_id,
                school_id: school_id
            },
        })

        if (!medication) {
            return res.status(404).json({ status: 0, message: "Medication not found " })
        }

        await medication.destroy()

        return res.status(200).json({ status: 1, message: "medication deleted successfully" })

    } catch (error) {
        console.error('Error deleted medication:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }

}

const listStudent = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal" && req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        let school_id = null
        if (req.user.role == "principal" || req.user.role == "teacher") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const medicationRecords = await db.MedicationInfo.findAll({
            where: {
                school_id: school_id
            },
            attributes: ["student_id"],
            raw: true
        })

        const studentIdsWithMedication = medicationRecords.map(m => m.student_id);

        const whereCondition = {
            school_id,
            request_status: 'accepted',
        };

        if (studentIdsWithMedication.length > 0) {
            whereCondition.id = {
                [db.Sequelize.Op.notIn]: studentIdsWithMedication
            };
        }

        const student = await db.Student.findAll({
            where: whereCondition,
            attributes: ["id", "full_name"]
        });

        return res.status(200).json({
            status: 1,
            message: 'student retrieved successfully',
            data: student
        });

    } catch (error) {
        console.error('Error deleted medication:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}



module.exports = {
    addMedication,
    editMedication,
    getMedication,
    listMedication,
    deleteMedication,
    listStudent,
}