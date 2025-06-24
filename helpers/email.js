require('dotenv').config()
const nodemailer = require("nodemailer");
const { sendOTPToEmail, addSchoolEmail, updateSchoolEmail, addroleEmail, updateRoleEmail } = require('./templetes')
let mailTrapHost = process.env.MAILTRAPHOST
let mailTrapPass = process.env.MAILTRAPPASS
let projectName = process.env.PROJECT_NAME

var transporter = nodemailer.createTransport({
  host: mailTrapHost,
  port: 2525,
  auth: {
    user: "api",
    pass: mailTrapPass
  }
});

const sendOTPVerificationEmail = async ({ email, otp }) => {
  console.log( email, otp);
  

let htmlContent = sendOTPToEmail(otp);

  let mail_option = {
  from: `"Radiant Hyve" <info@cubesinfotech.in>`,
    to: email,
    subject: "Verification Code: Complete Your Email Verification",
    html: htmlContent,
  };

  return transporter.sendMail(mail_option, function (error, info) {
    if (error) {
      console.log("Error in send OTP Verification Email ", error);
    } else {
      console.log('OTP Verification Email sent: ' + info.response);
    }
  });
};

const addNewSchoolEmail = async (school_name, email, password) => {
  let htmlContent = addSchoolEmail(school_name, email, password);

  let mail_option = {
      from: `"Radiant Hyve" <info@cubesinfotech.in>`,
    to: email,
    subject: "Your School Account Crete Successfully.",
    html: htmlContent,
  };

  return transporter.sendMail(mail_option, function (error, info) {
    if (error) {
      console.log("Error in send Profile Verification Accepted Email ", error);
    } else {
      console.log('Profile Verification Accepted Email sent: ' + info.response);
    }
  });
};

const updateSchoolPasswordEmail = async (school_name, email, password) => {
  let htmlContent = updateSchoolEmail(school_name, email, password);

  let mail_option = {
      from: `"Radiant Hyve" <info@cubesinfotech.in>`,
    to: email,
    subject: "Your School Account Password Change By Admin.",
    html: htmlContent,
  };

  return transporter.sendMail(mail_option, function (error, info) {
    if (error) {
      console.log("Error in send updateSchoolPasswordEmail Email ", error);
    } else {
      console.log('updateSchoolPasswordEmail Email sent: ' + info.response);
    }
  });
};

const AddRoleEmail = async (school_name, email, password) => {
  let htmlContent = addroleEmail(school_name, email, password, role);

  let mail_option = {
      from: `"Radiant Hyve" <info@cubesinfotech.in>`,
    to: email,
    subject: `Your ${role} Account Crete Successfully.`,
    html: htmlContent,
  };

  return transporter.sendMail(mail_option, function (error, info) {
    if (error) {
      console.log("Error in send updateSchoolPasswordEmail Email ", error);
    } else {
      console.log('updateSchoolPasswordEmail Email sent: ' + info.response);
    }
  });
};

const updateRolePasswordEmail = async (school_name, email, password) => {
  let htmlContent = updateRoleEmail(school_name, email, password, role);

  let mail_option = {
      from: `"Radiant Hyve" <info@cubesinfotech.in>`,
    to: email,
    subject: `Your School Account Password Change By Admin.`,
    html: htmlContent,
  };

  return transporter.sendMail(mail_option, function (error, info) {
    if (error) {
      console.log("Error in send updateSchoolPasswordEmail Email ", error);
    } else {
      console.log('updateSchoolPasswordEmail Email sent: ' + info.response);
    }
  });
};

module.exports = { sendOTPVerificationEmail, addNewSchoolEmail, updateSchoolPasswordEmail, AddRoleEmail }