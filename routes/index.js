const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const superAdminRoutes = require('./superAdminRoutes');
const schoolAdminRoutes = require('./schoolAdminRoutes');


// Use the user routes
router.use(authRoutes)
router.use(superAdminRoutes)
router.use(schoolAdminRoutes)


module.exports = router; // Export router (not app)

