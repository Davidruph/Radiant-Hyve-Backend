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


const addparent = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { email, password, full_name, gender, mobile_no, country_code, iso_code, address } = req.body
        const profileImage = req.files.profile_pic[0];

        const existingUser = await db.User.findOne({ where: { email } })
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" })
        }

        if (req.files && req.files.profile_pic) {
            var newProfilePicPath = await upload_file(profileImage, 'profile_pic/')
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

        if (mobile_no) {
            const existMobile = await db.User.findOne({
                where: { mobile_no, iso_code, country_code }
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


        const hashedPassword = await bcrypt.hash(password, 10)
        const parent = await db.User.create({
            email: email,
            password: hashedPassword,
            full_name: full_name,
            gender: gender,
            mobile_no,
            country_code,
            iso_code,
            profile_pic: newProfilePicPath,
            address,
            role: 'parent',
            school_id: school_id
        })

        await db.AddRole.create({
            school_id,
            add_to: parent.id,
            add_by: req.user.id,
            add_role: "parent"
        })

        return res.status(200).json({
            status: 1,
            message: "parent Added Successfully",
            data: parent
        })

    } catch (error) {
        console.error('Error adding parent:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const editParent = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { parent_id, full_name, gender, mobile_no, country_code, iso_code, address } = req.body

        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }
        const parent = await db.User.findOne({
            where: {
                id: parent_id,
                school_id,
                is_deleted: false
            },
        })

        if (!parent) {
            return res.status(404).json({ status: 0, message: "parent not found" })
        }

        let profileImage = null;
        if (req.files && req.files.profile_pic && req.files.profile_pic.length > 0) {
            profileImage = req.files.profile_pic[0];
            var newProfilePicPath = await upload_file(profileImage, 'profile_pic/')
        }

        if (req.files?.profile_pic && parent.profile_pic) {
            await deleteFromS3(parent.profile_pic);
        }

        if (mobile_no) {
            const existMobile = await db.User.findOne({
                where: { mobile_no, iso_code, country_code }
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

        await parent.update({
            gender: gender || parent.gender,
            full_name: full_name || parent.full_name,
            mobile_no: mobile_no || parent.mobile_no,
            country_code: country_code || parent.country_code,
            iso_code: iso_code || parent.iso_code,
            address: address || parent.address,
            profile_pic: newProfilePicPath || parent.profile_pic,
        })

        return res.status(200).json({ status: 1, message: "parent updated successfully", data: parent });

    } catch (error) {
        console.error('Error edit parent:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
};

const listParent = async (req, res) => {
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

        const whereCondition = {
            role: "parent",
            school_id,
            is_deleted: false
        };

        if (search) {
            whereCondition[Op.or] = [
                { full_name: { [Op.like]: `${search}%` } },
                { email: { [Op.like]: `${search}%` } }
            ];
        }

        const parent = await db.User.findAndCountAll({
            where: whereCondition,
            attributes: ["id", "email", "password", "mobile_no", "country_code", "iso_code", "profile_pic", "address","full_name", "is_blocked", "is_deleted",
                [
                    Sequelize.literal(`(
                                SELECT COUNT(*) 
                                FROM tbl_student t2 
                                WHERE t2.parent_id = User.id 
                            )`),
                    "total_student"
                ],
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        })

        return res.status(200).json({
            status: 1,
            message: 'parent retrieved successfully',
            total_parent: parent.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(parent.count / limit),
            data: parent.rows
        });

    } catch (error) {
        console.error('Error list parent:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }

}

const parentDetails = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }

    try {
        const { parent_id } = req.query

        if (!parent_id) {
            return res.status(400).json({ status: 0, message: 'parent_id is requried' })
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

        const parent = await db.User.findOne({
            where: {
                id: parent_id,
                is_deleted: false,
                role: "parent",
                school_id
            },
            attributes: ["id", "email", "password", "full_name", "gender", "mobile_no", "country_code", "iso_code", "profile_pic","is_blocked", "is_deleted",
                [
                    Sequelize.literal(`(
                                    SELECT COUNT(*) 
                                    FROM tbl_student t2 
                                    WHERE t2.parent_id = ${parent_id}
                                )`),
                    "total_student"
                ],
            ],
            include: [
                {
                    model: db.Student,
                    as: "Students",
                    required: false
                }
            ]
        })

        if (!parent) {
            return res.status(404).json({ status: 0, message: "parent not found" })
        }

        return res.status(200).json({
            status: 1,
            message: 'parent get successfully',
            data: parent
        });

    } catch (error) {
        console.error('Error get Staff:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }

}

const editparentPassword = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { password, parent_id } = req.body

        let school_id = null
        if (req.user.role == "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const parent = await db.User.findOne({
            where: {
                id: parent_id,
                school_id,
                role: "parent",
                is_deleted: false
            },
        })

        if (!parent) {
            return res.status(404).json({ status: 0, message: "parent not found" })
        }
        const hashedPassword = await bcrypt.hash(password, 10)

        await parent.update({
            password: hashedPassword
        })

        await db.Token.destroy({
            where: {
                user_id: parent_id,
            },
        });

        return res.status(200).json({
            status: 1,
            message: "Password changed successfully",
        })

    } catch (error) {
        console.error('Error edit parent:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const blockParent = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { parent_id } = req.body

        if (!parent_id) {
            return res.status(400).json({ status: 0, message: 'parent_id is requried' })
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

        const parent = await db.User.findOne({
            where: {
                id: parent_id,
                role: "parent",
                school_id,
                is_deleted: false
            },
        })

        if (!parent) {
            return res.status(404).json({ status: 0, message: "parent not found" })
        }

        const wasBlocked = parent.is_blocked;
        const newIsBlockedStatus = !wasBlocked;

        await parent.update({
            is_blocked: newIsBlockedStatus,
        });

        if (newIsBlockedStatus) {
            await db.Token.destroy({ where: { user_id: parent_id } });
        }

        return res.status(200).json({
            status: 1,
            message: newIsBlockedStatus
                ? "parent blocked successfully"
                : "parent unblocked successfully",
        });
    } catch (error) {
        console.error("Error processing block/unblock request:", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error" });
    }
}

const deletedParent = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { parent_id } = req.query

        if (!parent_id) {
            return res.status(400).json({ status: 0, message: 'parent_id is requried' })
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

        const parent = await db.User.findOne({
            where: {
                id: parent_id,
                role: "parent",
                school_id,
                is_deleted: false
            },
        })

        if (!parent) {
            return res.status(404).json({ status: 0, message: "parent not found" })
        }

        await parent.update({
            is_deleted: true,
        });

        await db.Token.destroy({ where: { user_id: parent_id } });

        return res.status(200).json({
            status: 1,
            message: "parent deleted successfully"
        });
    } catch (error) {
        console.error("Error processing :", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error" });
    }

}





module.exports = {
    addparent,
    blockParent,
    editparentPassword,
    parentDetails,
    listParent,
    editParent,
    deletedParent
}