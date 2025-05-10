require('dotenv').config()
const nodemailer = require("nodemailer");
const { sendOTPToEmail, profileVerificationRejectedHtml, profileVerificationAcceptedHtml } = require('./templetes')
let smtpUser = process.env.SMTPUSER
let smtpPass = process.env.SMTPPASS
let projectName = process.env.PROJECT_NAME

//Nodemailer stuff
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});
//send otp to email address
const sendOTPVerificationEmail = async ({ email_id, otp }) => {

  let htmlContent = sendOTPToEmail(otp);

  let mail_option = {
    from: `${projectName} <${smtpUser}>`,
    to: email_id,
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
// sendOTPVerificationEmail({ email_id: "smith21.cubes@gmail.com", otp: "8765" })

const sendProfileVerificationAcceptedEmail = async (data) => {
  let htmlContent = profileVerificationAcceptedHtml(data);

  let mail_option = {
    from: `${projectName} <${smtpUser}>`,
    to: data.email_id,
    subject: "Complete Your Training to Start Providing Services",
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

const sendProfileVerificationRejectedEmail = async (data) => {
  let htmlContent = profileVerificationRejectedHtml(data);

  let mail_option = {
    from: `${projectName} <${smtpUser}>`,
    to: data.email_id,
    subject: "Profile Verification Rejected",
    html: htmlContent,
  };

  return transporter.sendMail(mail_option, function (error, info) {
    if (error) {
      console.log("Error in send Profile Verification Rejected Email ", error);
    } else {
      console.log('Profile Verification Rejected Email sent: ' + info.response);
    }
  });
};

module.exports = { sendOTPVerificationEmail, sendProfileVerificationAcceptedEmail, sendProfileVerificationRejectedEmail }