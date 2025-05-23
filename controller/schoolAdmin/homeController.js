require('dotenv').config();
const db = require('../../config/db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { Op, Sequelize, where } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { PhoneNumberUtil, PhoneNumberFormat } = require("google-libphonenumber");
const { error } = require('console');
const { upload_file, deleteFromS3, uploadVideo } = require("../../helpers/s3_upload");
const { admin } = require('googleapis/build/src/apis/admin');
const phoneUtil = PhoneNumberUtil.getInstance()


const desbordCount = async (req, res) => {
    if (req.user.role != "school") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const principal = await db.User.count({ where: { school_id: req.user.id, role: "principal" } })
        const staff = await db.User.count({ where: { school_id: req.user.id, role: "teacher" } })
        const parent = await db.User.count({ where: { school_id: req.user.id, role: "parent" } })
        const student = await db.Student.count({ where: { school_id: req.user.id, request_status: 'accepted' }})

        return res.status(200).json({
            status: 1,
            message: "Desbord count successfully",
            data: {
                total_principal: principal,
                total_staff: staff,
                total_parent: parent,
                total_student: student
            }
        })

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}


module.exports = {
    desbordCount,
}