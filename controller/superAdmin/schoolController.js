require("dotenv").config();
const db = require("../../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Op, Sequelize, where } = require("sequelize");
const fs = require("fs").promises;
const path = require("path");
const { PhoneNumberUtil, PhoneNumberFormat } = require("google-libphonenumber");
const phoneUtil = PhoneNumberUtil.getInstance();
const { v4: uuidv4 } = require("uuid");
const {
  upload_file,
  deleteFromS3,
  uploadVideo
} = require("../../helpers/s3_upload");
const {
  addNewSchoolEmail,
  updateSchoolPasswordEmail,
  delteSchoolEmails
} = require("../../helpers/email");

function generateCode(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstvwxyz0123456789@#$%&*!";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const addSchool = async (req, res) => {
  if (req.user.role != "super_admin") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { name, email, address, latitude, longitude } = req.body;

  try {
    const existingUser = await db.User.findOne({
      where: { email, is_deleted: false }
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const password = generateCode(8);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.User.create({
      school_name: name,
      email,
      password: hashedPassword,
      address,
      role: "school",
      latitude,
      longitude
    });

    await user.update({
      school_id: user.id
    });

    await addNewSchoolEmail(name, email, password);
    await db.Chat.create({
      chat_by: user.id,
      chat_to: user.id,
      school_id: user.id
    });

    return res.status(201).json({
      status: 1,
      message: "School added successfully",
      data: user,
      password: password
    });
  } catch (error) {
    console.error("Error adding school:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

const listSchool = async (req, res) => {
  if (req.user.role != "super_admin") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const { page } = req.query;

    if (!page) {
      return res.status(400).json({ status: 0, message: "page is required" });
    }
    const limit = 10;
    const offset = (page - 1) * limit;

    const schools = await db.User.findAndCountAll({
      where: {
        role: "school",
        is_deleted: false
      },
      attributes: [
        "id",
        "school_name",
        "email",
        "address",
        "subscription_plan",
        "is_blocked"
      ],
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]]
    });
    return res.status(200).json({
      status: 1,
      message: "Schools retrieved successfully",
      total_school: schools.count,
      current_page: parseInt(page),
      totalPage: Math.ceil(schools.count / limit),
      data: schools.rows
    });
  } catch (error) {
    console.error("Error retrieving schools:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

const editSchool = async (req, res) => {
  if (req.user.role != "super_admin") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { name, address, latitude, longitude, id } = req.body;

  try {
    const school = await db.User.findOne({
      where: {
        id: id,
        role: "school",
        is_deleted: false
      }
    });

    if (!school) {
      return res.status(404).json({ status: 0, message: "School not found" });
    }

    school.school_name = name || school.school_name;
    school.address = address || school.address;
    school.latitude = latitude || school.latitude;
    school.longitude = longitude || school.longitude;

    await school.save();

    return res.status(200).json({
      status: 1,
      message: "School updated successfully",
      data: school
    });
  } catch (error) {
    console.error("Error updating school:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

const changeSchoolPassword = async (req, res) => {
  if (req.user.role != "super_admin") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { password, id } = req.body;
  try {
    const school = await db.User.findOne({
      where: {
        id: id,
        role: "school",
        is_deleted: false
      }
    });
    if (!school) {
      return res.status(404).json({ status: 0, message: "School not found" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    school.password = hashedPassword;
    await school.save();
    await updateSchoolPasswordEmail(school.school_name, school.email, password);

    await db.Token.destroy({
      where: {
        user_id: id
      }
    });

    return res
      .status(200)
      .json({ status: 1, message: "School password updated successfully" });
  } catch (error) {
    console.error("Error updating school password:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

const deleteSchool = async (req, res) => {
  if (req.user.role != "super_admin") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { id, delete_reason } = req.query;

  if (!id) {
    return res.status(400).json({ status: 0, message: "id is required" });
  }

  try {
    const school = await db.User.findOne({
      where: {
        id: id,
        role: "school",
        is_deleted: false
      }
    });
    if (!school) {
      return res.status(404).json({ status: 0, message: "School not found" });
    }
    await db.Token.destroy({
      where: {
        user_id: id
      }
    });
    await school.update({
      is_deleted: true
    });

    const user = await db.User.findAll({
      where: { school_id: id, is_deleted: false }
    });
    for (const u of user) {
      await db.Token.destroy({
        where: {
          user_id: u.id
        }
      });
      await u.update({
        is_deleted: true
      });
    }

    const reason = delete_reason || "No reason admin";
    await delteSchoolEmails(school.school_name, school.email, reason);

    return res
      .status(200)
      .json({ status: 1, message: "School deleted successfully" });
  } catch (error) {
    console.error("Error deleting school:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

const getSchoolById = async (req, res) => {
  if (req.user.role != "super_admin") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ status: 0, message: "id is required" });
  }

  try {
    const school = await db.User.findOne({
      where: {
        id: id,
        role: "school",
        is_deleted: false
      }
    });
    if (!school) {
      return res.status(404).json({ status: 2, message: "School not found" });
    }

    const data = {
      id: school.id,
      school_name: school.school_name,
      email: school.email,
      address: school.address,
      subscription_plan: school.subscription_plan,
      is_blocked: school.is_blocked
    };

    const teacherCount = await db.User.count({
      where: {
        school_id: id,
        role: "teacher",
        is_deleted: false
      }
    });
    const principalCount = await db.User.count({
      where: {
        school_id: id,
        role: "principal",
        is_deleted: false
      }
    });
    const parentCount = await db.User.count({
      where: {
        school_id: id,
        role: "parent",
        is_deleted: false
      }
    });
    const studentCount = await db.Student.count({
      where: {
        school_id: id,
        request_status: "accepted"
      }
    });

    return res.status(200).json({
      status: 1,
      message: "School retrieved successfully",
      data: data,
      teacher_count: teacherCount || 0,
      principal_count: principalCount || 0,
      parent_count: parentCount || 0,
      student_count: studentCount || 0
    });
  } catch (error) {
    console.error("Error retrieving school:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  addSchool,
  listSchool,
  editSchool,
  changeSchoolPassword,
  deleteSchool,
  getSchoolById
};
