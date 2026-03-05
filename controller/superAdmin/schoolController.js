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

    let emailSent = false;
    try {
      await addNewSchoolEmail(name, email, password);
      emailSent = true;
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      emailSent = false;
    }

    await db.Chat.create({
      chat_by: user.id,
      chat_to: user.id,
      school_id: user.id
    });

    return res.status(201).json({
      status: 1,
      message: "School added successfully",
      data: user,
      password: password,
      email_sent: emailSent
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

const createSubscription = async (req, res) => {
  if (req.user.role != "super_admin") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { packageName, serviceType, serviceFee, description, features } =
    req.body;

  // Validate required fields
  if (!packageName || !serviceType || !serviceFee) {
    return res.status(400).json({
      status: 0,
      message: "packageName, serviceType, and serviceFee are required"
    });
  }

  try {
    // Check for duplicate plan
    const existingPlan = await db.SubscriptionPlan.findOne({
      where: {
        package_name: packageName,
        service_type: serviceType,
        service_fee: serviceFee
      }
    });

    if (existingPlan) {
      return res.status(400).json({
        status: 0,
        message: `A subscription plan with package name ${packageName}, ${serviceType} service type and fee ${serviceFee} already exists`
      });
    }

    // Create the subscription plan
    const subscriptionPlan = await db.SubscriptionPlan.create({
      package_name: packageName,
      service_type: serviceType,
      service_fee: serviceFee,
      description: description || null,
      is_active: true
    });

    // Create features if provided
    if (features && Array.isArray(features) && features.length > 0) {
      const featureRecords = features.map((featureName) => ({
        plan_id: subscriptionPlan.id,
        feature_name: featureName
      }));

      await db.Feature.bulkCreate(featureRecords);
    }

    // Fetch the created plan with its features
    const planWithFeatures = await db.SubscriptionPlan.findOne({
      where: { id: subscriptionPlan.id },
      include: [
        {
          model: db.Feature,
          attributes: ["id", "feature_name"],
          as: "Features" // Make sure this alias matches your association
        }
      ]
    });

    return res.status(201).json({
      status: 1,
      message: "Subscription plan created successfully",
      data: planWithFeatures
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

const listSubscriptionPlans = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    const plans = await db.SubscriptionPlan.findAndCountAll({
      where: { is_active: true },
      include: [
        {
          model: db.Feature,
          attributes: ["id", "feature_name"],
          as: "Features"
        }
      ],
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]]
    });

    return res.status(200).json({
      status: 1,
      message: "Subscription plans retrieved successfully",
      total_plans: plans.count,
      current_page: parseInt(page),
      total_pages: Math.ceil(plans.count / limit),
      data: plans.rows
    });
  } catch (error) {
    console.error("Error retrieving subscription plans:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

const updateSubscriptionPlan = async (req, res) => {
  if (req.user.role != "super_admin") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const {
    plan_id,
    description,
    addFeatures,
    modifyFeatures,
    removeFeatureIds,
    package_name,
    service_type,
    service_fee
  } = req.body;

  // Validate required fields
  if (!plan_id) {
    return res.status(400).json({
      status: 0,
      message: "plan_id is required"
    });
  }

  try {
    // Check if plan exists
    const plan = await db.SubscriptionPlan.findOne({
      where: { id: plan_id },
      include: [
        {
          model: db.Feature,
          attributes: ["id", "feature_name"],
          as: "Features"
        }
      ]
    });

    if (!plan) {
      return res.status(404).json({
        status: 0,
        message: "Subscription plan not found"
      });
    }

    // Update description if provided
    if (description) {
      await plan.update({ description });
    }

    if (package_name || service_type || service_fee) {
      // Check for duplicate plan with new details
      const existingPlan = await db.SubscriptionPlan.findOne({
        where: {
          id: { [Op.ne]: plan_id },
          package_name: package_name || plan.package_name,
          service_type: service_type || plan.service_type,
          service_fee: service_fee || plan.service_fee
        }
      });

      if (existingPlan) {
        return res.status(400).json({
          status: 0,
          message: `A subscription plan with package name ${package_name || plan.package_name}, ${service_type || plan.service_type} service type and fee ${service_fee || plan.service_fee} already exists`
        });
      }

      // Update the subscription plan details
      await plan.update({
        package_name: package_name || plan.package_name,
        service_type: service_type || plan.service_type,
        service_fee: service_fee || plan.service_fee
      });
    }

    // Remove features if provided
    if (
      removeFeatureIds &&
      Array.isArray(removeFeatureIds) &&
      removeFeatureIds.length > 0
    ) {
      await db.Feature.destroy({
        where: {
          id: removeFeatureIds,
          plan_id: plan_id
        }
      });
    }

    // Modify existing features if provided
    if (
      modifyFeatures &&
      Array.isArray(modifyFeatures) &&
      modifyFeatures.length > 0
    ) {
      for (const feature of modifyFeatures) {
        if (feature.id && feature.feature_name) {
          await db.Feature.update(
            { feature_name: feature.feature_name },
            { where: { id: feature.id, plan_id: plan_id } }
          );
        }
      }
    }

    // Add new features if provided
    if (addFeatures && Array.isArray(addFeatures) && addFeatures.length > 0) {
      const featureRecords = addFeatures.map((featureName) => ({
        plan_id: plan_id,
        feature_name: featureName
      }));

      await db.Feature.bulkCreate(featureRecords);
    }

    // Fetch updated plan with features
    const updatedPlan = await db.SubscriptionPlan.findOne({
      where: { id: plan_id },
      include: [
        {
          model: db.Feature,
          attributes: ["id", "feature_name"],
          as: "Features"
        }
      ]
    });

    return res.status(200).json({
      status: 1,
      message: "Subscription plan updated successfully",
      data: updatedPlan
    });
  } catch (error) {
    console.error("Error updating subscription plan:", error);
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
  createSubscription,
  listSubscriptionPlans,
  updateSubscriptionPlan,
  changeSchoolPassword,
  deleteSchool,
  getSchoolById
};
