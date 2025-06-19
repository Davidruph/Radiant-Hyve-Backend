require('dotenv').config();
const db = require('../../config/db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { Op, fn, col, literal } = require("sequelize");
const fs = require('fs').promises;
const path = require("path");
const { PhoneNumberUtil, PhoneNumberFormat } = require("google-libphonenumber");
const { error } = require('console');
const { upload_file, deleteFromS3, uploadVideo } = require("../../helpers/s3_upload")
const phoneUtil = PhoneNumberUtil.getInstance()



const addPrincipal = async (req, res) => {
    if (req.user.role != "school") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { email, password, full_name, gender, dob, qualification, designation, experience, mobile_no, country_code, iso_code } = req.body
        const profileImage = req.files.profile_pic[0];

        const existingUser = await db.User.findOne({ where: { email } })
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" })
        }

        if (req.files && req.files.profile_pic) {
            var newProfilePicPath = await upload_file(profileImage, 'profile_pic/')
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
            if (!isCorrectISO) return res.status(400).json({ Status: 0, message: "ISO CODE does not match country code." });

        }


        const hashedPassword = await bcrypt.hash(password, 10)
        const principal = await db.User.create({
            email: email,
            password: hashedPassword,
            full_name: full_name,
            gender: gender,
            mobile_no,
            country_code,
            iso_code,
            dob: dob,
            qualification: qualification,
            designation: designation,
            profile_pic: newProfilePicPath,
            experience: experience,
            role: 'principal',
            school_id: req.user.id
        })

        return res.status(200).json({
            status: 1,
            message: "Principal Added Successfully",
            data: principal
        })

    } catch (error) {
        console.error('Error adding principal:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const editPrincipal = async (req, res) => {
    if (req.user.role !== "school") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" });
    }

    try {
        const { principal_id,
            full_name, dob,
            qualification, gender, designation, experience,
            mobile_no, country_code, iso_code
        } = req.body;

        const principal = await db.User.findOne({
            where: {
                id: principal_id,
                school_id: req.user.id,
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
                    id: { [Op.not]: principal_id },
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

const changePrincipalPassword = async (req, res) => {
    if (req.user.role !== "school") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" });
    }
    try {
        const { password, principal_id } = req.body

        const principal = await db.User.findOne({
            where: {
                id: principal_id,
                school_id: req.user.id,
                is_deleted: false
            },
        })

        if (!principal) {
            return res.status(404).json({ status: 0, message: "Principal not found" })
        }
        const hashedPassword = await bcrypt.hash(password, 10)

        await principal.update({
            password: hashedPassword
        })

        await db.Token.destroy({
            where: {
                user_id: principal_id,
            },
        });

        return res.status(200).json({
            status: 1,
            message: "Password changed successfully",
        })

    } catch (error) {
        console.error('Error edit principal:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const listPrincipal = async (req, res) => {
    if (req.user.role !== "school") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" });
    }
    try {
        const { page, search } = req.query
        if (!page) {
            return res.status(400).json({ status: 0, message: 'page is required' });
        }
        const limit = 10
        const offset = (page - 1) * limit

        const whereCondition = {
            role: "principal",
            school_id: req.user.id,
            is_deleted: false
        };

        if (search) {
            whereCondition[Op.or] = [
                { full_name: { [Op.like]: `${search}%` } },
                { email: { [Op.like]: `${search}%` } }
            ];
        }

        const principal = await db.User.findAndCountAll({
            where: whereCondition,
            attributes: ["id", "email", "password", "full_name", "gender", "dob", "qualification", "designation", "experience", "mobile_no", "country_code", "iso_code", "is_blocked", "is_deleted"],
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        })

        return res.status(200).json({
            status: 1,
            message: 'principal retrieved successfully',
            total_principal: principal.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(principal.count / limit),
            data: principal.rows
        });

    } catch (error) {
        console.error('Error list principal:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const getPrincipal = async (req, res) => {
    if (req.user.role !== "school") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" });
    }
    try {
        const { principal_id } = req.query

        if (!principal_id) {
            return res.status(400).json({ status: 0, message: 'principal_id is requried' })
        }

        const principal = await db.User.findOne({
            where: {
                id: principal_id,
                role: "principal",
                school_id: req.user.id,
                is_deleted: false
            },
            attributes: ["id", "email", "password", "full_name", "gender", "dob", "qualification", "designation", "experience", "mobile_no", "country_code", "iso_code", "profile_pic", "is_blocked", "is_deleted"],
            include: [
                {
                    model: db.Attendance,
                    as: "userAttend"
                }
            ]
        })

        if (!principal) {
            return res.status(404).json({ status: 0, message: "Principal not found" })
        }

        return res.status(200).json({
            status: 1,
            message: 'principal get successfully',
            data: principal
        });

    } catch (error) {
        console.error('Error get principal:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const deletePrincipal = async (req, res) => {
    if (req.user.role !== "school") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" });
    }
    try {
        const { principal_id } = req.query
        if (!principal_id) {
            return res.status(400).json({ status: 0, message: "principal_id is required." })
        }
        const principal = await db.User.findOne({
            where: {
                id: principal_id,
                school_id: req.user.id,
                role: "principal",
                is_deleted: false
            },
        })

        if (!principal) {
            return res.status(404).json({ status: 0, message: "Principal not found" })
        }

        await principal.update({
            is_deleted: true
        })

        await db.Token.destroy({
            where: {
                user_id: principal_id
            }
        })

        return res.status(200).json({
            status: 1,
            message: 'principal deleted successfully',
        })

    } catch (error) {
        console.error('Error ddlete principal:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
}

const blockPrincipal = async (req, res) => {
    if (req.user.role !== "school") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" });
    }
    try {
        const { principal_id } = req.body
        if (!principal_id) {
            return res.status(400).json({ status: 0, message: "principal_id is required." })
        }
        const principal = await db.User.findOne({
            where: { id: principal_id, role: "principal", school_id: req.user.id, is_deleted: false },
        });

        if (!principal) {
            return res.status(404).json({ status: 0, message: "principal not found" });
        }

        const wasBlocked = principal.is_blocked;
        const newIsBlockedStatus = !wasBlocked;

        await principal.update({
            is_blocked: newIsBlockedStatus,
        });

        if (principal.is_blocked == true) {
            await db.Token.destroy({ where: { user_id: principal_id } });
        }

        return res.status(200).json({
            status: 1,
            message: newIsBlockedStatus
                ? "principal blocked successfully"
                : "principal unblocked successfully",
        });
    } catch (error) {
        console.error("Error processing block/unblock request:", error);
        return res.status(500).json({ status: 0, message: "Internal Server Error" });
    }
}

const editProfile = async (req, res) => {
    if (req.user.role !== "school") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" });
    }
    const { name, address } = req.body;

    try {
        const school = await db.User.findOne({
            where: {
                id: req.user.id,
                role: 'school',
                is_deleted: false
            },
        });

        school.school_name = name || school.school_name;
        school.address = address || school.address;

        await school.save();

        return res.status(200).json({ status: 1, message: 'School updated successfully', data: school });

    } catch (error) {
        console.error('Error updating school:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }

}

const getAttedanceCount = async (req, res) => {
    if (req.user.role !== "school" && req.user.role !== "principal") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" });
    }

    try {
        const { user_id, year } = req.query;

        let school_id;
        if (req.user.role === "principal") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            });
            school_id = principal.school_id;
        } else {
            school_id = req.user.id;
        }

        const user = await db.User.findOne({
            where: {
                id: user_id,
                school_id,
                role: { [Op.or]: ['teacher', 'principal'] }
            }
        });

        if (!user) {
            return res.status(404).json({ status: 0, message: "User not found" });
        }

        // Count unique dates per month
        const attendanceData = await db.Attendance.findAll({
            attributes: [
                [fn('MONTH', col('date')), 'month'],
                // [fn('COUNT', fn('DISTINCT', col('DATE(date)'))), 'count'] // Count unique days
                [literal('COUNT(DISTINCT DATE(`date`))'), 'count'] // Use literal for DATE function
            ],
            where: {
                user_id,
                school_id,
                date: {
                    [Op.gte]: new Date(`${year}-01-01`),
                    [Op.lte]: new Date(`${year}-12-31`)
                }
            },
            group: [literal('MONTH(date)')],
            order: [literal('MONTH(date) ASC')]
        });

        const monthMap = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const response = {};

        monthMap.forEach(month => {
            response[month] = 0;
        });

        attendanceData.forEach(row => {
            const monthIndex = parseInt(row.dataValues.month) - 1;
            const monthName = monthMap[monthIndex];
            response[monthName] = parseInt(row.dataValues.count);
        });

        return res.status(200).json({
            status: 1,
            message: 'Attendance summary retrieved successfully',
            data: response
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error', error: error.message });
    }
};


module.exports = {
    addPrincipal,
    editPrincipal,
    changePrincipalPassword,
    listPrincipal,
    getPrincipal,
    deletePrincipal,
    blockPrincipal,
    editProfile,
    getAttedanceCount
}