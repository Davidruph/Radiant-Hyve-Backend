const express = require('express');
const router = express.Router();

const {verifyToken} = require('../middleware/verifyToken');

const school = require('../controller/superAdmin/schoolController');


router.post('/add_school',verifyToken, school.addSchool);
router.put('/edit_school',verifyToken, school.editSchool);
router.patch('/change_school_password',verifyToken, school.changeSchoolPassword);
router.delete('/delete_school',verifyToken, school.deleteSchool);
router.get('/get_school',verifyToken, school.getSchoolById);


router.get('/list_school',verifyToken, school.listSchool);





module.exports = router;