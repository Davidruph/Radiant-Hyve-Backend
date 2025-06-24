
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

const addSchoolEmail = (schoo_name, email, password) =>
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
      <img src="https://radiant-highway-storage.nyc3.digitaloceanspaces.com/profile_pic/1750658401284-Frame_1.png" alt="Radiant Hyve Logo" />
    </div>
    <div class="content">
      <div class="title">New School Created</div>
      <div class="text">
        Hello,<br /><br />
        A new school role named <strong>“${schoo_name}”</strong> has been created successfully under your account.<br /><br />
        Below are the login credentials for the newly added school admin:
      </div>

      <div class="credentials-box">
        <p><strong>Email Id:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>

      
<div class="button-wrapper">
  <a href="http://138.197.38.184/school_admin/login" class="button">Login</a>
</div>
    </div>
    <div class="footer">
      &copy; 2025 Radiant Hyve. All rights reserved.
    </div>
  </div>
</body>
</html>
`

const updateSchoolEmail = (schoo_name, email, password) =>
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
      <img src="https://radiant-highway-storage.nyc3.digitaloceanspaces.com/profile_pic/1750658401284-Frame_1.png" alt="Radiant Hyve Logo" />
    </div>
    <div class="content">
      <div class="title">School Password Updated</div>
      <div class="text">
        Hello,<br /><br />
        The login password for the school role <strong>“${schoo_name}”</strong> has been updated successfully.<br /><br />
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
      &copy; 2025 Radiant Hyve. All rights reserved.
    </div>
  </div>
</body>
</html>
`

const addroleEmail = (schoo_name, email, password, role) => `
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
      <img src="https://radiant-highway-storage.nyc3.digitaloceanspaces.com/profile_pic/1750658401284-Frame_1.png" alt="Radiant Hyve Logo" />
    </div>
    <div class="content">
      <div class="title">New ${role} Created</div>
      <div class="text">
        Hello,<br /><br />
        A new principal has been successfully added to the school <strong>“${schoo_name}”</strong>.<br /><br />
        Below are the login credentials for the newly created principal account:
      </div>

      <div class="credentials-box">
        <p><strong>Email Id:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>
    </div>
    <div class="footer">
      &copy; 2025 Radiant Hyve. All rights reserved.
    </div>
  </div>
</body>
</html>
`

const updateRoleEmail =(schoo_name, email, password, role) => `
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
      <img src="https://radiant-highway-storage.nyc3.digitaloceanspaces.com/profile_pic/1750658401284-Frame_1.png" alt="Radiant Hyve Logo" />
    </div>
    <div class="content">
      <div class="title">${role} Password Updated</div>
      <div class="text">
        Hello,<br /><br />
        The login password for the principal role of <strong>“${schoo_name}”</strong> has been updated successfully.<br /><br />
        Please use the following updated login credentials:
      </div>

      <div class="credentials-box">
        <p><strong>Email Id:</strong> ${email}</p>
        <p><strong>New Password:</strong> ${password}</p>
      </div>

    </div>
    <div class="footer">
      &copy; 2025 Radiant Hyve. All rights reserved.
    </div>
  </div>
</body>
</html>
`



module.exports = { sendOTPToEmail, addSchoolEmail, updateSchoolEmail, addroleEmail, updateRoleEmail };