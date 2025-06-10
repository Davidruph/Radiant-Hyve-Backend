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




module.exports = router;