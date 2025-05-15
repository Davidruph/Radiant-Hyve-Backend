const express = require('express');
const router = express.Router();

const {verifyToken} = require('../middleware/verifyToken');
const {upload} = require("../helpers/storage")

const imageUpload = upload.fields([
  { name: 'profile_pic' },
]);

const principal = require('../controller/schoolAdmin/principalController');
const staff = require('../controller/schoolAdmin/staffController');
const schoolvalidator = require('../validator/schollValidator');

const shift = require("../controller/schoolAdmin/shiftController")

const student = require("../controller/schoolAdmin/studentController")

router.put('/edit_school_profile',verifyToken, schoolvalidator.updateSchoolValidation(), principal.editProfile);


router.post('/add_principal',verifyToken, imageUpload, schoolvalidator.addPrincipalValidation(), principal.addPrincipal);
router.put('/edit_principal',verifyToken, imageUpload, schoolvalidator.editPrincipalValidation(), principal.editPrincipal);
router.patch('/change_principal_password',verifyToken,schoolvalidator.changePrincipalPasswordValidation(), principal.changePrincipalPassword);
router.delete('/delete_principal',verifyToken, principal.deletePrincipal);
router.get('/get_principal',verifyToken, principal.getPrincipal);
router.get('/list_principal',verifyToken, principal.listPrincipal);
router.post('/block_principal',verifyToken, principal.blockPrincipal);


router.post('/add_staff',verifyToken, imageUpload, schoolvalidator.addStaffValidation(), staff.addStaff);
router.put('/edit_staff',verifyToken, imageUpload, schoolvalidator.ediStaffValidation(), staff.editStaff);
router.patch('/change_staff_password',verifyToken,schoolvalidator.changeStaffPasswordValidation(), staff.changeStaffPassword);
router.delete('/delete_staff',verifyToken, staff.deleteStaff);
router.get('/get_staff',verifyToken, staff.getStaff);
router.get('/list_staff',verifyToken, staff.listStaff);
router.post('/block_staff',verifyToken, staff.blockStaff);
router.get('/get_assign_student',verifyToken, schoolvalidator.getAsingnStudentValidation(), staff.assignStudentList);


router.post('/add_shift',verifyToken,schoolvalidator.addShiftValidation(), shift.addShift);
router.put('/edit_shift',verifyToken,schoolvalidator.editShiftValidation(), shift.editShift);
router.get('/list_shift',verifyToken, shift.listShift);



router.get('/get_student',verifyToken, student.getStudent);
router.get('/list_all_student',verifyToken, schoolvalidator.listStudentValidation(), student.getAllStudent);
router.get('/list_new_student',verifyToken, student.getNewStudent);
router.patch('/edit_student_status',verifyToken, student.editStatus);
router.patch('/student_assign_teacher',verifyToken,schoolvalidator.assignStudentValidation(), student.studentAssignTeacher);
router.get('/list_teacher',verifyToken, student.listTeacher);
router.get('/get_shift',verifyToken, student.getShift);













module.exports = router;