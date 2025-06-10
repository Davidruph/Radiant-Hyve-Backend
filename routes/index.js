const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const superAdminRoutes = require('./superAdminRoutes');
const schoolAdminRoutes = require('./schoolAdminRoutes');
const teacherRoutes = require('./teacherRoutes');
const principalRoutes = require('./principalRouts');




// Use the user routes
router.use(authRoutes)
router.use(superAdminRoutes)
router.use(schoolAdminRoutes)
router.use(teacherRoutes)
router.use(principalRoutes)




module.exports = router; // Export router (not app)

