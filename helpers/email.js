require('dotenv').config()
const nodemailer = require("nodemailer");
const { sendOTPToEmail, addSchoolEmail, updateSchoolEmail, addroleEmail, updateRoleEmail, studentRequistAccessept, studentRequistRejected, studentRequistPending, blockroleEmail, deleteroleEmail, deleteSchoolEmail, unblockroleEmail } = require('./templetes')
let sendGridApiKey = process.env.SENDGRID_API_KEY
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(sendGridApiKey);

// var transporter = nodemailer.createTransport({
//   host: mailTrapHost,
//   port: 2525,
//   auth: {
//     user: "api",
//     pass: mailTrapPass
//   }
// });

const sendOTPVerificationEmail = async ({ email, otp }) => {
  console.log(email, otp);


  let htmlContent = sendOTPToEmail(otp);

  let mail_option = {
    from: `Radiant Hyve <info@cubesinfotech.in>`,
    to: email,
    subject: "Verification Code: Complete Your Email Verification",
    html: htmlContent,
  };

  return sgMail.setApiKey(mail_option, function (error, info) {
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
    from: `Radiant Hyve <info@cubesinfotech.in>`,
    to: email,
    subject: "Your School Account Create Successfully.",
    html: htmlContent,
  };

  return sgMail.setApiKey(mail_option, function (error, info) {
    if (error) {
      console.log("Error in send addNewSchoolEmail Email ", error);
    } else {
      console.log('addNewSchoolEmail Email sent: ' + info.response);
    }
  });
};

const updateSchoolPasswordEmail = async (school_name, email, password) => {
  let htmlContent = updateSchoolEmail(school_name, email, password);

  let mail_option = {
    from: `Radiant Hyve <info@cubesinfotech.in>`,
    to: email,
    subject: "Your School Account Password Change By Admin.",
    html: htmlContent,
  };

  return sgMail.setApiKey(mail_option, function (error, info) {
    if (error) {
      console.log("Error in send updateSchoolPasswordEmail Email ", error);
    } else {
      console.log('updateSchoolPasswordEmail Email sent: ' + info.response);
    }
  });
};

const AddRoleEmail = async (school_name, email, password, role) => {
  let htmlContent = addroleEmail(school_name, email, password, role);

  let mail_option = {
    from: `Radiant Hyve <info@cubesinfotech.in>`,
    to: email,
    subject: `Your ${role} Account Create Successfully.`,
    html: htmlContent,
  };

  return sgMail.setApiKey(mail_option, function (error, info) {
    if (error) {
      console.log("Error in send AddRoleEmail Email ", error);
    } else {
      console.log('AddRoleEmail Email sent: ' + info.response);
    }
  });
};

const updateRolePasswordEmail = async (school_name, email, password, role) => {
  let htmlContent = updateRoleEmail(school_name, email, password, role);

  let mail_option = {
    from: `Radiant Hyve <info@cubesinfotech.in>`,
    to: email,
    subject: `Your School Account Password Change By Admin.`,
    html: htmlContent,
  };

  return sgMail.setApiKey(mail_option, function (error, info) {
    if (error) {
      console.log("Error in send updateRolePasswordEmail Email ", error);
    } else {
      console.log('updateRolePasswordEmail Email sent: ' + info.response);
    }
  });
};

const studentRequestAccesseptEmail = async (full_name, email, school_name, parent_name) => {
  let htmlContent = studentRequistAccessept(full_name, school_name, parent_name);

  let mail_option = {
    from: `Radiant Hyve <info@cubesinfotech.in>`,
    to: email,
    subject: `Your Child ${full_name} Admission Request Accepted .`,
    html: htmlContent,
  };

  return sgMail.setApiKey(mail_option, function (error, info) {
    if (error) {
      console.log("Error in send studentRequestAccesseptEmail Email ", error);
    } else {
      console.log('studentRequestAccesseptEmail Email sent: ' + info.response);
    }
  });

}

const studentRequestRejectEmail = async (full_name, email, school_name, parent_name) => {
  let htmlContent = studentRequistRejected(full_name, school_name, parent_name);

  let mail_option = {
    from: `Radiant Hyve <info@cubesinfotech.in>`,
    to: email,
    subject: `Your Child ${full_name} Admission Request Rejected .`,
    html: htmlContent,
  };

  return sgMail.setApiKey(mail_option, function (error, info) {
    if (error) {
      console.log("Error in send studentRequestRejectEmail Email ", error);
    } else {
      console.log('studentRequestRejectEmail Email sent: ' + info.response);
    }
  });
}


const studentRequestEmail = async (full_name, email, school_name, parent_name) => {
  let htmlContent = studentRequistPending(full_name, school_name, parent_name);

  let mail_option = {
    from: `Radiant Hyve <info@cubesinfotech.in>`,
    to: email,
    subject: `Your Child ${full_name} Admission Request Pending .`,
    html: htmlContent,
  };

  return sgMail.setApiKey(mail_option, function (error, info) {
    if (error) {
      console.log("Error in send studentRequestEmail Email ", error);
    } else {
      console.log('studentRequestEmail Email sent: ' + info.response);
    }
  });
}


const deleteEmail = async (school_name, email, delete_reason, role, full_name) => {
  let htmlContent = deleteroleEmail (school_name, email, delete_reason, role, full_name);

  let mail_option = {
    from: `Radiant Hyve <info@cubesinfotech.in>`,
    to: email,
    subject: `Delete Your Account.`,
    html: htmlContent,
  };

  return sgMail.setApiKey(mail_option, function (error, info) {
    if (error) {
      console.log("Error in send delteEmail Email ", error);
    } else {
      console.log('delteEmail Email sent: ' + info.response);
    }
  });
}

const delteSchoolEmails = async (school_name, email, delete_reason) => {
  let htmlContent = deleteSchoolEmail (school_name, email, delete_reason);

  let mail_option = {
    from: `Radiant Hyve <info@cubesinfotech.in>`,
    to: email,
    subject: `Delete Your Account.`,
    html: htmlContent,
  };

  return sgMail.setApiKey(mail_option, function (error, info) {
    if (error) {
      console.log("Error in send delteEmail Email ", error);
    } else {
      console.log('delteEmail Email sent: ' + info.response);
    }
  });
}

const blockEmail = async (full_name, school_name, email, role,  block_reason) => {
  let htmlContent = blockroleEmail (full_name, school_name, email, role,  block_reason);

  let mail_option = {
    from: `Radiant Hyve <info@cubesinfotech.in>`,
    to: email,
    subject: `Block Your Account.`,
    html: htmlContent,
  };

  return sgMail.setApiKey(mail_option, function (error, info) {
    if (error) {
      console.log("Error in send delteEmail Email ", error);
    } else {
      console.log('delteEmail Email sent: ' + info.response);
    }
  });
}

const unblockEmail = async (full_name, school_name, email, role) => {
  let htmlContent = unblockroleEmail(full_name, school_name, email, role);

  let mail_option = {
    from: `Radiant Hyve <info@cubesinfotech.in>`,
    to: email,
    subject: `Unblock Your Account.`,
    html: htmlContent,
  };

  return sgMail.setApiKey(mail_option, function (error, info) {
    if (error) {
      console.log("Error in send unblockEmail Email ", error);
    } else {
      console.log('unblockEmail Email sent: ' + info.response);
    }
  });
}

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
}