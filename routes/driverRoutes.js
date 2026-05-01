const express = require("express");
const router = express.Router();
const {
  getAssignedRoutes,
  getActiveRoute,
  startRoute,
  updatePickupStatus,
  completeDropoff,
  endRoute,
  updateDriverLocation
} = require("../controller/driver/driverController");
const { verifyToken } = require("../middleware/verifyToken");

/**
 * ROUTE EXECUTION - DRIVER WORKFLOW
 */
router.get("/api/driver/routes", verifyToken, getAssignedRoutes);
router.get("/api/driver/route/active", verifyToken, getActiveRoute);
router.post("/api/driver/route/start", verifyToken, startRoute);
router.put("/api/driver/route/pickup/update", verifyToken, updatePickupStatus);
router.post("/api/driver/route/dropoff/complete", verifyToken, completeDropoff);
router.post("/api/driver/route/end", verifyToken, endRoute);
router.post("/api/driver/route/location", verifyToken, updateDriverLocation);

module.exports = router;
