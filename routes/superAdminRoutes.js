const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/verifyToken");

const school = require("../controller/superAdmin/schoolController");
const schoolvalidator = require("../validator/superadminValidator");

router.post(
  "/add_school",
  verifyToken,
  schoolvalidator.addSchoolValidation(),
  school.addSchool
);
router.put(
  "/edit_school",
  verifyToken,
  schoolvalidator.updateSchoolValidation(),
  school.editSchool
);
router.patch(
  "/change_school_password",
  verifyToken,
  schoolvalidator.changeSchoolPasswordValidation(),
  school.changeSchoolPassword
);
router.delete("/delete_school", verifyToken, school.deleteSchool);
router.get("/get_school", verifyToken, school.getSchoolById);
router.get("/list_school", verifyToken, school.listSchool);
router.post(
  "/create_subscription_plan",
  verifyToken,
  school.createSubscription
);
router.get(
  "/list_subscription_plans",
  verifyToken,
  school.listSubscriptionPlans
);

module.exports = router;
