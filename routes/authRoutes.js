const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/verifyToken");

const auth = require("../controller/common/authController");
const authValidator = require("../validator/authValidator");

router.post("/singup", auth.singup);

router.post("/login", authValidator.loginValidation(), auth.login);
router.post(
  "/forgote_password",
  authValidator.forgotPasswordValidation(),
  auth.forgotePasswor
);
router.post(
  "/verify_otp",
  authValidator.forgoteVerifyValidation(),
  auth.verifyForgotePasswordOtp
);
router.post(
  "/reset_password",
  authValidator.resetPasswordValidation(),
  auth.resetPassword
);
router.patch(
  "/change_password",
  verifyToken,
  authValidator.changePasswordValidation(),
  auth.changePassword
);
router.post("/logout", verifyToken, auth.logout);
router.get("/create_token", auth.refreshToken);
router.get("/get_profile", verifyToken, auth.getProfile);
router.post("/refresh_token_web", auth.refreshTokenWeb);

router.get("/list_notification", verifyToken, auth.listNotification);

module.exports = router;
