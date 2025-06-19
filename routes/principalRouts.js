const express = require('express');
const router = express.Router();

const {verifyToken} = require('../middleware/verifyToken');
const {upload} = require("../helpers/storage")

const imageUpload = upload.fields([
  { name: 'profile_pic' },
]);
const principalValidator = require('../validator/principalValidator');
const principal = require('../controller/principal/homeController');


router.put('/edit_principal_profile',verifyToken, imageUpload, principalValidator.editPrincipalValidation(), principal.editPrincipal);


router.post('/attendance',verifyToken, principalValidator.attendanceValidation(), principal.Attendance);
router.get('/attendance_list',verifyToken, principal.listAttendance);
router.get('/get_attendance', verifyToken, principal.getAttendance);

router.get('/get_other_attendance', verifyToken, principal.listOtherAttedance);

router.get('/get_today_attendance', verifyToken, principal.todayAttedance);




module.exports = router;