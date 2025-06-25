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
const { studentRequestEmail } = require('../../helpers/email');
const phoneUtil = PhoneNumberUtil.getInstance()


const createStudent = async (req, res) => {
    if (req.user.role != "parent") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { shift_id, address, madical_insuarance_no, relation_to_child, dob, gender, full_name, mobile_no, country_code, iso_code, email } = req.body
        const profileImage = req.files?.profile_pic[0];

        const shift = await db.Shift.findOne({
            where: {
                id: shift_id,
                school_id: req.user.school_id
            }
        })

        if (!shift) {
            return res.status(404).json({ status: 0, message: "Shift not found" })
        }

        if (req.files && req.files.profile_pic) {
            var newProfilePicPath = await upload_file(profileImage, 'profile_pic/')
        }

        const student = await db.Student.create({
            shift_id: shift_id,
            address: address,
            madical_insuarance_no: madical_insuarance_no,
            relation_to_child: relation_to_child,
            dob: dob,
            gender: gender,
            full_name: full_name,
            mobile_no: mobile_no,
            country_code: country_code,
            iso_code: iso_code,
            email: email,
            profile_pic: newProfilePicPath || null,
            parent_id: req.user.id,
            parent_name: req.user.full_name,
            school_id: req.user.school_id,
        })
        const school = await db.User.findByPk(req.user.school_id)

        await studentRequestEmail(full_name, email, school.school_name, req.user.full_name);

        return res.status(200).json({
            status: 1,
            message: "Student created successfully",
            data: student
        })

    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const editStudent = async (req, res) => {
    if (req.user.role != "parent" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { student_id, shift_id, address, madical_insuarance_no, relation_to_child, dob, gender, full_name, mobile_no, country_code, iso_code, email, teacher_id } = req.body

        const student = await db.Student.findOne({
            where: {
                id: student_id,
                school_id: req.user.school_id
            }
        })

        if (!student) {
            return res.status(404).json({ status: 0, message: "Student not found" })
        }
        if (shift_id) {
            const shift = await db.Shift.findOne({
                where: {
                    id: shift_id,
                    school_id: req.user.school_id
                }
            })

            if (!shift) {
                return res.status(404).json({ status: 0, message: "Shift not found" })
            }
        }

        if (teacher_id) {
            const teacher = await db.User.findOne({
                where: {
                    id: teacher_id,
                    school_id: req.user.school_id,
                    role: "teacher"
                }
            })
            if (!teacher) {
                return res.status(404).json({ status: 0, message: "Teacher not found" })
            }
        }

        if (req.files && req.files?.profile_pic && req.files.profile_pic.length > 0) {
            profileImage = req.files.profile_pic[0];
            var newProfilePicPath = await upload_file(profileImage, 'profile_pic/')
        }

        if (req.files?.profile_pic && student.profile_pic) {
            await deleteFromS3(student.profile_pic);
        }

        await student.update({
            gender: gender || student.gender,
            full_name: full_name || student.full_name,
            mobile_no: mobile_no || student.mobile_no,
            country_code: country_code || student.country_code,
            iso_code: iso_code || student.iso_code,
            dob: dob || student.dob,
            profile_pic: newProfilePicPath || student.profile_pic,
            email: email || student.email,
            address: address || student.address,
            medical_insurance_no: madical_insuarance_no || student.medical_insurance_no,
            relation_to_child: relation_to_child || student.relation_to_child,
            shift_id: shift_id || student.shift_id,
            teacher_id: teacher_id || student.teacher_id,
        })

        return res.status(200).json({
            status: 1,
            message: "Student edited successfully",
            data: student
        })

    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const delteStudent = async (req, res) => {
    if (req.user.role != "parent" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { student_id } = req.query

        if (student_id) {
            return res.status(400).json({ status: 0, message: "student_id is required" })
        }

        const student = await db.Student.findOne({
            where: {
                school_id: req.user.school_id,
                request_status: {
                    [Op.not]: 'inActive'
                }
            },
        })

        if (!student) {
            return res.status(404).json({ status: 0, message: 'Student not found' })
        }

        await student.update({
            request_status: 'inActive',
        })

        return res.status(200).json({ status: 1, message: 'Student deleted successfully' })
    } catch (error) {
        console.error('Error :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }

}







module.exports = {
    delteStudent,
    createStudent,
    editStudent,
}