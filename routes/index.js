const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const superAdminRoutes = require("./superAdminRoutes");
const schoolAdminRoutes = require("./schoolAdminRoutes");
const teacherRoutes = require("./teacherRoutes");
const principalRoutes = require("./principalRouts");
const parentlRoutes = require("./parentRoutes");
const chatRoutes = require("./chatRoutes");
const transportRoutes = require("./transportRoutes");
const driverRoutes = require("./driverRoutes");

// Use the user routes
router.use(authRoutes);
router.use(superAdminRoutes);
router.use(schoolAdminRoutes);
router.use(teacherRoutes);
router.use(principalRoutes);
router.use(parentlRoutes);
router.use(chatRoutes);
router.use("/api/transport", transportRoutes);
router.use(driverRoutes);

module.exports = router; // Export router (not app)
