const express = require('express');
const router = express.Router();

const {verifyToken} = require('../middleware/verifyToken');
const {upload} = require("../helpers/storage")

const imageUpload = upload.fields([
  { name: 'profile_pic' },
]);
const teacherValidator = require('../validator/teacherValidator');
const teacher = require('../controller/teacher/homeController');
const leave = require('../controller/teacher/leaveController');

const student = require('../controller/teacher/studentController');



router.put('/edit_teacher_profile',verifyToken, imageUpload, teacherValidator.ediStaffValidation(), teacher.editProfile);


router.get('/list_menu_student',verifyToken, teacher.listMenu);
router.get('/list_sleep_loag_student',verifyToken, teacher.listSleepLog);
router.get('/list_medification_student',verifyToken, teacher.listMedication);

router.get('/teacher_all_student',verifyToken, teacher.listStudetMenu);

router.post('/staff_apply_leave',verifyToken, teacherValidator.applyLeaveValidation(), leave.applyLeave)
router.get('/list_leave_teacher',verifyToken, leave.listLeave);
router.post('/cancel_leave',verifyToken, leave.cancelLeave);


router.post('/student_attedance',verifyToken, teacherValidator.studeneAttedanceValidation(), student.studentAttendance)

router.post('/submitted_attedance',verifyToken, student.submittedAttedance)

router.get('/list_student_attedance',verifyToken, teacherValidator.listAttedanceValidation(), student.listStudentAttedance);

router.get('/list_student_teacher',verifyToken, student.listStudentTeacher);

router.get('/student_details',verifyToken, student.studentDetails);

router.get('/student_list',verifyToken, student.getStudent);

router.put('/edit_student_profile_pic',verifyToken,imageUpload, student.studentProfilePicEdit);

router.get('/get_student_attedance',verifyToken, teacherValidator.getAttedanceValidation(), student.getStudentAttedance);

module.exports = router;