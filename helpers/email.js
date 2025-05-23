require('dotenv').config()
const nodemailer = require("nodemailer");
const { sendOTPToEmail, profileVerificationRejectedHtml, profileVerificationAcceptedHtml } = require('./templetes')
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
  from: `"Radiant Hyve" <hello@cubesinfotech.in>`,
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