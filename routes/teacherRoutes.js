const express = require('express');
const router = express.Router();

const {verifyToken} = require('../middleware/verifyToken');
const {upload} = require("../helpers/storage")

const imageUpload = upload.fields([
  { name: 'profile_pic' },
]);
const teacherValidator = require('../validator/teacherValidator');
const teacher = require('../controller/teacher/homeController');


router.put('/edit_teacher_profile',verifyToken, imageUpload, teacherValidator.ediStaffValidation(), teacher.editProfile);


router.get('/list_menu_student',verifyToken, teacher.listMenu);
router.get('/list_sleep_loag_student',verifyToken, teacher.listSleepLog);
router.get('/list_medification_student',verifyToken, teacher.listMedication);


module.exports = router;