require('dotenv').config();
const db = require('../../config/db')
const { Op, Sequelize, col, fn, where } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { PhoneNumberUtil, PhoneNumberFormat } = require("google-libphonenumber");
const { error } = require('console');
const { upload_file, deleteFromS3, uploadVideo } = require("../../helpers/s3_upload");
const { send_notification } = require('../../helpers/notification')
const moment = require('moment');
const { log } = require('winston');


const blockStudent = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { student_id } = req.body
        if (!student_id) {
            return res.status(400).json({ status: 0, message: "student_id is required" })
        }
        let school_id = req.user.id
        if (req.user.role == "principal") {
            school_id = req.user.school_id
        }
        const student = await db.Student.findOne({
            where: {
                id: student_id,
                school_id: school_id,
                request_status: { [Op.in]: ["accepted", "feesPending"] }
            }
        })
        if (!student) {
            return res.status(400).json({ status: 0, message: "Student not found" })
        }
        if (student.request_status == "feesPending") {
            await student.update({
                request_status: "accepted"
            })
            return res.status(200).json({ status: 1, message: "Student Unblocked successfully" })
        }
        await student.update({
            request_status: "feesPending"
        })
        return res.status(200).json({ status: 1, message: "Student blocked successfully" })

    } catch (error) {
        console.error('Error:', error)
        return res.status(500).json({ status: 0, message: "Internal server error", error: error.message })
    }
}

const makePayment = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        let { student_id, month, year , comment, payment_type} = req.body;
        let school_id = req.user.id;

        if (req.user.role == "principal") {
            school_id = req.user.school_id;
        }

        const now = new Date();
        if (!month) month = now.getMonth() + 1; // current month (1-based)
        if (!year) year = now.getFullYear(); // current year

        const student = await db.Student.findOne({
            where: {
                id: student_id,
                school_id: school_id,
                request_status: { [Op.in]: ["accepted", "feesPending"] }
            }
        });
        if (!student) {
            return res.status(400).json({ status: 0, message: "Student not found" });
        }

        if (student.request_status == "feesPending") {
            await student.update({ request_status: "accepted" });
        }

        const shift = await db.Shift.findByPk(student.shift_id);

        let invoice = {}
        invoice = await db.Invoice.findOne({
            where: {
                student_id,
                school_id,
                parent_id: student.parent_id,
                month: month,
                year: year,
                total_fees: shift.shift_fee
            }
        });

        if (invoice) {
            return res.status(400).json({ status: 0, message: "This student already paid the fees for this month" });
        } else {
            invoice = await db.Invoice.create({
                student_id,
                school_id,
                parent_id: student.parent_id,
                month: month,
                year: year,
                total_fees: shift.shift_fee,
                comment: comment,
                payment_type: payment_type
            })
        }

        // Month number to word mapping
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const monthWord = monthNames[month - 1] || month;

        const notiType = `payment`;
        const message = {
            title: `Fee Payment Confirmation`,
            body: `We have received the fee payment for ${student.full_name} for ${monthWord} ${year}. Thank you for completing the payment promptly.`
        };

        const Data = {
            notification_by: req.user.id,
            notification_to: student.parent_id,
            notification_type: notiType,
            body: message.body,
            title: message.title,
            school_id: school_id,
        };

        await send_notification(student.parent_id, message, notiType, Data);
        await db.Notification.create(Data);

        return res.status(200).json({
            status: 1,
            message: "Payment recorded successfully",
            data: invoice
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ status: 0, message: "Internal server error", error: error.message });
    }
};

const remainingFees = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { student_id, month, year, title, body } = req.body

        const now = new Date();
        if (!month) month = now.getMonth() + 1;
        if (!year) year = now.getFullYear();

        let school_id = req.user.id;

        if (req.user.role == "principal") {
            school_id = req.user.school_id;
        }
        const student = await db.Student.findOne({
            where: {
                id: student_id,
                school_id: school_id,
                request_status: { [Op.in]: ["accepted", "feesPending"] }
            }
        });
        if (!student) {
            return res.status(400).json({ status: 0, message: "Student not found" });
        }

        const notiType = `remainder_fees`;
        const message = {
            title: title,
            body: body
        };

        const Data = {
            notification_by: req.user.id,
            notification_to: student.parent_id,
            notification_type: notiType,
            body: message.body,
            title: message.title,
            school_id: school_id,
        };

        await send_notification(student.parent_id, message, notiType, Data);
        await db.Notification.create(Data);

        return res.status(200).json({
            status: 1,
            message: "Remaining fees sent successfully",
        });
    } catch (error) {
        console.error('Error:', error)
        return res.status(500).json({ status: 0, message: "Internal server error", error: error.message })
    }
}

const listStudentFees = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" })
    }
    try {
        let { month, year, page, search, type } = req.query
        if (!page) {
            return res.status(400).json({ status: 0, message: 'page is required' });
        }
        const limit = 10
        const offset = (page - 1) * limit
        let school_id = req.user.id;

        if (req.user.role == "principal") {
            school_id = req.user.school_id;
        }
        const now = new Date();
        if (!month) month = now.getMonth() + 1;
        if (!year) year = now.getFullYear();

        const whereCondition = {
            school_id: school_id,
            request_status: { [Op.in]: ["accepted", "feesPending"] }
        };

        if (search) {
            whereCondition.full_name = { [Op.like]: `%${search}%` };
        }
        if (type == 1) {
            whereCondition[Op.and] = db.sequelize.literal(`(
                SELECT COUNT(*) 
                FROM tbl_invoice t1 
                WHERE t1.student_id = Student.id 
                AND t1.month = ${month} 
                AND t1.year = ${year}
                 ORDER BY t1.id DESC
 LIMIT 1

            ) > 0`);
        } else if (type == 0) {
            whereCondition[Op.and] = db.sequelize.literal(`(
                SELECT COUNT(*) 
                FROM tbl_invoice t1 
                WHERE t1.student_id = Student.id 
                AND t1.month = ${month} 
                AND t1.year = ${year}
                 ORDER BY t1.id DESC
 LIMIT 1

            ) = 0`);
        }
        console.log("month==============", month);
        console.log("year==============", year);
        console.log("whereCondition==============", whereCondition);


        const student = await db.Student.findAndCountAll({
            where: whereCondition,
            attributes: {
                include: [
                    [
                        db.sequelize.literal(`(
                            SELECT t1.shift_fee 
                            FROM tbl_shift t1 
                            WHERE t1.id = Student.shift_id
                        )`),
                        'shift_fee'
                    ],
                    // [
                    //     db.sequelize.literal(`(
                    //         SELECT t1.penalty
                    //         FROM tbl_shift t1 
                    //         WHERE t1.id = Student.shift_id
                    //     )`),
                    //     'penalty'
                    // ],
                    [
                        db.sequelize.literal(`(
                            SELECT COUNT(*) 
                            FROM tbl_invoice t1 
                            WHERE t1.student_id = Student.id 
                            AND t1.month = ${month} 
                            AND t1.year = ${year}
                        )`),
                        'is_pay'
                    ],
                    [
                        db.sequelize.literal(`(
                            SELECT t1.id
                            FROM tbl_invoice t1 
                            WHERE t1.student_id = Student.id 
                            AND t1.month = ${month} 
                            AND t1.year = ${year}
                             ORDER BY t1.id DESC
                             LIMIT 1
                        )`),
                        'invoice_id'
                    ],
                    [
                        db.sequelize.literal(`(
                            SELECT t1.payment_type
                            FROM tbl_invoice t1 
                            WHERE t1.student_id = Student.id 
                            AND t1.month = ${month} 
                            AND t1.year = ${year}
                             ORDER BY t1.id DESC
                            LIMIT 1
                        )`),
                        'payment_type'
                    ],
                    [
                        db.sequelize.literal(`(
                            SELECT t1.comment
                            FROM tbl_invoice t1 
                            WHERE t1.student_id = Student.id 
                            AND t1.month = ${month} 
                            AND t1.year = ${year}
                             ORDER BY t1.id DESC
                            LIMIT 1
                        )`),
                        'comment'
                    ],
                ]
            },
            limit,
            offset,
            order: [['id', 'DESC']],
        });
        
        return res.status(200).json({
            status: 1,
            message: "student list get successfully",
            data: student.rows,
            total_student: student.count,
            page: page,
            total_page: Math.ceil(student.count / limit)
        })

    } catch (error) {
        console.error('Error:', error)
        return res.status(500).json({ status: 0, message: "Internal server error", error: error.message })
    }
}

const getInvoice = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { invoice_id } = req.query
        if (!invoice_id) {
            return res.status(400).json({ status: 0, message: "invoice_id is required" });
        }

        let school_id = req.user.id;

        if (req.user.role == "principal") {
            school_id = req.user.school_id;
        }

        const invoice = await db.Invoice.findOne({
            where: {
                id: invoice_id,
                school_id: school_id
            },
            attributes: {
                include: [
                    [
                        db.sequelize.literal(`(
                            SELECT t1.full_name 
                            FROM tbl_student t1 
                            WHERE t1.id = Invoice.student_id
                        )`),
                        'student_name'
                    ]
                ]
            }
        });
        if (!invoice) {
            return res.status(400).json({ status: 0, message: "Invoice not found" });
        }
        return res.status(200).json({
            status: 1,
            message: "Invoice get successfully",
            data: invoice
        })
    } catch (error) {
        console.error('Error:', error)
        return res.status(500).json({ status: 0, message: "Internal server error", error: error.message })
    }
}

const listStudentFeesHistory = async (req, res) => {
    if (req.user.role != "school" && req.user.role != "principal") {
        return res.status(403).json({ status: 0, message: "You are not authorized to perform this action" })
    }
    try {
        let { month, year, type } = req.query
      
        let school_id = req.user.id;

        if (req.user.role == "principal") {
            school_id = req.user.school_id;
        }
        const now = new Date();
        if (!month) month = now.getMonth() + 1;
        if (!year) year = now.getFullYear();

        const whereCondition = {
            school_id: school_id,
            request_status: { [Op.in]: ["accepted", "feesPending"] }
        };

        if (type == 1) {
            whereCondition[Op.and] = db.sequelize.literal(`(
                SELECT COUNT(*) 
                FROM tbl_invoice t1 
                WHERE t1.student_id = Student.id 
                AND t1.month = ${month} 
                AND t1.year = ${year}
                 ORDER BY t1.id DESC
 LIMIT 1

            ) > 0`);
        } else if (type == 0) {
            whereCondition[Op.and] = db.sequelize.literal(`(
                SELECT COUNT(*) 
                FROM tbl_invoice t1 
                WHERE t1.student_id = Student.id 
                AND t1.month = ${month} 
                AND t1.year = ${year}
                 ORDER BY t1.id DESC
 LIMIT 1

            ) = 0`);
        }

        const student = await db.Student.findAndCountAll({
            where: whereCondition,
            attributes: {
                include: [
                    [
                        db.sequelize.literal(`(
                            SELECT t1.shift_fee 
                            FROM tbl_shift t1 
                            WHERE t1.id = Student.shift_id
                        )`),
                        'shift_fee'
                    ],
                    [
                        db.sequelize.literal(`(
                            SELECT COUNT(*) 
                            FROM tbl_invoice t1 
                            WHERE t1.student_id = Student.id 
                            AND t1.month = ${month} 
                            AND t1.year = ${year}
                        )`),
                        'is_pay'
                    ],
                    [
                        db.sequelize.literal(`(
                            SELECT t1.id
                            FROM tbl_invoice t1 
                            WHERE t1.student_id = Student.id 
                            AND t1.month = ${month} 
                            AND t1.year = ${year}
                             ORDER BY t1.id DESC
                             LIMIT 1
                        )`),
                        'invoice_id'
                    ],
                    [
                        db.sequelize.literal(`(
                            SELECT t1.payment_type
                            FROM tbl_invoice t1 
                            WHERE t1.student_id = Student.id 
                            AND t1.month = ${month} 
                            AND t1.year = ${year}
                             ORDER BY t1.id DESC
                            LIMIT 1
                        )`),
                        'payment_type'
                    ],
                    [
                        db.sequelize.literal(`(
                            SELECT t1.comment
                            FROM tbl_invoice t1 
                            WHERE t1.student_id = Student.id 
                            AND t1.month = ${month} 
                            AND t1.year = ${year}
                             ORDER BY t1.id DESC
                            LIMIT 1
                        )`),
                        'comment'
                    ],
                ]
            },
            order: [['id', 'DESC']],
        });
        
        return res.status(200).json({
            status: 1,
            message: "student list get successfully",
            data: student.rows,
        })

    } catch (error) {
        console.error('Error:', error)
        return res.status(500).json({ status: 0, message: "Internal server error", error: error.message })
    }
}


module.exports = {
    blockStudent,
    makePayment,
    remainingFees,
    listStudentFees,
    getInvoice,

    listStudentFeesHistory
}