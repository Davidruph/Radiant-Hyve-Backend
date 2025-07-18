const moment = require('moment');

const currentYear = moment().year();

const sendOTPToEmail = (otp) =>
  `<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome Email</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #FFFFFF;
      margin: 0;
      padding: 0;
      color: #000000; /* Changed text color to black */
    }
    .container {
      max-width: 400px;
      margin: 20px auto;
      background: #f0f0f075;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      border-top: 5px solid #000000; /* Changed border color to black */
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #000000; /* Changed border color to black */
    }
    .header img {
      max-width: 150px;
    }
    .content {
      padding: 20px;
      text-align: center;
      color: #000000; /* Changed text color to black */
    }
    .content h1 {
      color: #000000; /* Changed header text color to black */
      font-size: 24px;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
    }
    .code {
      font-size: 32px; /* Increased OTP size */
      font-weight: bold;
      color:rgb(57, 21, 185);
      background: #ffeeee;
      display: inline-block;
      padding: 15px 30px;
      border-radius: 15px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      margin-top: 20px;
      background-color: #FF4433;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      font-size: 16px;
      font-weight: bold;
    }
    .button:hover {
      background-color: #b71c1c;
    }
  
    @media (max-width: 600px) {
      .container {
        width: 90%;
      }
      .content h1 {
        font-size: 20px;
      }
      .button {
        font-size: 14px;
        padding: 10px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="http://138.197.38.184:8800/uploads/app_logo.png" alt="App Logo"  style="width: 80px; height: auto"/>
    </div>
    <div class="content">
<h1>Complete Verification to Reset Your Password</h1>
      <p style="margin-bottom: 30px">Your verification code is,</p>
      <span class="code">${otp}</span>
      <div style="margin-top: 30px">
        <p>This OTP will expire in 1 minute.</p>
        <p>If you didn’t request this email, you can safely ignore it.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

const addSchoolEmail = (school_name, email, password) =>
  `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>School Role Created - Radiant Hyve</title>
  <style>
    body {
      font-family: 'Inter', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      color: #2d3748;
    }

    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      padding: 0;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .header {
      background-color: #293FE3;
      padding: 25px;
      text-align: center;
    }

    .header img {
      max-height: 40px;
    }

    .content {
      padding: 24px;
    }

    .title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #333333;
    }

    .text {
      font-size: 14px;
      line-height: 1.7;
      margin-bottom: 24px;
      color: #4a5568;
    }

    .credentials-box {
      background-color: #fef9c3;
      border: 1px solid #facc15;
      padding:10px 14px;
      border-radius: 6px;
      margin-bottom: 24px;
    }

    .credentials-box p {
      margin: 10px 0;
      font-size: 14px;
      color: #1a202c;
    }

  .button-wrapper {
  text-align: center;
  margin-top: 24px;
}

.button {
  display: inline-block;
  padding: 12px 24px;
  background-color: #293FE3;
  color: #fff;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
}


    .footer {
      text-align: center;
      font-size: 12px;
      color: #a0aec0;
      padding: 16px 0;
    }

    @media (max-width: 600px) {
      .content {
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="http://138.197.38.184/school_admin/static/media/Frame_1.e2e44f1be4634e2438f1.png"alt="Radiant Hyve Logo" />
    </div>
    <div class="content">
      <div class="title">New School Created</div>
      <div class="text">
        Hello,<br /><br />
        A new school role named <strong>“${school_name}”</strong> has been created successfully under your account.<br /><br />
        Below are the login credentials for the newly added school admin:
      </div>

      <div class="credentials-box">
        <p><strong>Email Id:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>

    </div>
    <div class="footer">
      &copy; ${currentYear} Radiant Hyve. All rights reserved.
    </div>
  </div>
</body>
</html>
`

const updateSchoolEmail = (school_name, email, password) =>
  `
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Updated - Radiant Hyve</title>
  <style>
    body {
      font-family: 'Inter', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      color: #2d3748;
    }

    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      padding: 0;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .header {
      background-color: #293FE3;
      padding: 25px;
      text-align: center;
    }

    .header img {
      max-height: 40px;
    }

    .content {
      padding: 24px;
    }

    .title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #333333;
    }

    .text {
      font-size: 14px;
      line-height: 1.7;
      margin-bottom: 24px;
      color: #4a5568;
    }

    .credentials-box {
      background-color: #fef9c3;
      border: 1px solid #facc15;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 24px;
    }

    .credentials-box p {
      margin: 10px 0;
      font-size: 14px;
      color: #1a202c;
    }

    .button-wrapper {
      text-align: center;
      margin-top: 24px;
    }

    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #293FE3;
      color: #fff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
    }

    .footer {
      text-align: center;
      font-size: 12px;
      color: #a0aec0;
      padding: 16px 0;
    }

    @media (max-width: 600px) {
      .content {
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="http://138.197.38.184/school_admin/static/media/Frame_1.e2e44f1be4634e2438f1.png"alt="Radiant Hyve Logo" />
    </div>
    <div class="content">
      <div class="title">School Password Updated</div>
      <div class="text">
        Hello,<br /><br />
        The login password for the school role <strong>“${school_name}”</strong> has been updated successfully.<br /><br />
        Please use the following updated login credentials:
      </div>

      <div class="credentials-box">
        <p><strong>Email Id:</strong> ${email}</p>
        <p><strong>New Password:</strong> ${password}</p>
      </div>

      <div class="button-wrapper">
        <a href="http://138.197.38.184/school_admin/login" class="button">Login</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${currentYear} Radiant Hyve. All rights reserved.
    </div>
  </div>
</body>
</html>
`

const addroleEmail = (school_name, email, password, role) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Principal Role Created - Radiant Hyve</title>
  <style>
    body {
      font-family: 'Inter', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      color: #2d3748;
    }

    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      padding: 0;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .header {
      background-color: #293FE3;
      padding: 25px;
      text-align: center;
    }

    .header img {
      max-height: 40px;
    }

    .content {
      padding: 24px;
    }

    .title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #333333;
    }

    .text {
      font-size: 14px;
      line-height: 1.7;
      margin-bottom: 24px;
      color: #4a5568;
    }

    .credentials-box {
      background-color: #fef9c3;
      border: 1px solid #facc15;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 24px;
    }

    .credentials-box p {
      margin: 10px 0;
      font-size: 14px;
      color: #1a202c;
    }

    .button-wrapper {
      text-align: center;
      margin-top: 24px;
    }

    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #293FE3;
      color: #fff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
    }

    .footer {
      text-align: center;
      font-size: 12px;
      color: #a0aec0;
      padding: 16px 0;
    }

    @media (max-width: 600px) {
      .content {
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="http://138.197.38.184/school_admin/static/media/Frame_1.e2e44f1be4634e2438f1.png"alt="Radiant Hyve Logo" />
    </div>
    <div class="content">
      <div class="title">New ${role} Created</div>
      <div class="text">
        Hello,<br /><br />
        A new ${role} has been successfully added to the school <strong>“${school_name}”</strong>.<br /><br />
        Below are the login credentials for the newly created ${role} account:
      </div>

      <div class="credentials-box">
        <p><strong>Email Id:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>
    </div>
    <div class="footer">
      &copy; ${currentYear} Radiant Hyve. All rights reserved.
    </div>
  </div>
</body>
</html>
`

const updateRoleEmail = (school_name, email, password, role) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Updated - Radiant Hyve</title>
  <style>
    body {
      font-family: 'Inter', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      color: #2d3748;
    }

    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      padding: 0;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .header {
      background-color: #293FE3;
      padding: 25px;
      text-align: center;
    }

    .header img {
      max-height: 40px;
    }

    .content {
      padding: 24px;
    }

    .title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #333333;
    }

    .text {
      font-size: 14px;
      line-height: 1.7;
      margin-bottom: 24px;
      color: #4a5568;
    }

    .credentials-box {
      background-color: #fef9c3;
      border: 1px solid #facc15;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 24px;
    }

    .credentials-box p {
      margin: 10px 0;
      font-size: 14px;
      color: #1a202c;
    }

    .button-wrapper {
      text-align: center;
      margin-top: 24px;
    }

    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #293FE3;
      color: #fff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
    }

    .footer {
      text-align: center;
      font-size: 12px;
      color: #a0aec0;
      padding: 16px 0;
    }

    @media (max-width: 600px) {
      .content {
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="http://138.197.38.184/school_admin/static/media/Frame_1.e2e44f1be4634e2438f1.png" alt="Radiant Hyve Logo" />
    </div>
    <div class="content">
      <div class="title">${role} Password Updated</div>
      <div class="text">
        Hello,<br /><br />
        The login password for the ${role} role of <strong>“${school_name}”</strong> has been updated successfully.<br /><br />
        Please use the following updated login credentials:
      </div>

      <div class="credentials-box">
        <p><strong>Email Id:</strong> ${email}</p>
        <p><strong>New Password:</strong> ${password}</p>
      </div>

    </div>
    <div class="footer">
      &copy; ${currentYear} Radiant Hyve. All rights reserved.
    </div>
  </div>
</body>
</html>
`

const studentRequistAccessept = (full_name, school_name, parent_name) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Student Accepted - Radiant Hyve</title>
  <style>
    body {
      font-family: 'Inter', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      color: #2d3748;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .header {
      background-color: #293FE3;
      padding: 25px;
      text-align: center;
    }
    .header img {
      max-height: 40px;
    }
    .content {
      padding: 24px;
    }
    .title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #16a34a;
      text-align: center;
    }
    .text {
      font-size: 14px;
      line-height: 1.7;
      margin-bottom: 24px;
      color: #4a5568;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #a0aec0;
      padding: 16px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="http://138.197.38.184/school_admin/static/media/Frame_1.e2e44f1be4634e2438f1.png"alt="Radiant Hyve Logo" />
    </div>
    <div class="content">
<div class="icon" style="text-align: center; margin-bottom: 16px;">
  <img src="https://cdn-icons-png.flaticon.com/512/845/845646.png" alt="Accepted Icon" width="60" height="60" />
</div>
<div class="title" style="color:#16a34a; font-size:18px; font-weight:600; text-align:center;">Student Accepted</div>

      <div class="text">
        Dear ${parent_name},<br /><br />
        We are happy to inform you that your child <strong>“${full_name}”</strong> has been <span style="color:#16a34a; font-weight:600;">accepted</span> by the school admin at <strong>“${school_name}”</strong>.<br /><br />
        You can now log in to your parent dashboard to track academic updates.
      </div>
    </div>
    <div class="footer">
      &copy; ${currentYear} Radiant Hyve. All rights reserved.
    </div>
  </div>
</body>
</html>
`

const studentRequistRejected = (full_name, school_name, parent_name) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Student Rejected - Radiant Hyve</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f6f8; color: #2d3748; }
    .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); overflow: hidden; }
    .header { background-color: #293FE3; padding: 25px; text-align: center; }
    .header img { max-height: 40px; }
    .content { padding: 24px; }
    .title { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #DC2626; text-align: center; }
    .text { font-size: 14px; line-height: 1.7; margin-bottom: 24px; color: #4a5568; }
    .footer { text-align: center; font-size: 12px; color: #a0aec0; padding: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="http://138.197.38.184/school_admin/static/media/Frame_1.e2e44f1be4634e2438f1.png"alt="Radiant Hyve Logo" />
    </div>
    <div class="content">
<div class="icon" style="text-align: center; margin-bottom: 16px;">
  <img src="https://cdn-icons-png.flaticon.com/512/1828/1828843.png" alt="Rejected Icon" width="60" height="60" />
</div>
<div class="title" style="color:#DC2626; font-size:18px; font-weight:600; text-align:center;">Student Rejected</div>

      <div class="text">
        Dear ${parent_name},<br /><br />
        We regret to inform you that your child <strong>“${full_name}”</strong> has been <span style="color:#DC2626; font-weight:600;">rejected</span> by the school admin at <strong>“${school_name}”</strong>.<br /><br />
        For any queries, please contact the school administration directly.
      </div>
    </div>
    <div class="footer">
      &copy; ${currentYear} Radiant Hyve. All rights reserved.
    </div>
  </div>
</body>
</html>
`

const studentRequistPending = (full_name, school_name, parent_name) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Student Status - Waiting - Radiant Hyve</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f6f8; color: #2d3748; }
    .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); overflow: hidden; }
    .header { background-color: #293FE3; padding: 25px; text-align: center; }
    .header img { max-height: 40px; }
    .content { padding: 24px; }
    .title { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #f59e0b; text-align: center; }
    .text { font-size: 14px; line-height: 1.7; margin-bottom: 24px; color: #4a5568; }
    .footer { text-align: center; font-size: 12px; color: #a0aec0; padding: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="http://138.197.38.184/school_admin/static/media/Frame_1.e2e44f1be4634e2438f1.png"alt="Radiant Hyve Logo" />
    </div>
    <div class="content">
<div class="icon" style="text-align: center; margin-bottom: 16px;">
  <img src="https://cdn-icons-png.flaticon.com/512/1584/1584892.png
" alt="Waiting Icon" width="60" height="60" />
</div>
<div class="title" style="color:#f59e0b; font-size:18px; font-weight:600; text-align:center;">Student Application In Review</div>

      <div class="text">
        Dear ${parent_name},<br /><br />
        Your child <strong>“${full_name}”</strong>'s admission request to <strong>“${school_name}”</strong> is currently <span style="color:#f59e0b; font-weight:600;">under review</span> by the admin.<br /><br />
        You will receive an update as soon as a decision is made.
      </div>
    </div>
    <div class="footer">
      &copy; ${currentYear} Radiant Hyve. All rights reserved.
    </div>
  </div>
</body>
</html>
`

const blockroleEmail = (full_name, school_name, email, role,  block_reason) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Principal Blocked - Radiant Hyve</title>
  <style>
    body {
      font-family: 'Inter', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      color: #2d3748;
    }

    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .header {
      background-color: #293FE3;
      padding: 25px;
      text-align: center;
    }

    .header img {
      max-height: 40px;
    }

    .content {
      padding: 24px;
    }

    .title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #DC2626;
      text-align: center;
    }

    .text {
      font-size: 14px;
      line-height: 1.7;
      margin-bottom: 24px;
      color: #4a5568;
    }

    .credentials-box {
      background-color: #fee2e2;
      border: 1px solid #f87171;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 24px;
    }

    .credentials-box p {
      margin: 8px 0;
      font-size: 14px;
      color: #1a202c;
    }

    .footer {
      text-align: center;
      font-size: 12px;
      color: #a0aec0;
      padding: 16px 0;
    }

    @media (max-width: 600px) {
      .content {
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="http://138.197.38.184/school_admin/static/media/Frame_1.e2e44f1be4634e2438f1.png"alt="Radiant Hyve Logo" />
    </div>
    <div class="content">
      <div class="title">${role} Blocked</div>
      <div class="text">
        Dear ${full_name},<br /><br />
        The ${role}  account for <strong>“${school_name}”</strong> has been <span style="color:#DC2626; font-weight:600;">blocked</span> from accessing the Radiant Hyve system.<br /><br />
        Login access is now temporarily disabled until further action is taken by the administrator.
      </div>

      <div class="credentials-box">
        <p><strong>Email Id:</strong> ${email}</p>
    <p><strong>Reason: </strong> ${block_reason}</p> <!-- <-- add this line -->
      </div>
    </div>
    <div class="footer">
      &copy; ${currentYear} Radiant Hyve. All rights reserved.
    </div>
  </div>
</body>
</html>
`

const deleteroleEmail = (school_name, email, delete_reason, role, full_name) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Principal Role Deleted - Radiant Hyve</title>
  <style>
    body {
      font-family: 'Inter', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      color: #2d3748;
    }

    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .header {
      background-color: #293FE3;
      padding: 25px;
      text-align: center;
    }

    .header img {
      max-height: 40px;
    }

    .content {
      padding: 24px;
    }

    .title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #DC2626;
      display: flex;
      align-items: center;
      gap: 10px;
    }

.icon{
 display:flex;
      align-items: center;
          justify-content: center;
      margin-bottom:20px;

}
    .title-icon {
      width: 80px;
      height: 80px;
    }

    .text {
      font-size: 14px;
      line-height: 1.7;
      margin-bottom: 24px;
      color: #4a5568;
    }

    .credentials-box {
      background-color: #fee2e2;
      border: 1px solid #f87171;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 24px;
    }

    .credentials-box p {
      margin: 8px 0;
      font-size: 14px;
      color: #1a202c;
    }

    .button-wrapper {
      text-align: center;
      margin-top: 24px;
    }

    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #DC2626;
      color: #fff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
    }

    .footer {
      text-align: center;
      font-size: 12px;
      color: #a0aec0;
      padding: 16px 0;
    }

    @media (max-width: 600px) {
      .content {
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="http://138.197.38.184/school_admin/static/media/Frame_1.e2e44f1be4634e2438f1.png"alt="Radiant Hyve Logo" />
    </div>
    <div class="content">
    <div class="icon">

  <img src="https://cdn-icons-png.flaticon.com/512/6932/6932392.png" alt="Delete Icon" class="title-icon" />
      </div>

      <div class="title">
        ${role} Deleted
      </div>
      <div class="text">
        Dear ${full_name},<br /><br />
        The ${role} role for <strong>“${school_name}”</strong> has been successfully <span style="color:#DC2626; font-weight:600;"> Deleted</span> from your Radiant Hyve account.<br /><br />
        The following login credential is now invalid:
      </div>

      <div class="credentials-box">
        <p><strong>Email Id:</strong> ${email}</p>
         <p><strong>Reason:</strong> ${delete_reason}</p>
      </div>

      <div class="button-wrapper">
        <a href="http://138.197.38.184/school_admin/login" class="button">Back to Admin Panel</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${currentYear} Radiant Hyve. All rights reserved.
    </div>
  </div>
</body>
</html>
`

const deleteSchoolEmail = (school_name, email, delete_reason) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Principal Role Deleted - Radiant Hyve</title>
  <style>
    body {
      font-family: 'Inter', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      color: #2d3748;
    }

    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .header {
      background-color: #293FE3;
      padding: 25px;
      text-align: center;
    }

    .header img {
      max-height: 40px;
    }

    .content {
      padding: 24px;
    }

    .title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #DC2626;
      display: flex;
      align-items: center;
      gap: 10px;
    }

.icon{
 display:flex;
      align-items: center;
          justify-content: center;
      margin-bottom:20px;

}
    .title-icon {
      width: 80px;
      height: 80px;
    }

    .text {
      font-size: 14px;
      line-height: 1.7;
      margin-bottom: 24px;
      color: #4a5568;
    }

    .credentials-box {
      background-color: #fee2e2;
      border: 1px solid #f87171;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 24px;
    }

    .credentials-box p {
      margin: 8px 0;
      font-size: 14px;
      color: #1a202c;
    }

    .button-wrapper {
      text-align: center;
      margin-top: 24px;
    }

    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #DC2626;
      color: #fff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
    }

    .footer {
      text-align: center;
      font-size: 12px;
      color: #a0aec0;
      padding: 16px 0;
    }

    @media (max-width: 600px) {
      .content {
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="http://138.197.38.184/school_admin/static/media/Frame_1.e2e44f1be4634e2438f1.png"alt="Radiant Hyve Logo" />
    </div>
    <div class="content">
    <div class="icon">

  <img src="https://cdn-icons-png.flaticon.com/512/6932/6932392.png" alt="Delete Icon" class="title-icon" />
      </div>

      <div class="title">
        School Deleted
      </div>
      <div class="text">
        Hello,<br /><br />
        The School role for <strong>“${school_name}”</strong> has been successfully <span style="color:#DC2626; font-weight:600;"> Deleted</span> from your Radiant Hyve account.<br /><br />
        The following login credential is now invalid:
      </div>

      <div class="credentials-box">
        <p><strong>Email Id:</strong> ${email}</p>
         <p><strong>Reason:</strong> ${delete_reason}</p>
      </div>

    </div>
    <div class="footer">
      &copy; ${currentYear} Radiant Hyve. All rights reserved.
    </div>
  </div>
</body>
</html>
`

const unblockroleEmail = (full_name, school_name, email, role) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Principal Unblocked - Radiant Hyve</title>
  <style>
    body {
      font-family: 'Inter', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      color: #2d3748;
    }

    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .header {
      background-color: #293FE3;
      padding: 25px;
      text-align: center;
    }

    .header img {
      max-height: 40px;
    }

    .content {
      padding: 24px;
    }

    .title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #16a34a;
      text-align: center;
    }

    .text {
      font-size: 14px;
      line-height: 1.7;
      margin-bottom: 24px;
      color: #4a5568;
    }

    .credentials-box {
      background-color: #dcfce7;
      border: 1px solid #4ade80;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .credentials-box p {
      margin: 8px 0;
      font-size: 14px;
      color: #1a202c;
    }

    .button-wrapper {
      text-align: center;
      margin-top: 24px;
    }

    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #16a34a;
      color: #fff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
    }

    .footer {
      text-align: center;
      font-size: 12px;
      color: #a0aec0;
      padding: 16px 0;
    }

    @media (max-width: 600px) {
      .content {
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="http://138.197.38.184/school_admin/static/media/Frame_1.e2e44f1be4634e2438f1.png"alt="Radiant Hyve Logo" />
    </div>
    <div class="content">
      <div class="title">${role} Unblocked</div>
      <div class="text">
        Dear ${full_name},<br /><br />
        The ${role} account for <strong>“${school_name}”</strong> has been <span style="color:#16a34a; font-weight:600;">unblocked</span> and restored.<br /><br />
        The user can now log in again using their valid credentials.
      </div>

      <div class="credentials-box">
        <p><strong>Email Id:</strong> ${email}</p>
        <p><strong>Status:</strong> Active</p>
      </div>

    </div>
    <div class="footer">
      &copy; ${currentYear} Radiant Hyve. All rights reserved.
    </div>
  </div>
</body>
</html>

`


module.exports = {
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
};