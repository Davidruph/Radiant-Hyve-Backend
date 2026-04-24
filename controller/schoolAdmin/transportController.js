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

    // Create route stops
    if (stops && stops.length > 0) {
      const routeStops = stops.map((stop, index) => ({
        route_id: route.id,
        stop_sequence: index + 1,
        stop_name: stop.stop_name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        address: stop.address,
        stop_type: stop.stop_type,
        scheduled_arrival_time: stop.scheduled_arrival_time
          ? new Date(stop.scheduled_arrival_time)
          : null,
        status: "pending"
      }));

      await db.RouteStop.bulkCreate(routeStops);
    }

    // Create student transport assignments
    if (student_assignments && student_assignments.length > 0) {
      const assignments = student_assignments.map((assignment) => ({
        route_id: route.id,
        student_id: assignment.student_id,
        route_stop_id: assignment.route_stop_id,
        pickup_status: "pending_pickup",
        current_status: "pending",
        dropoff_status: "pending",
        sequence_position: assignment.sequence_position
      }));

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
 * Get transport logs for a route or student
 */
const getTransportLogs = async (req, res) => {
  try {
    const { route_id, student_id, page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;

    const where = {};
    if (route_id) where.route_id = route_id;
    if (student_id) where.student_id = student_id;

    const { count, rows } = await db.TransportLog.findAndCountAll({
      where,
      include: [
        { model: db.User, as: "driver", attributes: ["id", "full_name"] },
        {
          model: db.Student,
          as: "student",
          attributes: ["id", "full_name"]
        }
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
 * Get transport exceptions
 */
const getTransportExceptions = async (req, res) => {
  try {
    const { route_id, status = "open", page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;

    const where = { is_deleted: false };
    if (route_id) where.route_id = route_id;
    if (status) where.status = status;

    const { count, rows } = await db.TransportException.findAndCountAll({
      where,
      include: [
        {
          model: db.Route,
          as: "route",
          attributes: ["id", "route_name", "status"]
        },
        {
          model: db.Student,
          as: "student",
          attributes: ["id", "full_name"]
        },
        { model: db.User, as: "resolvedBy", attributes: ["id", "full_name"] }
      ],
      limit,
      offset,
      order: [["created_at", "DESC"]]
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
    const { resolution_notes } = req.body;

    const exception = await db.TransportException.findOne({
      where: { id: exception_id, is_deleted: false }
    });

    if (!exception) {
      return res.status(404).json({
        status: 0,
        message: "Exception not found"
      });
    }

    await exception.update({
      status: "resolved",
      resolved_by: req.user.id,
      resolved_at: new Date(),
      resolution_notes
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

module.exports = {
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
};
