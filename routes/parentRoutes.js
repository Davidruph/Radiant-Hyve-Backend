const express = require('express');
const router = express.Router();

const {verifyToken} = require('../middleware/verifyToken');
const {upload} = require("../helpers/storage")

const imageUpload = upload.fields([
  { name: 'profile_pic' },
]);


const parent = require("../controller/parent/homeController")
const student = require("../controller/parent/studentController")
const validation = require("../validator/parentValidator")

router.post('/add_student',verifyToken,imageUpload, validation.addStudentlValidation(), student.createStudent);
router.put('/edit_student',verifyToken, imageUpload, validation.editStudentlValidation(),  student.editStudent);
router.delete('/delete_student',verifyToken, student.delteStudent);

router.get('/list_active_student',verifyToken, parent.listActiveStudent);
router.get('/students_details',verifyToken,validation.studentDetailsValidation(), parent.studentDetails);
router.get('/student_get',verifyToken, parent.getStudent);
router.get('/students_list',verifyToken, parent.listStudent);

router.put('/edit_profile_parent',verifyToken, imageUpload, validation.editparentlValidation(),  parent.editProfile);

router.get('/list_student_attedance_parent',verifyToken, parent.getStudentAttedance);

router.get('/list_student_invoice',verifyToken, student.listStudentFees);
router.get('/list_student_fees',verifyToken, student.listStudent);


module.exports = router; 
