const express = require('express');
const router = express.Router();

const {verifyToken} = require('../middleware/verifyToken');
const {upload} = require("../helpers/storage")

const imageUpload = upload.fields([
  { name: 'profile_pic' },
]);


const parent = require("../controller/parent/homeController")
const student = require("../controller/parent/studentController")

router.post('/add_student',verifyToken, student.createStudent);
router.put('/edit_student',verifyToken, student.editStudent);
router.delete('/delete_student',verifyToken, student.delteStudent);

