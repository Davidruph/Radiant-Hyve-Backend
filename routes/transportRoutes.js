const express = require("express");
const router = express.Router();
const {
  addVehicle,
  getVehicles,
  updateVehicle,
  assignDriverToVehicle,
  createRoute,
  getRoutes,
  startRoute,
  updatePickupStatus,
  completeDropoff,
  endRoute,
  addDropoffRecipient,
  getTransportLogs,
  getTransportExceptions,
  resolveException
} = require("../controller/schoolAdmin/transportController");
const { verifyToken } = require("../middleware/verifyToken");

/**
 * VEHICLE ROUTES
 */
router.post("/vehicle/add", verifyToken, addVehicle);
router.get("/vehicle/list", verifyToken, getVehicles);
router.put("/vehicle/update/:vehicle_id", verifyToken, updateVehicle);
router.post("/vehicle/assign-driver", verifyToken, assignDriverToVehicle);

/**
 * ROUTE MANAGEMENT
 */
router.post("/route/create", verifyToken, createRoute);
router.get("/route/list", verifyToken, getRoutes);

/**
 * ROUTE EXECUTION - DRIVER WORKFLOW
 */
router.post("/route/start", verifyToken, startRoute);
router.put("/route/pickup/update", verifyToken, updatePickupStatus);
router.post("/route/dropoff/complete", verifyToken, completeDropoff);
router.post("/route/end", verifyToken, endRoute);

/**
 * DROP-OFF RECIPIENTS
 */
router.post("/recipient/add", verifyToken, addDropoffRecipient);

/**
 * LOGS & EXCEPTIONS
 */
router.get("/logs", verifyToken, getTransportLogs);
router.get("/exceptions", verifyToken, getTransportExceptions);
router.put("/exceptions/resolve/:exception_id", verifyToken, resolveException);

module.exports = router;
