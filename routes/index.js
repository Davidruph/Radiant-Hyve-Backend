const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const schoolRoutes = require('./schoolRoutes');

// Use the user routes
router.use(authRoutes)
router.use(schoolRoutes)

module.exports = router; // Export router (not app)

