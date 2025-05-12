const express = require('express');
const router = express.Router();

const {verifyToken} = require('../middleware/verifyToken');

const auth = require('../controller/common/authController');




router.post('/login', auth.login);
router.post('/forgote_password', auth.forgotePasswor);
router.post('/verify_otp', auth.verifyForgotePasswordOtp);
router.post('/reset_password', auth.resetPassword);
router.post('/change_password',verifyToken, auth.changePassword);
router.post('/logout',verifyToken, auth.logout);
router.post('/refresh_token',verifyToken, auth.refreshToken);
router.get('/getProfile',verifyToken, auth.getProfile);



module.exports = router;
