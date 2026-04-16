require("dotenv").config();
const { BrevoClient } = require("@getbrevo/brevo");
const {
  sendOTPToEmail,
  addSchoolEmail,
  updateSchoolEmail,
  addroleEmail,
  updateRoleEmail,
  studentRequistAccessept,
  studentRequistRejected,
  studentRequistPending,
  blockroleEmail,
  deleteroleEmail,
  deleteSchoolEmail,
  unblockroleEmail
} = require("./templetes");

// Initialize Brevo Client
const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
  timeoutInSeconds: 30,
  maxRetries: 3
});

const sendOTPVerificationEmail = async ({ email, otp }) => {
  console.log(email, otp);

  let htmlContent = sendOTPToEmail(otp);

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: "Verification Code: Complete Your Email Verification",
      htmlContent: htmlContent,
      sender: { name: "Radiant Hyve", email: "juniord.dj88@gmail.com" },
      to: [{ email: email }]
    });
    console.log("OTP Verification Email sent. Message ID:", result.messageId);
    return result;
  } catch (error) {
    console.log("Error in send OTP Verification Email ", error);
    throw error;
  }
};

const addNewSchoolEmail = async (school_name, email, password) => {
  let htmlContent = addSchoolEmail(school_name, email, password);

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: "Your School Account Create Successfully.",
      htmlContent: htmlContent,
      sender: { name: "Radiant Hyve", email: "juniord.dj88@gmail.com" },
      to: [{ email: email }]
    });
    console.log("addNewSchoolEmail Email sent. Message ID:", result.messageId);
    return result;
  } catch (error) {
    console.log("Error in send addNewSchoolEmail Email ", error);
    throw error;
  }
};

const updateSchoolPasswordEmail = async (school_name, email, password) => {
  let htmlContent = updateSchoolEmail(school_name, email, password);

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: "Your School Account Password Change By Admin.",
      htmlContent: htmlContent,
      sender: { name: "Radiant Hyve", email: "juniord.dj88@gmail.com" },
      to: [{ email: email }]
    });
    console.log(
      "updateSchoolPasswordEmail Email sent. Message ID:",
      result.messageId
    );
    return result;
  } catch (error) {
    console.log("Error in send updateSchoolPasswordEmail Email ", error);
    throw error;
  }
};

const AddRoleEmail = async (school_name, email, password, role) => {
  let htmlContent = addroleEmail(school_name, email, password, role);

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: `Your ${role} Account Create Successfully.`,
      htmlContent: htmlContent,
      sender: { name: "Radiant Hyve", email: "juniord.dj88@gmail.com" },
      to: [{ email: email }]
    });
    console.log("AddRoleEmail Email sent. Message ID:", result.messageId);
    return result;
  } catch (error) {
    console.log("Error in send AddRoleEmail Email ", error);
    throw error;
  }
};

const updateRolePasswordEmail = async (school_name, email, password, role) => {
  let htmlContent = updateRoleEmail(school_name, email, password, role);

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: `Your School Account Password Change By Admin.`,
      htmlContent: htmlContent,
      sender: { name: "Radiant Hyve", email: "juniord.dj88@gmail.com" },
      to: [{ email: email }]
    });
    console.log(
      "updateRolePasswordEmail Email sent. Message ID:",
      result.messageId
    );
    return result;
  } catch (error) {
    console.log("Error in send updateRolePasswordEmail Email ", error);
    throw error;
  }
};

const studentRequestAccesseptEmail = async (
  full_name,
  email,
  school_name,
  parent_name
) => {
  let htmlContent = studentRequistAccessept(
    full_name,
    school_name,
    parent_name
  );

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: `Your Child ${full_name} Admission Request Accepted .`,
      htmlContent: htmlContent,
      sender: { name: "Radiant Hyve", email: "juniord.dj88@gmail.com" },
      to: [{ email: email }]
    });
    console.log(
      "studentRequestAccesseptEmail Email sent. Message ID:",
      result.messageId
    );
    return result;
  } catch (error) {
    console.log("Error in send studentRequestAccesseptEmail Email ", error);
    throw error;
  }
};

const studentRequestRejectEmail = async (
  full_name,
  email,
  school_name,
  parent_name
) => {
  let htmlContent = studentRequistRejected(full_name, school_name, parent_name);

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: `Your Child ${full_name} Admission Request Rejected .`,
      htmlContent: htmlContent,
      sender: { name: "Radiant Hyve", email: "juniord.dj88@gmail.com" },
      to: [{ email: email }]
    });
    console.log(
      "studentRequestRejectEmail Email sent. Message ID:",
      result.messageId
    );
    return result;
  } catch (error) {
    console.log("Error in send studentRequestRejectEmail Email ", error);
    throw error;
  }
};

const studentRequestEmail = async (
  full_name,
  email,
  school_name,
  parent_name
) => {
  let htmlContent = studentRequistPending(full_name, school_name, parent_name);

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: `Your Child ${full_name} Admission Request Pending .`,
      htmlContent: htmlContent,
      sender: { name: "Radiant Hyve", email: "juniord.dj88@gmail.com" },
      to: [{ email: email }]
    });
    console.log(
      "studentRequestEmail Email sent. Message ID:",
      result.messageId
    );
    return result;
  } catch (error) {
    console.log("Error in send studentRequestEmail Email ", error);
    throw error;
  }
};

const deleteEmail = async (
  school_name,
  email,
  delete_reason,
  role,
  full_name
) => {
  let htmlContent = deleteroleEmail(
    school_name,
    email,
    delete_reason,
    role,
    full_name
  );

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: `Delete Your Account.`,
      htmlContent: htmlContent,
      sender: { name: "Radiant Hyve", email: "juniord.dj88@gmail.com" },
      to: [{ email: email }]
    });
    console.log("deleteEmail Email sent. Message ID:", result.messageId);
    return result;
  } catch (error) {
    console.log("Error in send deleteEmail Email ", error);
    throw error;
  }
};

const delteSchoolEmails = async (school_name, email, delete_reason) => {
  let htmlContent = deleteSchoolEmail(school_name, email, delete_reason);

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: `Delete Your Account.`,
      htmlContent: htmlContent,
      sender: { name: "Radiant Hyve", email: "juniord.dj88@gmail.com" },
      to: [{ email: email }]
    });
    console.log("delteSchoolEmails Email sent. Message ID:", result.messageId);
    return result;
  } catch (error) {
    console.log("Error in send delteSchoolEmails Email ", error);
    throw error;
  }
};

const blockEmail = async (
  full_name,
  school_name,
  email,
  role,
  block_reason
) => {
  let htmlContent = blockroleEmail(
    full_name,
    school_name,
    email,
    role,
    block_reason
  );

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: `Block Your Account.`,
      htmlContent: htmlContent,
      sender: { name: "Radiant Hyve", email: "juniord.dj88@gmail.com" },
      to: [{ email: email }]
    });
    console.log("blockEmail Email sent. Message ID:", result.messageId);
    return result;
  } catch (error) {
    console.log("Error in send blockEmail Email ", error);
    throw error;
  }
};

const unblockEmail = async (full_name, school_name, email, role) => {
  let htmlContent = unblockroleEmail(full_name, school_name, email, role);

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: `Unblock Your Account.`,
      htmlContent: htmlContent,
      sender: { name: "Radiant Hyve", email: "juniord.dj88@gmail.com" },
      to: [{ email: email }]
    });
    console.log("unblockEmail Email sent. Message ID:", result.messageId);
    return result;
  } catch (error) {
    console.log("Error in send unblockEmail Email ", error);
    throw error;
  }
};

module.exports = {
  sendOTPVerificationEmail,
  addNewSchoolEmail,
  updateSchoolPasswordEmail,
  AddRoleEmail,
  updateRolePasswordEmail,
  studentRequestAccesseptEmail,
  studentRequestRejectEmail,
  studentRequestEmail,
  deleteEmail,
  delteSchoolEmails,
  blockEmail,
  unblockEmail
};
