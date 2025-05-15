require('dotenv').config();
const db = require('../../config/db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { Op, Sequelize, where } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { PhoneNumberUtil, PhoneNumberFormat } = require("google-libphonenumber");
const phoneUtil = PhoneNumberUtil.getInstance()
// const { sendOtpEmail } = require('../../utils/email');
const { v4: uuidv4 } = require("uuid");
const { upload_file, deleteFromS3, uploadVideo } = require('../../helpers/s3_upload')


const addSchool = async (req, res) => {
    if(req.user.role != "super_admin"){
        return res.status(401).json({message: "Unauthorized"})
    }
    const { name, email, password, address } = req.body;

    try {
        const existingUser = await db.User.findOne({where: {email}})
        if(existingUser){
            return res.status(400).json({message: "Email already exists"})
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await db.User.create({
            school_name: name,
            email,
            password: hashedPassword,
            address,
            role: 'school',
        });

        return res.status(201).json({ status: 1, message: 'School added successfully', data: user });

    } catch (error) {
        console.error('Error adding school:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
};

const listSchool = async (req, res) => {
    if(req.user.role != "super_admin"){
        return res.status(401).json({message: "Unauthorized"})
    }
    try {
        const { page } = req.query

        if (!page) {
            return res.status(400).json({ status: 0, message: 'page is required' });
        }
        const limit = 10
        const offset = (page - 1) * limit

        const schools = await db.User.findAndCountAll({
            where: {
                role: 'school',
            },
            attributes: ['id', 'school_name', 'email', 'address', 'subscription_plan', 'is_blocked'],
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']],
        });
        return res.status(200).json({
            status: 1,
            message: 'Schools retrieved successfully',
            total_school: schools.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(schools.count / limit),
            data: schools.rows
        });
    } catch (error) {
        console.error('Error retrieving schools:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const editSchool = async (req, res) => {
    if(req.user.role != "super_admin"){
        return res.status(401).json({message: "Unauthorized"})
    }
    const { name, address, id } = req.body;

    try {
        const school = await db.User.findOne({
            where: {
                id: id,
                role: 'school',
            },
        });

        if (!school) {
            return res.status(404).json({ status: 0, message: 'School not found' });
        }

        school.school_name = name || school.school_name;
        school.address = address || school.address;

        await school.save();

        return res.status(200).json({ status: 1, message: 'School updated successfully', data: school });

    } catch (error) {
        console.error('Error updating school:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
};

const changeSchoolPassword = async (req, res) => {
    if(req.user.role != "super_admin"){
        return res.status(401).json({message: "Unauthorized"})
    }
    const { password, id } = req.body;
    try {
        const school = await db.User.findOne({
            where: {
                id: id,
                role: 'school',
            },
        });
        if (!school) {
            return res.status(404).json({ status: 0, message: 'School not found' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        school.password = hashedPassword;
        await school.save();
        await db.Token.destroy({
            where: {
                user_id: id,
            },
        });

        return res.status(200).json({ status: 1, message: 'School password updated successfully' });
    } catch (error) {
        console.error('Error updating school password:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }

}

const deleteSchool = async (req, res) => {
    if(req.user.role != "super_admin"){
        return res.status(401).json({message: "Unauthorized"})
    }
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ status: 0, message: 'id is required' });
    }

    try {
        const school = await db.User.findOne({
            where: {
                id: id,
                role: 'school',
            },
        });
        if (!school) {
            return res.status(404).json({ status: 0, message: 'School not found' });
        }
        await db.Token.destroy({
            where: {
                user_id: id,
            },
        });
        await school.destroy();
        return res.status(200).json({ status: 1, message: 'School deleted successfully' });
    } catch (error) {
        console.error('Error deleting school:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
};

const getSchoolById = async (req, res) => {
    if(req.user.role != "super_admin"){
        return res.status(401).json({message: "Unauthorized"})
    }
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ status: 0, message: 'id is required' });
    }

    try {
        const school = await db.User.findOne({
            where: {
                id: id,
                role: 'school',
            },
        }); 
        if (!school) {
            return res.status(404).json({ status: 0, message: 'School not found' });
        }

        const data = {
            id: school.id,
            school_name: school.school_name,
            email: school.email,
            address: school.address,
            subscription_plan: school.subscription_plan,
            is_blocked: school.is_blocked,
        };

        const teacherCount = await db.User.count({
            where: {
                school_id: id,
                role: 'teacher',
            },
        });
        const principalCount = await db.User.count({
            where: {
                school_id: id,
                role: 'principal',
            },
        });
        const parentCount = await db.User.count({
            where: {
                school_id: id,
                role: 'parent',
            },
        });
        const studentCount = await db.Student.count({
            where: {
                school_id: id,
            },
        });


        return res.status(200).json({
            status: 1,
            message: 'School retrieved successfully',
            data: data,
            teacher_count: teacherCount || 0,
            principal_count: principalCount || 0,
            parent_count: parentCount || 0,
            student_count: studentCount || 0,
        });
    }
    catch (error) {
        console.error('Error retrieving school:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
};



module.exports = {
    addSchool,
    listSchool,
    editSchool,
    changeSchoolPassword,
    deleteSchool,
    getSchoolById,
};