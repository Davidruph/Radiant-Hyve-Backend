const express = require("express");
const router = express.Router();
const {
  getAssignedRoutes,
  startRoute,
  updatePickupStatus,
  completeDropoff,
  endRoute
} = require("../controller/driver/driverController");
const { verifyToken } = require("../middleware/verifyToken");

/**
 * ROUTE EXECUTION - DRIVER WORKFLOW
 */
router.get("/api/driver/routes", verifyToken, getAssignedRoutes);
router.post("/api/driver/route/start", verifyToken, startRoute);
router.put("/api/driver/route/pickup/update", verifyToken, updatePickupStatus);
router.post("/api/driver/route/dropoff/complete", verifyToken, completeDropoff);
router.post("/api/driver/route/end", verifyToken, endRoute);

module.exports = router;
