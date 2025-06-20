require('dotenv').config();
const db = require('../../config/db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { Op, Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require("path");
const { PhoneNumberUtil, PhoneNumberFormat } = require("google-libphonenumber");
const phoneUtil = PhoneNumberUtil.getInstance()
// const { sendOtpEmail } = require('../../utils/email');
const { v4: uuidv4 } = require("uuid");
const { upload_file, deleteFromS3, uploadVideo } = require('../../helpers/s3_upload')
const { checkToken } = require('../../helpers/checkToken')
const {sendOTPVerificationEmail} = require('../../helpers/email')

const singup = async (req, res) => {
    try {
        const { email, password, } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ status: 0, message: 'Email already exists.' });
        }
        const user = await db.User.create({
            email: email,
            password: hashedPassword,
            role: 'super_admin',
        });

        return res.status(201).json({
            status: 1,
            message: 'User created successfully',
            data: user,
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: 'Error creating user',
            error: error.message
        });
    }
}

const login = async (req, res) => {
    const {
        email,
        device_id,
        device_token,
        device_type,
        password,
        role,
    } = req.body;

    console.log(req.body);

    try {
        const user = await db.User.findOne({ where: { email, role , is_deleted: false} });

        if (!user) {
            return res.status(404).json({ status: 0, message: 'User not found.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ status: 0, message: 'Invalid credentials.' });
        }

        if (user.is_blocked === true) {
            return res.status(400).json({ status: 0, message: 'Your account is blocked.' });
        }

        // let tokenRecord = await db.Token.findOne({
        //     where: {
        //         device_id: device_id,
        //         device_token: device_token,
        //         device_type: device_type,
        //         user_id: user.id
        //     }
        // })

        // if (!tokenRecord) {
        //     tokenRecord = await db.Token.create({
        //         device_id,
        //         device_token,
        //         device_type,
        //         user_id: user.id,
        //         refresh_token: uuidv4(),
        //         token_expire_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        //     });
        // }

        // const token = await jwt.sign(
        //     { user_id: user.id, token_id: tokenRecord.id },
        //     process.env.JWT_SECRET_KEY, { expiresIn: '1d' }
        // );

        const token = await checkToken({ device_token, device_id, device_type }, user.id);
        
        return res.status(200).json({
            status: 1,
            message: 'Login successful.',
            token: token.token,
            refresh_token: token.refresh_token,
            data: user
        });

    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({
            status: 0,
            message: 'An error occurred during login.',
            error: error.message
        });
    }
};

const superAdminLogin = async (req, res) => {
    try {
        const { email, password, device_id, device_token, device_type, } = req.body;

        const user = await db.User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ status: 0, message: 'User not found.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ status: 0, message: 'Invalid credentials.' });
        }

        if (user.role != 'super_admin') {
            return res.status(403).json({ status: 0, message: 'Access denied. Only superadmin can log in here.' });
        }

        let tokenRecord = await db.Token.findOne({
            where: {
                device_id: device_id,
                device_token: device_token,
                device_type: device_type,
                user_id: user.id
            }
        })

        if (!tokenRecord) {
            tokenRecord = await db.Token.create({
                device_id,
                device_token,
                device_type,
                user_id: user.id,
            });
        }

        const token = jwt.sign({ user_id: user.id }, process.env.JWT_SECRET_KEY);

        return res.status(200).json({
            status: 1,
            message: 'Login successful.',
            token,
            data: user
        });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({
            status: 0,
            message: 'An error occurred during login.',
            error: error.message
        });
    }
}

const forgotePasswor = async (req, res) => {
    const { email, role } = req.body;

    if (!email) {
        return res.status(400).json({ status: 0, message: 'email is required' })
    }

    if (!role) {
        return res.status(400).json({ status: 0, message: 'role is required' })
    }

    try {
        const user = await db.User.findOne({ where: { email, role, is_deleted: false } });

        if (!user) {
            return res.status(404).json({ status: 0, message: 'Email not registered.' });
        }

        const otp = Math.floor(1000 + Math.random() * 9000);
        await user.update({ otp, otp_created_at: new Date(), is_otp_Verify: false });

        await sendOTPVerificationEmail({email, otp});

        return res.status(200).json({
            status: 1,
            message: `OTP has been sent to your email`,
            data: {
                id: user.id,
                email: user.email,
                otp: user.otp,
            }
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
};

const verifyForgotePasswordOtp = async (req, res) => {
    const { otp, email, role } = req.body;

    try {
        const user = await db.User.findOne({ where: { email, role ,  is_deleted: false} });

        if (!user) {
            return res.status(404).json({ status: 0, message: 'User not found.' });
        }

        const otpExpired = new Date() - new Date(user.otp_createdAt) > 1 * 60 * 1000;

        if (otpExpired) {
            return res.status(400).json({ status: 0, message: 'OTP expired.' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ status: 0, message: 'Invalid OTP.' });
        }

        user.otp = null;
        user.otp_created_at = null;
        user.is_otp_verify = true;
        await user.save();

        return res.status(200).json({ status: 1, message: 'OTP verified successfully.' });

    } catch (error) {
        console.error('Error during OTP verification:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error.', error: error.message });
    }

}

const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        const user = await db.User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ status: 0, message: 'User not found.' });
        }

        if (user.is_otp_verify === false) {
            return res.status(400).json({ status: 0, message: 'OTP not verified. Please verify OTP first.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await user.update({
            password: hashedPassword,
            is_otp_verify: false,
        });

        return res.status(200).json({ status: 1, message: 'Password reset successfully.' });

    } catch (error) {
        console.error('Error during password reset:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error.', error: error.message });
    }
}

const changePassword = async (req, res) => {
    try {
        const { password, newPassword } = req.body;
        const userId = req.user.id;

        const user = await db.User.findOne({
            where: { id: userId }
        });

        if (!user.password) {
            return res.status(500).json({ status: 0, message: "Password not set for this user." });
        }

        if (password === newPassword) {
            return res.status(400).json({ status: 0, message: "New password cannot be the same as the current password." });
        }

        const isPasswordTrue = await bcrypt.compare(password, user.password);

        if (!isPasswordTrue) {
            return res.status(400).json({ status: 0, message: "Invalid current password" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await user.update({ password: hashedPassword });

        return res.status(200).json({ status: 1, message: "Change password successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 0,
            message: "Failed to change the password!",
            error: error.message
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await db.User.findOne({
            where: { id: req.user.id },
        });
        return res.status(200).json({ status: 1, message: 'get profile successfully.', data: user });
    } catch (error) {
        console.error('Error during :', error);
        return res.status(500).json({ status: 0, message: 'Internal server error.', error: error.message });
    }
}

const logout = async (req, res) => {
    try {
        await req.token.destroy()

        return res.status(200).json({ status: 1, message: 'Logout successful.' });
    } catch (error) {
        console.error('Error during logout:', error);
        return res.status(500).json({ status: 0, message: 'Internal server error.', error: error.message });
    }
}

const refreshTokenWeb = async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ status: 0, message: "refresh_token is required" })

    try {
        const storedToken = await db.Token.findOne({ where: { refresh_token } });
        if (!storedToken || storedToken.token_expire_at < new Date()) {
            if (storedToken) await db.Token.destroy({ where: { refresh_token } });
            return res.status(403).json({ status: 0, message: "Invalid or expired refresh token, please log in again" });
        }
        const user = await db.User.findByPk(storedToken.id);
        if (!user) return res.status(400).json({ status: 0, message: "User not found" });
        const token = jwt.sign({ user_id: user.id, token_id: storedToken.id }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });
        return res.status(200).json({
            status: 1,
            message: "Token refreshed successfully",
            token: token,
        });
    } catch (error) {
        console.error("Error refreshing token:", error);
        return res.status(500).json({ status: 0, message: 'Internal server error.', error: error.message });
    }
};

const refreshToken = async (req, res) => {
  const { refresh_token } = req.query;
  if (!refresh_token) return res.status(400).json({ status: 0, message: "Refresh Token is required" })
 
  try {
    const storedToken = await db.Token.findOne({ where: { refresh_token } });
    if (!storedToken || storedToken.token_expire_at < new Date()) {
      if (storedToken) await db.Token.destroy({ where: { refresh_token } });
      return res.status(403).json({ status: 0, message: "Invalid or expired refresh token, please log in again" });
    }
    const user = await db.User.findByPk(storedToken.id);
    if (!user) return res.status(400).json({ status: 0, message: "User not found" });
    const token = jwt.sign({ user_id: user.id, token_id: storedToken.id }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });
    return res.status(200).json({
      status: 1,
      message: "Token refreshed successfully",
      access_token: token,
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return res.status(500).json({ status: 0, message: 'Internal server error' });
  }
};
 


module.exports = {
    singup,
    login,
    superAdminLogin,

    forgotePasswor,
    verifyForgotePasswordOtp,
    resetPassword,

    changePassword,
    logout,
    refreshToken,
    getProfile,
    refreshTokenWeb
}
