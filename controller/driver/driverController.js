require("dotenv").config();
const db = require("../../config/db");
const { Op, Sequelize } = require("sequelize");
const moment = require("moment");

/**
 * Get routes assigned to driver
 */
const getAssignedRoutes = async (req, res) => {
  if (req.user.role !== "driver") {
    return res.status(403).json({
      status: 0,
      message: "You are not authorized to perform this action"
    });
  }

  try {
    const driver_id = req.user.id;
    const { page = 1, status, date } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    const where = { driver_id, is_deleted: false };

    if (status) {
      where.status = status;
    }

    if (date) {
      const startOfDay = moment(date).startOf("day").toDate();
      const endOfDay = moment(date).endOf("day").toDate();
      where.scheduled_start_time = {
        [Op.between]: [startOfDay, endOfDay]
      };
    }

    const { count, rows } = await db.Route.findAndCountAll({
      where,
      include: [
        { model: db.Vehicle, as: "vehicle" },
        {
          model: db.User,
          as: "driver",
          attributes: ["id", "full_name", "email"]
        },
        {
          model: db.RouteStop,
          as: "stops",
          attributes: ["id", "stop_sequence", "stop_name", "status"]
        },
        {
          model: db.StudentTransport,
          as: "students",
          include: [
            {
              model: db.Student,
              as: "student",
              attributes: ["id", "full_name"]
            }
          ],
          attributes: [
            "id",
            "student_id",
            "pickup_status",
            "current_status",
            "sequence_position"
          ]
        }
      ],
      limit,
      offset,
      order: [["scheduled_start_time", "DESC"]]
    });

    return res.status(200).json({
      status: 1,
      message: "Routes retrieved successfully",
      data: rows,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error("Get Assigned Routes Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Start route - Driver initiates the route and activates tracking
 * STRICT REQUIREMENT: All route data must be assigned before starting
 */
const startRoute = async (req, res) => {
  if (req.user.role !== "driver") {
    return res.status(403).json({
      status: 0,
      message: "Only drivers can start routes"
    });
  }

  try {
    const { route_id } = req.body;

    const route = await db.Route.findOne({
      where: { id: route_id, is_deleted: false },
      include: [
        { model: db.RouteStop, as: "stops" },
        { model: db.StudentTransport, as: "students" }
      ]
    });
    console.log(
      "Starting route:",
      route_id,
      "for driver:",
      req.user.id,
      "route.driver_id:",
      route ? route.driver_id : "N/A"
    );

    if (!route) {
      return res.status(404).json({
        status: 0,
        message: "Route not found"
      });
    }

    // Verify driver owns this route
    if (Number(route.driver_id) !== Number(req.user.id)) {
      return res.status(403).json({
        status: 0,
        message: "You are not assigned to this route"
      });
    }

    // STRICT: Verify all required data is present
    if (!route.stops || route.stops.length === 0) {
      return res.status(400).json({
        status: 0,
        message: "Route has no stops assigned. Cannot start route."
      });
    }

    if (!route.students || route.students.length === 0) {
      return res.status(400).json({
        status: 0,
        message: "No students assigned to route. Cannot start route."
      });
    }

    // Start the route
    await route.update({
      status: "active",
      actual_start_time: new Date()
    });

    // Log the route start event
    await db.TransportLog.create({
      route_id: route.id,
      driver_id: req.user.id,
      event_type: "route_started",
      event_description: `Route ${route.route_name} started by driver`,
      additional_data: {
        route_type: route.route_type,
        total_students: route.students.length,
        total_stops: route.stops.length
      }
    });

    // Fetch updated route with all details
    const updatedRoute = await db.Route.findOne({
      where: { id: route_id },
      include: [
        { model: db.Vehicle, as: "vehicle" },
        {
          model: db.RouteStop,
          as: "stops",
          order: [["stop_sequence", "ASC"]]
        },
        {
          model: db.StudentTransport,
          as: "students",
          include: [
            {
              model: db.Student,
              as: "student",
              attributes: ["id", "full_name"]
            }
          ]
        }
      ]
    });

    return res.status(200).json({
      status: 1,
      message: "Route started successfully. Live tracking activated.",
      data: updatedRoute
    });
  } catch (error) {
    console.error("Start Route Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Update pickup status for a student
 */
const updatePickupStatus = async (req, res) => {
  if (req.user.role !== "driver") {
    return res.status(403).json({
      status: 0,
      message: "Only drivers can update pickup status"
    });
  }

  try {
    const {
      student_transport_id,
      pickup_status,
      skip_reason,
      latitude,
      longitude
    } = req.body;

    const studentTransport = await db.StudentTransport.findOne({
      where: { id: student_transport_id, is_deleted: false }
    });

    if (!studentTransport) {
      return res.status(404).json({
        status: 0,
        message: "Student transport record not found"
      });
    }

    // Verify route belongs to driver
    const route = await db.Route.findOne({
      where: { id: studentTransport.route_id, driver_id: req.user.id }
    });

    if (!route) {
      return res.status(403).json({
        status: 0,
        message: "You are not authorized to update this student's status"
      });
    }

    // Update the pickup status
    await studentTransport.update({
      pickup_status,
      skip_reason: skip_reason || null,
      pickup_latitude: latitude || 0,
      pickup_longitude: longitude || 0,
      pickup_timestamp: new Date()
    });

    // Log the pickup event
    await db.TransportLog.create({
      route_id: route.id,
      driver_id: req.user.id,
      event_type: "pickup_completed",
      event_description: `Pickup status updated to ${pickup_status}`,
      additional_data: {
        student_transport_id,
        pickup_status,
        skip_reason: skip_reason || null
      }
    });

    return res.status(200).json({
      status: 1,
      message: "Pickup status updated successfully",
      data: studentTransport
    });
  } catch (error) {
    console.error("Update Pickup Status Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Complete dropoff for a student
 */
const completeDropoff = async (req, res) => {
  if (req.user.role !== "driver") {
    return res.status(403).json({
      status: 0,
      message: "Only drivers can complete dropoffs"
    });
  }

  try {
    const {
      student_transport_id,
      recipient_type,
      recipient_name,
      latitude,
      longitude
    } = req.body;

    const studentTransport = await db.StudentTransport.findOne({
      where: { id: student_transport_id, is_deleted: false }
    });

    if (!studentTransport) {
      return res.status(404).json({
        status: 0,
        message: "Student transport record not found"
      });
    }

    // Verify route belongs to driver
    const route = await db.Route.findOne({
      where: { id: studentTransport.route_id, driver_id: req.user.id }
    });

    if (!route) {
      return res.status(403).json({
        status: 0,
        message: "You are not authorized to update this student's status"
      });
    }

    // Update the dropoff status
    await studentTransport.update({
      current_status: "dropped_off",
      recipient_type,
      recipient_name,
      dropoff_latitude: latitude || 0,
      dropoff_longitude: longitude || 0,
      dropoff_timestamp: new Date()
    });

    // Log the dropoff event
    await db.TransportLog.create({
      route_id: route.id,
      driver_id: req.user.id,
      event_type: "dropoff_completed",
      event_description: `Dropoff completed for student`,
      additional_data: {
        student_transport_id,
        recipient_type,
        recipient_name
      }
    });

    return res.status(200).json({
      status: 1,
      message: "Dropoff completed successfully",
      data: studentTransport
    });
  } catch (error) {
    console.error("Complete Dropoff Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * End route - Driver marks route as completed
 */
const endRoute = async (req, res) => {
  if (req.user.role !== "driver") {
    return res.status(403).json({
      status: 0,
      message: "Only drivers can end routes"
    });
  }

  try {
    const { route_id } = req.body;

    const route = await db.Route.findOne({
      where: { id: route_id, is_deleted: false },
      include: [{ model: db.StudentTransport, as: "students" }]
    });

    if (!route) {
      return res.status(404).json({
        status: 0,
        message: "Route not found"
      });
    }

    // Verify driver owns this route
    if (Number(route.driver_id) !== Number(req.user.id)) {
      return res.status(403).json({
        status: 0,
        message: "You are not assigned to this route"
      });
    }

    // End the route
    await route.update({
      status: "completed",
      actual_end_time: new Date()
    });

    // Log the route end event
    await db.TransportLog.create({
      route_id: route.id,
      driver_id: req.user.id,
      event_type: "route_ended",
      event_description: `Route ${route.route_name} ended by driver`,
      additional_data: {
        total_students: route.students.length
      }
    });

    return res.status(200).json({
      status: 1,
      message: "Route ended successfully",
      data: route
    });
  } catch (error) {
    console.error("End Route Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  getAssignedRoutes,
  startRoute,
  updatePickupStatus,
  completeDropoff,
  endRoute
};
