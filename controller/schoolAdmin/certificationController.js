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



const addCertificate = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { staff_id, hire_checklist, institution_name } = req.body

        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const staff = await db.User.findOne({
            where: { id: staff_id, role: "teacher", school_id },
        })

        if (!staff) {
            return res.status(404).json({ status: 0, message: "staff not found" })
        }

        const certificate = await db.Certification.create({
            staff_id: staff_id,
            hire_checklist: hire_checklist,
            institution_name: institution_name,
            school_id,
            admin_id: req.user.id,
        })

        return res.status(200).json({ status: 1, message: "Certificate added successfully", data: certificate })

    } catch (error) {
        console.error('Error adding certificate:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const editCertification = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { certificate_id, staff_id, hire_checklist, institution_name } = req.body

        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const certification = await db.Certification.findOne({ where: { id: certificate_id, school_id } })
        if (!certification) {
            return res.status(404).json({ status: 0, message: "Certificate not found" })
        }

        await db.Certification.update({
            staff_id: staff_id || certification.staff_id,
            hire_checklist: hire_checklist || certification.hire_checklist,
            institution_name: institution_name || certification.institution_name
        })

        return res.status(200).json({ status: 1, message: "Certificate edited successfully", data: certification })

    } catch (error) {
        console.error('Error edit certificate:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const deleteCertificat = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { certificate_id } = req.query

        if (!certificate_id) {
            return res.status(400).json({ status: 0, message: "certificate_id is required" })
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

        const certification = await db.Certification.findOne({ where: { id: certificate_id, school_id } })
        if (!certification) {
            return res.status(404).json({ status: 0, message: "Certificate not found" })
        }

        await certification.destroy()
        return res.status(200).json({ status: 1, message: "Certificate deleted successfully" })

    } catch (error) {
        console.error('Error delete certificate:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const getCertificat = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { certificate_id } = req.query

        if (!certificate_id) {
            return res.status(400).json({ status: 0, message: "certificate_id is required" })
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

        const certification = await db.Certification.findOne({
            where: { id: certificate_id, school_id },
            attributes: ["id", "staff_id", "hire_checklist", "institution_name",
                [
                    Sequelize.literal(`(
                      SELECT t2.full_name
                      FROM tbl_user t2
                      WHERE t2.id = Certification.staff_id
                    )`),
                    'staff_name'
                ]
            ],
        })
        if (!certification) {
            return res.status(404).json({ status: 0, message: "Certificate not found" })
        }

        return res.status(200).json({ status: 1, message: "get certificate ditails successfully", data: certification })

    } catch (error) {
        console.error('Error get certificate:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}


const listCertificate = async (req, res) => {
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

        const certificate = await db.Certification.findAndCountAll({
            where: { school_id },
            attributes: ["id", "staff_id", "hire_checklist", "institution_name",
                [
                    Sequelize.literal(`(
                      SELECT t2.full_name
                      FROM tbl_user t2
                      WHERE t2.id = Certification.staff_id
                    )`),
                    'staff_name'
                ]
            ],
            include: [
                {
                    model: db.User,
                    as: 'certificats',
                    attributes: ['id', 'full_name'],
                    where: search
                        ? {
                            full_name: {
                                [Op.iLike]: `%${search}%`
                            }
                        }
                        : [],
                    required: true
                }
            ],

        })

        return res.status(200).json({
            status: 1,
            message: 'certificate retrieved successfully',
            total_certificat: certificate.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(certificate.count / limit),
            data: certificate.rows
        });

    } catch (error) {
        console.error('Error get certificate:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}


module.exports = {
    addCertificate,
    editCertification,
    deleteCertificat,
    getCertificat,
    listCertificate
}