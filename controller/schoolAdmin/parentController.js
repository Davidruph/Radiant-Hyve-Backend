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
const { AddRoleEmail, updateRolePasswordEmail, deleteEmail, blockEmail, unblockEmail } = require('../../helpers/email');

function generateCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstvwxyz0123456789@#$%&*!';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const addparent = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { email, full_name, gender, mobile_no, country_code, iso_code, address } = req.body
        const profileImage = req.files?.profile_pic;

        const existingUser = await db.User.findOne({ where: { email, is_deleted: false, } })
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" })
        }

        if (req.files && req.files?.profile_pic) {
            var newProfilePicPath = await upload_file(profileImage[0], 'profile_pic/')
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
                where: { mobile_no, iso_code, country_code, is_deleted: false }
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
        const password = generateCode(8)
        const hashedPassword = await bcrypt.hash(password, 10)
        const parent = await db.User.create({
            email: email,
            password: hashedPassword,
            full_name: full_name,
            gender: gender,
            mobile_no,
            country_code,
            iso_code,
            profile_pic: newProfilePicPath || null,
            address,
            role: 'parent',
            school_id: school_id
        })

        const school = await db.User.findByPk(school_id)
        await AddRoleEmail(school.school_name, email, password, "Parent")

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
                where: {
                    mobile_no,
                    iso_code,
                    country_code,
                    id: { [Op.not]: parent_id },
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
            attributes: ["id", "email", "password", "mobile_no", "country_code", "iso_code", "profile_pic", "address", "full_name", "is_blocked", "is_deleted",
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
            attributes: ["id", "email", "password", "full_name", "gender", "mobile_no", "country_code", "iso_code", "profile_pic", "is_blocked", "is_deleted", "address",
                [
                    Sequelize.literal(`(
                                    SELECT COUNT(*) 
                                    FROM tbl_student t2 
                                    WHERE t2.parent_id = ${parent_id}
                                )`),
                    "total_student"
                ],
                [
                    Sequelize.literal(`(
                        SELECT t2.id
                        FROM tbl_chat t2
                        WHERE (
                        (t2.chat_by = User.id AND t2.chat_to = ${req.user.id}) OR
                         (t2.chat_by = ${req.user.id} AND t2.chat_to = User.id)
                       )
                    )`),
                    'chat_id',
                ],
            ],
            include: [
                {
                    model: db.Student,
                    as: "Students",
                    required: false,
                    attributes: {
                        include: [
                            [
                                Sequelize.literal(`(
                           SELECT t2.shift_name
                           FROM tbl_shift t2
                           WHERE t2.id = Students.shift_id
                        )`),
                                'shift_name',
                            ]
                        ]
                    }
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


        const school = await db.User.findByPk(school_id)
        await updateRolePasswordEmail(school.school_name, parent.email, password, "Parent")


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
        const { parent_id, block_reason } = req.body

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
            block_reason: block_reason || null
        });

        const school = await db.User.findByPk(school_id);
        if (parent.is_blocked == true) {
            await db.Token.destroy({ where: { user_id: parent_id } });
            const reason = block_reason || "No reason admin";
            await blockEmail(parent.full_name, school.school_name, parent.email, "Parent", reason)
        } else {
            await unblockEmail(parent.full_name, school.school_name, parent.email, "Parent")
        }


        return res.status(200).json({
            status: 1,
            message: newIsBlockedStatus
                ? "parent blocked successfully"
                : "parent unblocked successfully",
            data: {
                id: parent.id,
                is_blocked: parent.is_blocked,
                block_reason: parent.block_reason
            }
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
        const { parent_id, delete_reason } = req.query

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

        const school = await db.User.findByPk(school_id);
        const reason = delete_reason || "No reason admin";
        await deleteEmail(school.school_name, parent.email, reason, "Parent", parent.full_name);

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