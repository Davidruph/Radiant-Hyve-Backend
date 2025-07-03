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
const parent = require("../controller/schoolAdmin/parentController")
const student = require("../controller/schoolAdmin/studentController")
const certificate = require("../controller/schoolAdmin/certificationController")
const medification = require("../controller/schoolAdmin/medicationController")
const event = require("../controller/schoolAdmin/eventController")
const sleep_loag = require("../controller/schoolAdmin/sleeplogsController")
const menu = require("../controller/schoolAdmin/mealTrackController")
const home = require("../controller/schoolAdmin/homeController")


router.get('/deshbord_count',verifyToken, home.desbordCount);
router.get('/birthday_count',verifyToken, home.birthdaysCount);



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
router.get('/list_all_leave',verifyToken, staff.allLeave);


router.post('/add_shift',verifyToken,schoolvalidator.addShiftValidation(), shift.addShift);
router.put('/edit_shift',verifyToken,schoolvalidator.editShiftValidation(), shift.editShift);
router.get('/list_shift',verifyToken, shift.listShift);



router.get('/get_student',verifyToken, student.getStudent);
router.get('/list_all_student',verifyToken, schoolvalidator.listStudentValidation(), student.getAllStudent);
router.get('/list_new_student',verifyToken, student.getNewStudent);
router.get('/list_waiting_student',verifyToken, student.listWaitingStudent);
router.patch('/edit_student_status',verifyToken,schoolvalidator.assignStudentValidation(), student.editStatus);
router.patch('/student_assign_teacher',verifyToken, student.studentAssignTeacher);
router.get('/list_teacher',verifyToken, student.listTeacher);
router.get('/get_shift',verifyToken, student.getShift);
router.get('/get_all_student_attedance',verifyToken, student.studentAttendance);
router.get('/get_parent_student',verifyToken, student.listParantStudent);
router.get('/get_teacher_student',verifyToken, student.listTeacherStudent);






router.post('/add_parent',verifyToken, imageUpload, schoolvalidator.addparentlValidation(), parent.addparent);
router.put('/edit_parent',verifyToken, imageUpload, schoolvalidator.editparentlValidation(), parent.editParent);
router.patch('/change_parent_password',verifyToken,schoolvalidator.changeParentPasswordValidation(), parent.editparentPassword);
router.delete('/delete_parent',verifyToken, parent.deletedParent);
router.get('/get_parent',verifyToken, parent.parentDetails);
router.get('/list_parent',verifyToken, parent.listParent);
router.post('/block_parent',verifyToken, parent.blockParent);



router.post('/add_certification',verifyToken, schoolvalidator.addCertificateValidation(), certificate.addCertificate);
router.put('/edit_certification',verifyToken, schoolvalidator.editCertificateValidation(), certificate.editCertification);
router.get('/get_certification',verifyToken, certificate.getCertificat);
router.get('/list_certification',verifyToken, certificate.listCertificate);
router.delete('/delete_certification',verifyToken, certificate.deleteCertificat);


router.post('/add_medification',verifyToken,schoolvalidator.addMedificationValidation(), medification.addMedication);
router.put('/edit_medification',verifyToken, schoolvalidator.editMedificationValidation(), medification.editMedication);
router.get('/get_medification',verifyToken, medification.getMedication);
router.get('/list_medification',verifyToken, medification.listMedication);
router.delete('/delete_medification',verifyToken, medification.deleteMedication);
router.get('/list_students',verifyToken, medification.listStudent);
router.get('/list_students',verifyToken, medification.listStudent);



router.post('/add_event',verifyToken,schoolvalidator.addEventValidation(), event.createEvent);
router.put('/edit_event',verifyToken, schoolvalidator.editEventValidation(), event.editEvent);
router.get('/get_event',verifyToken, event.getEvent);
router.get('/list_event',verifyToken, event.listEvent);
router.delete('/delete_event',verifyToken, event.deleteEvent);


router.post('/add_sleep_loag',verifyToken,schoolvalidator.addSleepLoagValidation(), sleep_loag.addSleepLog);
router.put('/edit_sleep_loag',verifyToken, schoolvalidator.editSleepLoagValidation(), sleep_loag.editSleepLog);
router.get('/get_sleep_loag',verifyToken, sleep_loag.getSleepLog);
router.get('/list_sleep_loag',verifyToken, sleep_loag.listSleepLog);


router.post('/add_menu',verifyToken,schoolvalidator.addMenuValidation(), menu.addMenu);
router.put('/edit_menu',verifyToken, schoolvalidator.editMenuValidation(), menu.editMenu);
router.get('/get_menu',verifyToken, menu.getMenu);
router.get('/list_menu',verifyToken, menu.listMenu);
router.delete('/delete_menu',verifyToken, menu.deleteMenu);
router.get('/get_all_student',verifyToken, menu.listStudent);

router.get('/get_attedance_count',verifyToken,schoolvalidator.getAttedanceCountValidation(), principal.getAttedanceCount);



module.exports = router;