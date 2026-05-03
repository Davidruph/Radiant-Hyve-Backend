require("dotenv").config();
const db = require("../../config/db");
const { Op, Sequelize } = require("sequelize");
const moment = require("moment");

// =====================================================
// VEHICLE MANAGEMENT
// =====================================================

/**
 * Create a new vehicle
 */
const addVehicle = async (req, res) => {
  if (req.user.role !== "school" && req.user.role !== "principal") {
    return res.status(403).json({
      status: 0,
      message: "You are not authorized to perform this action"
    });
  }

  try {
    const {
      vehicle_name,
      registration_plate,
      vehicle_type,
      capacity,
      color,
      year_of_manufacture,
      insurance_expiry
    } = req.body;

    let school_id = req.user.id;
    if (req.user.role === "principal") {
      const principal = await db.User.findOne({
        where: { id: req.user.id, is_deleted: false }
      });
      school_id = principal.school_id;
    }

    const existingPlate = await db.Vehicle.findOne({
      where: { registration_plate, is_deleted: false }
    });

    if (existingPlate) {
      return res.status(409).json({
        status: 0,
        message: "Vehicle with this registration plate already exists"
      });
    }

    const vehicle = await db.Vehicle.create({
      school_id,
      vehicle_name,
      registration_plate,
      vehicle_type: vehicle_type || "bus",
      capacity,
      color,
      year_of_manufacture,
      insurance_expiry: insurance_expiry ? new Date(insurance_expiry) : null,
      status: "active"
    });

    return res.status(201).json({
      status: 1,
      message: "Vehicle created successfully",
      data: vehicle
    });
  } catch (error) {
    console.error("Add Vehicle Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Get all vehicles for a school
 */
const getVehicles = async (req, res) => {
  if (req.user.role !== "school" && req.user.role !== "principal") {
    return res.status(403).json({
      status: 0,
      message: "You are not authorized to perform this action"
    });
  }

  try {
    let school_id = req.user.id;
    if (req.user.role === "principal") {
      const principal = await db.User.findOne({
        where: { id: req.user.id, is_deleted: false }
      });
      school_id = principal.school_id;
    }

    const { page = 1, search = "" } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await db.Vehicle.findAndCountAll({
      where: {
        school_id,
        is_deleted: false,
        [Op.or]: [
          { vehicle_name: { [Op.like]: `%${search}%` } },
          { registration_plate: { [Op.like]: `%${search}%` } }
        ]
      },
      include: [
        {
          model: db.User,
          as: "driver",
          attributes: ["id", "full_name", "email", "mobile_no"]
        }
      ],
      limit,
      offset,
      order: [["created_at", "DESC"]]
    });

    return res.status(200).json({
      status: 1,
      message: "Vehicles retrieved successfully",
      data: rows,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error("Get Vehicles Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Update vehicle details
 */
const updateVehicle = async (req, res) => {
  if (req.user.role !== "school" && req.user.role !== "principal") {
    return res.status(403).json({
      status: 0,
      message: "You are not authorized to perform this action"
    });
  }

  try {
    const { vehicle_id } = req.params;
    const updateData = req.body;

    const vehicle = await db.Vehicle.findOne({
      where: { id: vehicle_id, is_deleted: false }
    });

    if (!vehicle) {
      return res.status(404).json({
        status: 0,
        message: "Vehicle not found"
      });
    }

    await vehicle.update(updateData);

    return res.status(200).json({
      status: 1,
      message: "Vehicle updated successfully",
      data: vehicle
    });
  } catch (error) {
    console.error("Update Vehicle Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Assign driver to vehicle
 */
const assignDriverToVehicle = async (req, res) => {
  if (req.user.role !== "school" && req.user.role !== "principal") {
    return res.status(403).json({
      status: 0,
      message: "You are not authorized to perform this action"
    });
  }

  try {
    const { vehicle_id, driver_id } = req.body;

    const vehicle = await db.Vehicle.findOne({
      where: { id: vehicle_id, is_deleted: false }
    });

    if (!vehicle) {
      return res.status(404).json({
        status: 0,
        message: "Vehicle not found"
      });
    }

    const driver = await db.User.findOne({
      where: { id: driver_id, role: "driver", is_deleted: false }
    });

    if (!driver) {
      return res.status(404).json({
        status: 0,
        message: "Driver not found"
      });
    }

    await vehicle.update({ driver_id });

    return res.status(200).json({
      status: 1,
      message: "Driver assigned successfully",
      data: vehicle
    });
  } catch (error) {
    console.error("Assign Driver Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

// =====================================================
// ROUTE MANAGEMENT
// =====================================================

/**
 * Create a route with stops and student assignments
 */
const createRoute = async (req, res) => {
  if (req.user.role !== "school" && req.user.role !== "principal") {
    return res.status(403).json({
      status: 0,
      message: "You are not authorized to perform this action"
    });
  }

  try {
    const {
      vehicle_id,
      driver_id,
      route_name,
      route_type,
      scheduled_start_time,
      scheduled_end_time,
      stops,
      student_assignments
    } = req.body;

    let school_id = req.user.id;
    if (req.user.role === "principal") {
      const principal = await db.User.findOne({
        where: { id: req.user.id, is_deleted: false }
      });
      school_id = principal.school_id;
    }

    // Validate vehicle exists
    const vehicle = await db.Vehicle.findOne({
      where: { id: vehicle_id, is_deleted: false }
    });

    if (!vehicle) {
      return res.status(404).json({
        status: 0,
        message: "Vehicle not found"
      });
    }

    if (vehicle.status !== "active") {
      return res.status(400).json({
        status: 0,
        message: `Vehicle "${vehicle.vehicle_name}" is not available (status: ${vehicle.status}). Only active vehicles can be assigned to routes.`
      });
    }

    // Enforce vehicle capacity
    if (
      student_assignments &&
      vehicle.capacity &&
      student_assignments.length > vehicle.capacity
    ) {
      return res.status(400).json({
        status: 0,
        message: `Too many students. ${vehicle.vehicle_name} has a capacity of ${vehicle.capacity} but ${student_assignments.length} students were assigned.`
      });
    }

    // Reject routes scheduled in the past
    const startTime = new Date(scheduled_start_time);
    if (startTime < new Date()) {
      return res.status(400).json({
        status: 0,
        message: "Scheduled start time must be in the future"
      });
    }

    // Validate stop arrival times are in chronological order when provided
    if (stops && stops.length > 1) {
      const stopTimes = stops
        .map((s, i) => ({ idx: i, time: s.scheduled_arrival_time ? new Date(s.scheduled_arrival_time) : null }))
        .filter((s) => s.time !== null);

      for (let i = 1; i < stopTimes.length; i++) {
        if (stopTimes[i].time <= stopTimes[i - 1].time) {
          return res.status(400).json({
            status: 0,
            message: `Stop arrival times must be in chronological order. Stop ${stopTimes[i].idx + 1} is not after stop ${stopTimes[i - 1].idx + 1}.`
          });
        }
      }
    }

    // Validate driver exists
    const driver = await db.User.findOne({
      where: { id: driver_id, role: "driver", is_deleted: false }
    });

    if (!driver) {
      return res.status(404).json({
        status: 0,
        message: "Driver not found"
      });
    }

    // Create route
    const route = await db.Route.create({
      school_id,
      vehicle_id,
      driver_id,
      route_name,
      route_type: route_type || "round_trip",
      scheduled_start_time: new Date(scheduled_start_time),
      scheduled_end_time: scheduled_end_time
        ? new Date(scheduled_end_time)
        : null,
      status: "scheduled"
    });

    // Create route stops and capture their generated UUIDs so student
    // assignments can reference them. The frontend sends temp IDs like
    // "stop_0", "stop_1" which map to the creation order index.
    const stopIndexToUUID = {};

    if (stops && stops.length > 0) {
      const routeStops = stops.map((stop, index) => ({
        route_id: route.id,
        stop_sequence: index + 1,
        stop_name: stop.stop_name,
        latitude: stop.latitude || null,
        longitude: stop.longitude || null,
        address: stop.address || null,
        stop_type: stop.stop_type,
        scheduled_arrival_time: stop.scheduled_arrival_time
          ? new Date(stop.scheduled_arrival_time)
          : null,
        status: "pending"
      }));

      // UUID PKs are generated client-side by Sequelize, so bulkCreate
      // returns instances with their IDs populated.
      const createdStops = await db.RouteStop.bulkCreate(routeStops);
      createdStops.forEach((stop, index) => {
        stopIndexToUUID[`stop_${index}`] = stop.id;
      });
    }

    // Create student transport assignments
    if (student_assignments && student_assignments.length > 0) {
      const invalidAssignments = student_assignments.filter(
        (a) => !a.student_id || !a.route_stop_id
      );
      if (invalidAssignments.length > 0) {
        await route.destroy();
        return res.status(400).json({
          status: 0,
          message: "Each student assignment must have a student and a stop selected"
        });
      }

      // Prevent duplicate students on the same route
      const studentIds = student_assignments.map((a) => a.student_id);
      const uniqueStudentIds = new Set(studentIds);
      if (uniqueStudentIds.size !== studentIds.length) {
        await route.destroy();
        return res.status(400).json({
          status: 0,
          message: "A student cannot be assigned to the same route more than once"
        });
      }

      const assignments = student_assignments.map((assignment) => {
        // Resolve temp stop ID (e.g. "stop_0") to the real UUID
        const resolvedStopId =
          stopIndexToUUID[assignment.route_stop_id] || assignment.route_stop_id;

        return {
          route_id: route.id,
          student_id: assignment.student_id,
          route_stop_id: resolvedStopId,
          pickup_status: "pending_pickup",
          current_status: "pending",
          dropoff_status: "pending",
          sequence_position: assignment.sequence_position || 1
        };
      });

      await db.StudentTransport.bulkCreate(assignments);
    }

    // Fetch complete route with relationships
    const completeRoute = await db.Route.findOne({
      where: { id: route.id },
      include: [
        { model: db.Vehicle, as: "vehicle" },
        {
          model: db.User,
          as: "driver",
          attributes: ["id", "full_name", "email"]
        },
        { model: db.RouteStop, as: "stops" },
        {
          model: db.StudentTransport,
          as: "students",
          include: [
            { model: db.Student, as: "student" },
            { model: db.RouteStop, as: "stop" }
          ]
        }
      ]
    });

    // Notify the assigned driver in real time so their route list updates immediately
    const { emitToSockets } = require("../../config/socketConfig");
    emitToSockets(driver_id, "transport:route_assigned", {
      route: completeRoute
    }).catch(() => {});

    return res.status(201).json({
      status: 1,
      message: "Route created successfully",
      data: completeRoute
    });
  } catch (error) {
    console.error("Create Route Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Get routes with filters
 */
const getRoutes = async (req, res) => {
  if (req.user.role !== "school" && req.user.role !== "principal") {
    return res.status(403).json({
      status: 0,
      message: "You are not authorized to perform this action"
    });
  }

  try {
    let school_id = req.user.id;
    if (req.user.role === "principal") {
      const principal = await db.User.findOne({
        where: { id: req.user.id, is_deleted: false }
      });
      school_id = principal.school_id;
    }

    const { page = 1, status, date } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    const where = { school_id, is_deleted: false };

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
          attributes: [
            "id",
            "student_id",
            "pickup_status",
            "current_status",
            "sequence_position"
          ],
          include: [
            {
              model: db.Student,
              as: "student",
              attributes: ["id", "full_name"]
            }
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
    console.error("Get Routes Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

// =====================================================
// ROUTE EXECUTION - DRIVER WORKFLOW
// =====================================================

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

    if (!route) {
      return res.status(404).json({
        status: 0,
        message: "Route not found"
      });
    }

    // Verify driver owns this route
    if (route.driver_id !== req.user.id) {
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

    return res.status(200).json({
      status: 1,
      message: "Route started successfully",
      data: route
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
 * Update student pickup status
 * STRICT: Must be one of: picked_up, absent, skipped (with reason)
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

    if (!["picked_up", "absent", "skipped"].includes(pickup_status)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid pickup status"
      });
    }

    if (pickup_status === "skipped" && !skip_reason) {
      return res.status(400).json({
        status: 0,
        message: "Skip reason is required when skipping a student"
      });
    }

    const studentTransport = await db.StudentTransport.findOne({
      where: { id: student_transport_id, is_deleted: false },
      include: [{ model: db.Route, as: "route" }]
    });

    if (!studentTransport) {
      return res.status(404).json({
        status: 0,
        message: "Student assignment not found"
      });
    }

    // Verify driver is assigned to this route
    if (studentTransport.route.driver_id !== req.user.id) {
      return res.status(403).json({
        status: 0,
        message: "You are not assigned to this route"
      });
    }

    // Update the status
    const updateData = {
      pickup_status,
      pickup_latitude: latitude,
      pickup_longitude: longitude
    };

    if (pickup_status === "picked_up") {
      updateData.pickup_timestamp = new Date();
      updateData.current_status = "in_vehicle";
    } else if (pickup_status === "skipped") {
      updateData.skip_reason = skip_reason;
    }

    await studentTransport.update(updateData);

    // Log this event
    await db.TransportLog.create({
      route_id: studentTransport.route_id,
      student_id: studentTransport.student_id,
      driver_id: req.user.id,
      event_type: `pickup_${pickup_status}`,
      event_description: `Student pickup marked as ${pickup_status}`,
      latitude,
      longitude,
      additional_data: {
        skip_reason: skip_reason || null,
        sequence_position: studentTransport.sequence_position
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
 * Complete drop-off for a student
 * STRICT: Must have an authorized recipient
 */
const completeDropoff = async (req, res) => {
  if (req.user.role !== "driver") {
    return res.status(403).json({
      status: 0,
      message: "Only drivers can complete drop-offs"
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

    if (!["parent", "authorized_person"].includes(recipient_type)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid recipient type"
      });
    }

    const studentTransport = await db.StudentTransport.findOne({
      where: { id: student_transport_id, is_deleted: false },
      include: [{ model: db.Route, as: "route" }]
    });

    if (!studentTransport) {
      return res.status(404).json({
        status: 0,
        message: "Student assignment not found"
      });
    }

    // Verify driver is assigned to this route
    if (studentTransport.route.driver_id !== req.user.id) {
      return res.status(403).json({
        status: 0,
        message: "You are not assigned to this route"
      });
    }

    // STRICT: Student must be in vehicle
    if (studentTransport.current_status !== "in_vehicle") {
      return res.status(400).json({
        status: 0,
        message: "Student is not in vehicle. Cannot drop off."
      });
    }

    // Check if there's an authorized recipient for this student
    const authorizedRecipient = await db.DropOffRecipient.findOne({
      where: {
        student_id: studentTransport.student_id,
        recipient_type,
        is_active: true,
        is_deleted: false
      }
    });

    if (!authorizedRecipient && recipient_type === "authorized_person") {
      // Log exception
      await db.TransportException.create({
        route_id: studentTransport.route_id,
        student_id: studentTransport.student_id,
        exception_type: "no_authorized_recipient",
        severity: "high",
        description: `No authorized recipient found for dropoff. Driver provided: ${recipient_name}`,
        status: "open"
      });

      return res.status(400).json({
        status: 0,
        message: "No authorized recipient found. Exception logged.",
        requiresException: true
      });
    }

    // Complete drop-off
    await studentTransport.update({
      current_status: "dropped_off",
      dropoff_status: "completed",
      dropoff_timestamp: new Date(),
      dropoff_latitude: latitude,
      dropoff_longitude: longitude
    });

    // Log this event
    await db.TransportLog.create({
      route_id: studentTransport.route_id,
      student_id: studentTransport.student_id,
      driver_id: req.user.id,
      event_type: "dropoff_completed",
      event_description: `Student dropped off to ${recipient_type}`,
      latitude,
      longitude,
      additional_data: {
        recipient_type,
        recipient_name,
        authorized: !!authorizedRecipient
      }
    });

    return res.status(200).json({
      status: 1,
      message: "Drop-off completed successfully",
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
 * End route - MANDATORY SAFETY CHECK
 * STRICT: Driver must confirm vehicle has been checked and no student remains
 * STRICT: All students must have final status (dropped_off, absent, or exception)
 */
const endRoute = async (req, res) => {
  if (req.user.role !== "driver") {
    return res.status(403).json({
      status: 0,
      message: "Only drivers can end routes"
    });
  }

  try {
    const { route_id, vehicle_check_confirmed } = req.body;

    if (!vehicle_check_confirmed) {
      return res.status(400).json({
        status: 0,
        message: "Driver must confirm vehicle has been physically checked",
        requiresCheck: true
      });
    }

    const route = await db.Route.findOne({
      where: { id: route_id, is_deleted: false },
      include: [
        {
          model: db.StudentTransport,
          as: "students",
          attributes: ["id", "current_status", "pickup_status"]
        }
      ]
    });

    if (!route) {
      return res.status(404).json({
        status: 0,
        message: "Route not found"
      });
    }

    // Verify driver is assigned to this route
    if (route.driver_id !== req.user.id) {
      return res.status(403).json({
        status: 0,
        message: "You are not assigned to this route"
      });
    }

    // STRICT: Check all students have final status
    const unaccountedStudents = route.students.filter(
      (st) =>
        !["dropped_off", "absent", "exception"].includes(st.current_status)
    );

    if (unaccountedStudents.length > 0) {
      return res.status(400).json({
        status: 0,
        message: `Cannot end route. ${unaccountedStudents.length} student(s) not accounted for`,
        unaccountedStudents: unaccountedStudents.map((st) => ({
          id: st.id,
          current_status: st.current_status
        }))
      });
    }

    // End the route
    await route.update({
      status: "completed",
      actual_end_time: new Date(),
      final_vehicle_check_confirmed: true,
      final_check_timestamp: new Date()
    });

    // Log the route end event with safety check
    await db.TransportLog.create({
      route_id: route.id,
      driver_id: req.user.id,
      event_type: "final_check",
      event_description:
        "Route ended with mandatory vehicle safety check confirmed",
      additional_data: {
        vehicle_physically_checked: true,
        no_students_remaining: true,
        total_students_processed: route.students.length
      }
    });

    return res.status(200).json({
      status: 1,
      message: "Route ended successfully with safety check confirmed",
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

// =====================================================
// ADMIN MANUAL OVERRIDE
// Used when driver loses connectivity and admin must act
// =====================================================

/**
 * Admin manually overrides a student's pickup status on an active route.
 * Logs the override with admin identity so the audit trail is clear.
 */
const adminOverridePickup = async (req, res) => {
  if (req.user.role !== "school" && req.user.role !== "principal") {
    return res.status(403).json({
      status: 0,
      message: "Only school admins can perform manual overrides"
    });
  }

  try {
    const { student_transport_id, pickup_status, skip_reason } = req.body;

    const validStatuses = ["picked_up", "absent", "skipped"];
    if (!validStatuses.includes(pickup_status)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid pickup status"
      });
    }

    let school_id = req.user.id;
    if (req.user.role === "principal") {
      const principal = await db.User.findOne({
        where: { id: req.user.id, is_deleted: false }
      });
      school_id = principal?.school_id || req.user.id;
    }

    const studentTransport = await db.StudentTransport.findOne({
      where: { id: student_transport_id, is_deleted: false }
    });

    if (!studentTransport) {
      return res.status(404).json({ status: 0, message: "Student transport record not found" });
    }

    const route = await db.Route.findOne({
      where: {
        id: studentTransport.route_id,
        school_id,
        status: "active",
        is_deleted: false
      }
    });

    if (!route) {
      return res.status(404).json({ status: 0, message: "Active route not found for this school" });
    }

    const newCurrentStatus =
      pickup_status === "picked_up" ? "in_vehicle" : "pending";

    await studentTransport.update({
      pickup_status,
      current_status: newCurrentStatus,
      skip_reason: skip_reason || null,
      pickup_timestamp: new Date()
    });

    // Mark the RouteStop status
    const stopStudents = await db.StudentTransport.findAll({
      where: { route_id: route.id, route_stop_id: studentTransport.route_stop_id, is_deleted: false },
      attributes: ["pickup_status"]
    });
    const pendingAtStop = stopStudents.filter(s => s.pickup_status === "pending_pickup").length;
    const newStopStatus = pendingAtStop === stopStudents.length ? "pending" : pendingAtStop === 0 ? "completed" : "in_progress";
    await db.RouteStop.update({ status: newStopStatus }, { where: { id: studentTransport.route_stop_id } });

    await db.TransportLog.create({
      route_id: route.id,
      driver_id: route.driver_id,
      student_id: studentTransport.student_id,
      event_type: pickup_status === "picked_up" ? "pickup_completed" : pickup_status === "absent" ? "pickup_absent" : "pickup_skipped",
      event_description: `[ADMIN OVERRIDE by ${req.user.id}] Student pickup status set to ${pickup_status}`,
      additional_data: { overridden_by: req.user.id, pickup_status, skip_reason: skip_reason || null }
    });

    // Emit real-time update to admin dashboard
    const { emitToSockets } = require("../../config/socketConfig");
    emitToSockets(school_id, "transport:student_update", {
      route_id: route.id,
      student_transport_id: studentTransport.id,
      student_id: studentTransport.student_id,
      pickup_status,
      current_status: newCurrentStatus,
      stop_id: studentTransport.route_stop_id,
      stop_status: newStopStatus
    }).catch(() => {});

    return res.status(200).json({
      status: 1,
      message: "Student pickup status overridden successfully",
      data: studentTransport
    });
  } catch (error) {
    console.error("Admin Override Pickup Error:", error);
    return res.status(500).json({ status: 0, message: "Internal server error", error: error.message });
  }
};

/**
 * Admin manually marks a student as dropped off.
 */
const adminOverrideDropoff = async (req, res) => {
  if (req.user.role !== "school" && req.user.role !== "principal") {
    return res.status(403).json({
      status: 0,
      message: "Only school admins can perform manual overrides"
    });
  }

  try {
    const { student_transport_id, recipient_type, recipient_name } = req.body;

    if (!recipient_type || !recipient_name) {
      return res.status(400).json({ status: 0, message: "Recipient type and name are required" });
    }

    let school_id = req.user.id;
    if (req.user.role === "principal") {
      const principal = await db.User.findOne({ where: { id: req.user.id, is_deleted: false } });
      school_id = principal?.school_id || req.user.id;
    }

    const studentTransport = await db.StudentTransport.findOne({
      where: { id: student_transport_id, is_deleted: false }
    });

    if (!studentTransport) {
      return res.status(404).json({ status: 0, message: "Student transport record not found" });
    }

    if (studentTransport.pickup_status !== "picked_up") {
      return res.status(400).json({ status: 0, message: "Cannot drop off a student who was not picked up" });
    }

    const route = await db.Route.findOne({
      where: { id: studentTransport.route_id, school_id, status: "active", is_deleted: false }
    });

    if (!route) {
      return res.status(404).json({ status: 0, message: "Active route not found" });
    }

    await studentTransport.update({
      current_status: "dropped_off",
      dropoff_status: "completed",
      dropoff_recipient_type: recipient_type,
      dropoff_recipient_name: recipient_name,
      dropoff_timestamp: new Date()
    });

    await db.TransportLog.create({
      route_id: route.id,
      driver_id: route.driver_id,
      student_id: studentTransport.student_id,
      event_type: "dropoff_completed",
      event_description: `[ADMIN OVERRIDE by ${req.user.id}] Student dropped off to ${recipient_type}`,
      additional_data: { overridden_by: req.user.id, recipient_type, recipient_name }
    });

    const { emitToSockets } = require("../../config/socketConfig");
    emitToSockets(school_id, "transport:student_update", {
      route_id: route.id,
      student_transport_id: studentTransport.id,
      student_id: studentTransport.student_id,
      current_status: "dropped_off",
      dropoff_status: "completed"
    }).catch(() => {});

    return res.status(200).json({
      status: 1,
      message: "Student dropoff overridden successfully",
      data: studentTransport
    });
  } catch (error) {
    console.error("Admin Override Dropoff Error:", error);
    return res.status(500).json({ status: 0, message: "Internal server error", error: error.message });
  }
};

// =====================================================
// DROP-OFF RECIPIENT MANAGEMENT
// =====================================================

/**
 * Add authorized drop-off recipient for a student
 */
const addDropoffRecipient = async (req, res) => {
  if (
    req.user.role !== "school" &&
    req.user.role !== "principal" &&
    req.user.role !== "parent"
  ) {
    return res.status(403).json({
      status: 0,
      message: "You are not authorized to perform this action"
    });
  }

  try {
    const {
      student_id,
      recipient_type,
      recipient_name,
      recipient_phone,
      relationship_to_student,
      is_primary
    } = req.body;

    let school_id = req.user.id;
    if (req.user.role === "principal") {
      const principal = await db.User.findOne({
        where: { id: req.user.id, is_deleted: false }
      });
      school_id = principal.school_id;
    } else if (req.user.role === "parent") {
      // Parent can only add recipients for their own children
      const student = await db.Student.findOne({
        where: { id: student_id, parent_id: req.user.id }
      });
      if (!student) {
        return res.status(403).json({
          status: 0,
          message: "You can only add recipients for your own children"
        });
      }
      // Get school_id from student
      school_id = student.school_id;
    }

    const recipient = await db.DropOffRecipient.create({
      student_id,
      school_id,
      recipient_type,
      recipient_name,
      recipient_phone,
      relationship_to_student,
      is_primary: is_primary || false,
      is_active: true
    });

    return res.status(201).json({
      status: 1,
      message: "Drop-off recipient added successfully",
      data: recipient
    });
  } catch (error) {
    console.error("Add Dropoff Recipient Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Get authorized drop-off recipients for a student (or all for this school)
 */
const getDropoffRecipients = async (req, res) => {
  const allowedRoles = ["school", "principal", "parent"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      status: 0,
      message: "You are not authorized to view recipients"
    });
  }

  try {
    const { student_id } = req.query;

    let school_id = req.user.id;
    if (req.user.role === "principal") {
      const principal = await db.User.findOne({
        where: { id: req.user.id, is_deleted: false }
      });
      school_id = principal?.school_id || req.user.id;
    } else if (req.user.role === "parent") {
      // Parents may only see recipients for their own children
      if (student_id) {
        const student = await db.Student.findOne({
          where: { id: student_id, parent_id: req.user.id }
        });
        if (!student) {
          return res.status(403).json({
            status: 0,
            message: "You can only view recipients for your own children"
          });
        }
      }
    }

    const where = { school_id, is_deleted: false, is_active: true };
    if (student_id) where.student_id = student_id;

    const recipients = await db.DropOffRecipient.findAll({
      where,
      include: [
        { model: db.Student, as: "student", attributes: ["id", "full_name"] }
      ],
      order: [
        ["student_id", "ASC"],
        ["is_primary", "DESC"],
        ["created_at", "ASC"]
      ]
    });

    return res.status(200).json({
      status: 1,
      message: "Recipients retrieved successfully",
      data: recipients
    });
  } catch (error) {
    console.error("Get Dropoff Recipients Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Deactivate (soft-remove) a drop-off recipient
 */
const removeDropoffRecipient = async (req, res) => {
  const allowedRoles = ["school", "principal", "parent"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      status: 0,
      message: "You are not authorized to perform this action"
    });
  }

  try {
    const { recipient_id } = req.params;

    let school_id = req.user.id;
    if (req.user.role === "principal") {
      const principal = await db.User.findOne({
        where: { id: req.user.id, is_deleted: false }
      });
      school_id = principal?.school_id || req.user.id;
    }

    const where = { id: recipient_id, school_id, is_deleted: false };
    // Parents may only remove recipients they own
    if (req.user.role === "parent") {
      const recipient = await db.DropOffRecipient.findOne({ where: { id: recipient_id } });
      if (!recipient) {
        return res.status(404).json({ status: 0, message: "Recipient not found" });
      }
      const student = await db.Student.findOne({
        where: { id: recipient.student_id, parent_id: req.user.id }
      });
      if (!student) {
        return res.status(403).json({ status: 0, message: "Not authorized" });
      }
    }

    const recipient = await db.DropOffRecipient.findOne({ where });
    if (!recipient) {
      return res.status(404).json({ status: 0, message: "Recipient not found" });
    }

    await recipient.update({ is_active: false, is_deleted: true });

    return res.status(200).json({
      status: 1,
      message: "Recipient removed successfully"
    });
  } catch (error) {
    console.error("Remove Dropoff Recipient Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Get the current transport status and recent log history for a specific student.
 * Used by the admin on the parent/student details page.
 */
const getStudentTransportStatus = async (req, res) => {
  const allowedRoles = ["school", "principal", "super_admin", "parent"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      status: 0,
      message: "You are not authorized to view this information"
    });
  }

  try {
    const { student_id } = req.params;

    // Determine school_id scope and validate parent ownership
    let school_id = null;

    if (req.user.role === "super_admin") {
      school_id = req.query.school_id || null;
    } else if (req.user.role === "principal") {
      const principal = await db.User.findOne({
        where: { id: req.user.id, is_deleted: false }
      });
      school_id = principal?.school_id || req.user.id;
    } else if (req.user.role === "school") {
      school_id = req.user.id;
    } else if (req.user.role === "parent") {
      // Verify this student belongs to the requesting parent
      const student = await db.Student.findOne({
        where: { id: student_id, parent_id: req.user.id }
      });
      if (!student) {
        return res.status(403).json({
          status: 0,
          message: "You can only view transport status for your own children"
        });
      }
      // No school_id filter needed — the parent-student check is the security boundary
    }

    // Route filter — only scope by school_id for admin roles.
    // Restrict to routes that actually started today so stale "active" routes
    // from previous days (driver forgot to end them) never surface to parents.
    const todayStart = moment().startOf("day").toDate();
    const routeWhere = {
      status: "active",
      is_deleted: false,
      actual_start_time: { [Op.gte]: todayStart }
    };
    if (school_id) routeWhere.school_id = school_id;

    // Active transport — required:true ensures INNER JOIN so cancelled/completed
    // routes can never leak through even under edge-case Sequelize behaviour.
    // Order by created_at DESC so the most recent assignment wins when a
    // student has been on more than one route.
    const activeTransport = await db.StudentTransport.findOne({
      where: { student_id, is_deleted: false },
      include: [
        {
          model: db.Route,
          as: "route",
          where: routeWhere,
          required: true,
          include: [
            { model: db.User, as: "driver", attributes: ["id", "full_name"] },
            {
              model: db.Vehicle,
              as: "vehicle",
              attributes: ["id", "vehicle_name", "registration_plate"]
            }
          ]
        },
        {
          model: db.RouteStop,
          as: "stop",
          required: false,
          attributes: ["id", "stop_name", "stop_type", "stop_sequence"]
        }
      ],
      order: [["created_at", "DESC"]]
    });

    // Live location for the active route (if any)
    let liveLocation = null;
    if (activeTransport?.route_id) {
      liveLocation = await db.DriverLocation.findOne({
        where: { route_id: activeTransport.route_id }
      });
    }

    // Recent transport logs — scoped to today only.
    // Logs from previous days must not show when today has no active route,
    // otherwise the parent sees a misleading "other routes" activity feed.
    const logsRouteWhere = {
      is_deleted: false,
      status: { [Op.in]: ["active", "completed"] }
    };
    if (school_id) logsRouteWhere.school_id = school_id;

    const recentLogs = await db.TransportLog.findAll({
      where: {
        student_id,
        created_at: { [Op.gte]: todayStart }
      },
      include: [
        {
          model: db.Route,
          as: "route",
          where: logsRouteWhere,
          required: true,
          attributes: ["id", "route_name", "route_type"]
        },
        { model: db.User, as: "driver", attributes: ["id", "full_name"] }
      ],
      order: [["created_at", "DESC"]],
      limit: 20
    });

    // Authorized recipients for this student
    const recipients = await db.DropOffRecipient.findAll({
      where: { student_id, is_active: true, is_deleted: false },
      attributes: [
        "id",
        "recipient_name",
        "recipient_type",
        "relationship_to_student",
        "recipient_phone",
        "is_primary"
      ],
      order: [["is_primary", "DESC"]]
    });

    return res.status(200).json({
      status: 1,
      message: "Student transport status retrieved",
      data: {
        active_transport: activeTransport,
        live_location: liveLocation,
        recent_logs: recentLogs,
        authorized_recipients: recipients
      }
    });
  } catch (error) {
    console.error("Get Student Transport Status Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Update basic route details (name, times, notes).
 * Only allowed for scheduled routes — active/completed routes cannot be edited.
 */
const updateRoute = async (req, res) => {
  if (req.user.role !== "school" && req.user.role !== "principal") {
    return res.status(403).json({ status: 0, message: "You are not authorized to update routes" });
  }

  try {
    const { route_id } = req.params;
    const { route_name, scheduled_start_time, scheduled_end_time, notes } = req.body;

    let school_id = req.user.id;
    if (req.user.role === "principal") {
      const principal = await db.User.findOne({ where: { id: req.user.id, is_deleted: false } });
      school_id = principal?.school_id || req.user.id;
    }

    const route = await db.Route.findOne({ where: { id: route_id, school_id, is_deleted: false } });

    if (!route) {
      return res.status(404).json({ status: 0, message: "Route not found" });
    }

    if (route.status !== "scheduled") {
      return res.status(400).json({
        status: 0,
        message: `Cannot edit a ${route.status} route. Only scheduled routes can be modified.`
      });
    }

    if (scheduled_start_time) {
      const startTime = new Date(scheduled_start_time);
      if (startTime < new Date()) {
        return res.status(400).json({ status: 0, message: "Scheduled start time must be in the future" });
      }
    }

    const updateData = {};
    if (route_name) updateData.route_name = route_name;
    if (scheduled_start_time) updateData.scheduled_start_time = new Date(scheduled_start_time);
    if (scheduled_end_time !== undefined) {
      updateData.scheduled_end_time = scheduled_end_time ? new Date(scheduled_end_time) : null;
    }
    if (notes !== undefined) updateData.notes = notes;

    await route.update(updateData);

    const updatedRoute = await db.Route.findOne({
      where: { id: route_id },
      include: [
        { model: db.Vehicle, as: "vehicle" },
        { model: db.User, as: "driver", attributes: ["id", "full_name"] },
        { model: db.RouteStop, as: "stops" },
        { model: db.StudentTransport, as: "students", include: [{ model: db.Student, as: "student" }] }
      ]
    });

    return res.status(200).json({ status: 1, message: "Route updated successfully", data: updatedRoute });
  } catch (error) {
    console.error("Update Route Error:", error);
    return res.status(500).json({ status: 0, message: "Internal server error", error: error.message });
  }
};

/**
 * Cancel a scheduled route.
 * Cannot cancel an active route — driver must end it via the driver flow.
 */
const cancelRoute = async (req, res) => {
  if (req.user.role !== "school" && req.user.role !== "principal") {
    return res.status(403).json({
      status: 0,
      message: "You are not authorized to cancel routes"
    });
  }

  try {
    const { route_id } = req.params;
    const { reason } = req.body;

    let school_id = req.user.id;
    if (req.user.role === "principal") {
      const principal = await db.User.findOne({
        where: { id: req.user.id, is_deleted: false }
      });
      school_id = principal?.school_id || req.user.id;
    }

    const route = await db.Route.findOne({
      where: { id: route_id, school_id, is_deleted: false }
    });

    if (!route) {
      return res.status(404).json({ status: 0, message: "Route not found" });
    }

    if (route.status === "active") {
      return res.status(400).json({
        status: 0,
        message: "Cannot cancel an active route. The driver must end it via the driver app."
      });
    }

    if (route.status === "completed" || route.status === "cancelled") {
      return res.status(400).json({
        status: 0,
        message: `Route is already ${route.status}`
      });
    }

    await route.update({ status: "cancelled" });

    await db.TransportLog.create({
      route_id: route.id,
      driver_id: route.driver_id,
      event_type: "route_ended",
      event_description: `Route cancelled by admin${reason ? `: ${reason}` : ""}`,
      additional_data: { cancelled_by: req.user.id, reason: reason || null }
    });

    return res.status(200).json({
      status: 1,
      message: "Route cancelled successfully",
      data: route
    });
  } catch (error) {
    console.error("Cancel Route Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Get transport logs for a route or student
 */
const getTransportLogs = async (req, res) => {
  const allowedRoles = ["school", "principal", "super_admin"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      status: 0,
      message: "You are not authorized to view transport logs"
    });
  }

  try {
    const { route_id, student_id, page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;

    // Scope to caller's school — super_admin may pass school_id as query param
    let school_id =
      req.user.role === "super_admin" ? req.query.school_id : req.user.id;

    if (req.user.role === "principal") {
      const principal = await db.User.findOne({
        where: { id: req.user.id, is_deleted: false }
      });
      school_id = principal?.school_id || req.user.id;
    }

    // Scope logs to routes belonging to this school
    const routeWhere = { school_id, is_deleted: false };
    if (route_id) routeWhere.id = route_id;

    const where = {};
    if (student_id) where.student_id = student_id;

    const { count, rows } = await db.TransportLog.findAndCountAll({
      where,
      include: [
        {
          model: db.Route,
          as: "route",
          where: routeWhere,
          attributes: ["id", "route_name"]
        },
        { model: db.User, as: "driver", attributes: ["id", "full_name"] },
        { model: db.Student, as: "student", attributes: ["id", "full_name"] }
      ],
      limit,
      offset,
      order: [["created_at", "DESC"]]
    });

    return res.status(200).json({
      status: 1,
      message: "Transport logs retrieved successfully",
      data: rows,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error("Get Transport Logs Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Get transport exceptions — scoped to caller's school
 */
const getTransportExceptions = async (req, res) => {
  const allowedRoles = ["school", "principal", "super_admin"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      status: 0,
      message: "You are not authorized to view transport exceptions"
    });
  }

  try {
    const { route_id, status, page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;

    let school_id =
      req.user.role === "super_admin" ? req.query.school_id : req.user.id;

    if (req.user.role === "principal") {
      const principal = await db.User.findOne({
        where: { id: req.user.id, is_deleted: false }
      });
      school_id = principal?.school_id || req.user.id;
    }

    const where = { is_deleted: false };
    if (route_id) where.route_id = route_id;
    if (status) where.status = status;

    const routeWhere = { school_id, is_deleted: false };

    const { count, rows } = await db.TransportException.findAndCountAll({
      where,
      include: [
        {
          model: db.Route,
          as: "route",
          where: routeWhere,
          attributes: ["id", "route_name", "status"]
        },
        { model: db.Student, as: "student", attributes: ["id", "full_name"] },
        { model: db.User, as: "resolvedBy", attributes: ["id", "full_name"] }
      ],
      limit,
      offset,
      order: [
        ["severity", "ASC"],
        ["created_at", "DESC"]
      ]
    });

    return res.status(200).json({
      status: 1,
      message: "Transport exceptions retrieved successfully",
      data: rows,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error("Get Transport Exceptions Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Resolve a transport exception
 */
const resolveException = async (req, res) => {
  if (req.user.role !== "school" && req.user.role !== "principal") {
    return res.status(403).json({
      status: 0,
      message: "You are not authorized to perform this action"
    });
  }

  try {
    const { exception_id } = req.params;
    const { resolution_notes, action } = req.body;

    const validActions = ["acknowledged", "resolved"];
    const newStatus =
      action && validActions.includes(action) ? action : "resolved";

    let school_id = req.user.id;
    if (req.user.role === "principal") {
      const principal = await db.User.findOne({
        where: { id: req.user.id, is_deleted: false }
      });
      school_id = principal?.school_id || req.user.id;
    }

    // Ensure the exception belongs to this school
    const exception = await db.TransportException.findOne({
      where: { id: exception_id, is_deleted: false },
      include: [
        {
          model: db.Route,
          as: "route",
          where: { school_id, is_deleted: false },
          attributes: ["id"]
        }
      ]
    });

    if (!exception) {
      return res.status(404).json({
        status: 0,
        message: "Exception not found"
      });
    }

    await exception.update({
      status: newStatus,
      resolved_by: req.user.id,
      resolved_at: new Date(),
      resolution_notes: resolution_notes || null
    });

    return res.status(200).json({
      status: 1,
      message: "Exception resolved successfully",
      data: exception
    });
  } catch (error) {
    console.error("Resolve Exception Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Get live locations for all currently active routes belonging to this school.
 * Used by the admin dashboard as an initial load and polling fallback.
 */
const getLiveLocations = async (req, res) => {
  const allowedRoles = ["school", "principal", "super_admin"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      status: 0,
      message: "You are not authorized to view live locations"
    });
  }

  try {
    const school_id =
      req.user.role === "super_admin" ? req.query.school_id : req.user.id;

    // Split into two queries to avoid a cross-table JOIN that triggers a MySQL
    // collation mismatch (utf8mb4_general_ci vs utf8mb4_unicode_ci) between
    // tbl_driver_locations.route_id and tbl_routes.id.
    const activeRoutes = await db.Route.findAll({
      where: { school_id, status: "active", is_deleted: false },
      attributes: ["id", "route_name", "route_type", "status"],
      include: [
        { model: db.User, as: "driver", attributes: ["id", "full_name"] },
        {
          model: db.Vehicle,
          as: "vehicle",
          attributes: ["id", "vehicle_name", "registration_plate"]
        }
      ]
    });

    if (activeRoutes.length === 0) {
      return res.status(200).json({
        status: 1,
        message: "Live locations retrieved successfully",
        data: []
      });
    }

    const routeIds = activeRoutes.map((r) => r.id);
    const routeMap = Object.fromEntries(activeRoutes.map((r) => [r.id, r]));

    const rawLocations = await db.DriverLocation.findAll({
      where: { school_id, route_id: { [Op.in]: routeIds } },
      order: [["last_updated", "DESC"]]
    });

    const locations = rawLocations.map((loc) => ({
      ...loc.toJSON(),
      route: routeMap[loc.route_id] ?? null
    }));

    return res.status(200).json({
      status: 1,
      message: "Live locations retrieved successfully",
      data: locations
    });
  } catch (error) {
    console.error("Get Live Locations Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  addVehicle,
  getVehicles,
  updateVehicle,
  assignDriverToVehicle,
  createRoute,
  getRoutes,
  updateRoute,
  cancelRoute,
  getStudentTransportStatus,
  adminOverridePickup,
  adminOverrideDropoff,
  startRoute,
  updatePickupStatus,
  completeDropoff,
  endRoute,
  addDropoffRecipient,
  getDropoffRecipients,
  removeDropoffRecipient,
  getTransportLogs,
  getTransportExceptions,
  resolveException,
  getLiveLocations
};
