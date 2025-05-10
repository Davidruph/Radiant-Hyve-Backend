
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
      color: #000000;
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
      <img src="https://promarvel.com:8800/uploads/promarvel.png" alt="App Logo"  style="width: 80px; height: auto"/>
    </div>
    <div class="content">
      <h1>Complete Your Profile Verification</h1>
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
const profileVerificationAcceptedHtml = (data) =>
  `<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome Email</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #fff;
      color: #000;
    }

    .container {
      max-width: 400px;
      margin: 20px auto;
      background: rgba(240, 240, 240, 0.45); /* Slightly lighter background */
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      border-top: 5px solid #000;
    }

    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #000;
    }

    .header img {
      max-width: 150px;
      height: auto;
    }

    .content {
      padding: 20px;
      text-align: center;
    }

    h1 {
      font-size: 24px;
      color: #000;
      margin-bottom: 20px;
    }

    p {
      font-size: 16px;
      line-height: 1.6;
      color: #000;
      margin-bottom: 10px;
    }

    .code {
      font-size: 32px;
      font-weight: bold;
      color: #000;
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
      color: #fff;
      text-decoration: none;
      border-radius: 5px;
      font-size: 16px;
      font-weight: bold;
      transition: background-color 0.3s;
    }

    .button:hover {
      background-color: #b71c1c;
    }

    @media (max-width: 600px) {
      .container {
        width: 90%;
      }

      h1 {
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
      <img src="https://promarvel.com:8800/uploads/promarvel.png" alt="App Logo"  style="width: 80px; height: auto"/>
    </div>
    <div class="content">
      <h1>Profile Verified- Complete Your Training</h1>
      <p>Your profile verification has been successfully accepted. To proceed, you need to complete a mandatory training period at our office located at:</p>
      <p><strong>${data.address}</strong></p>
      <p>Once the training is complete, you will be eligible to start providing services.</p>
    </div>
  </div>
</body>
</html>
`;
const profileVerificationRejectedHtml = (data) =>
  `<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome Email</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #fff;
      color: #000;
    }

    .container {
      max-width: 400px;
      margin: 20px auto;
      background: rgba(240, 240, 240, 0.45); /* Slightly lighter background */
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      border-top: 5px solid #000;
    }

    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #000;
    }

    .header img {
      max-width: 150px;
    }

    .content {
      padding: 20px;
      text-align: center;
    }

    h1 {
      font-size: 24px;
      color: #000;
      margin-bottom: 20px;
    }

    p {
      font-size: 16px;
      line-height: 1.6;
      color: #000;
      margin-bottom: 10px;
    }

    .code {
      font-size: 32px;
      font-weight: bold;
      color: #000;
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
      color: #fff;
      text-decoration: none;
      border-radius: 5px;
      font-size: 16px;
      font-weight: bold;
      transition: background-color 0.3s;
    }

    .button:hover {
      background-color: #b71c1c;
    }

    @media (max-width: 600px) {
      .container {
        width: 90%;
      }

      h1 {
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
      <img src="https://promarvel.com:8800/uploads/promarvel.png" alt="App Logo"  style="width: 80px; height: auto"/>
    </div>
    <div class="content">
      <h1>Profile Verification Rejected- Reason for Rejection</h1>
    <p>We regret to inform you that your profile verification has been rejected. The reason for the rejection is as follows:</p>
    <p>${data.reason}</p>
    <p>Please review the details, make the necessary corrections, and feel free to reapply once you have addressed the issue.</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = { sendOTPToEmail, profileVerificationAcceptedHtml, profileVerificationRejectedHtml };