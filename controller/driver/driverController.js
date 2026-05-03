require("dotenv").config();
const db = require("../../config/db");
const { Op } = require("sequelize");
const moment = require("moment");
const { emitToSockets } = require("../../config/socketConfig");
const { save_and_send_notification } = require("../../helpers/notification");

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

    // For dropoff routes students are already on the bus (loaded at school).
    // Auto-mark them as picked_up + in_vehicle so the dropoff flow works normally.
    if (route.route_type === "dropoff") {
      await db.StudentTransport.update(
        { pickup_status: "picked_up", current_status: "in_vehicle", pickup_timestamp: new Date() },
        { where: { route_id: route.id, pickup_status: "pending_pickup", is_deleted: false } }
      );
    }

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

    // Notify admin dashboard that route is now active
    emitToSockets(route.school_id, "transport:route_update", {
      route_id: route_id,
      status: "active"
    }).catch(() => {});

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

    const validStatuses = ["picked_up", "absent", "skipped"];
    if (!validStatuses.includes(pickup_status)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid pickup status. Must be picked_up, absent, or skipped"
      });
    }

    const studentTransport = await db.StudentTransport.findOne({
      where: { id: student_transport_id, is_deleted: false }
    });

    if (!studentTransport) {
      return res.status(404).json({
        status: 0,
        message: "Student transport record not found"
      });
    }

    // Block re-marking an already-actioned student
    if (studentTransport.pickup_status !== "pending_pickup") {
      return res.status(400).json({
        status: 0,
        message: `Student has already been marked as ${studentTransport.pickup_status}`
      });
    }

    // Verify route belongs to driver
    const route = await db.Route.findOne({
      where: {
        id: studentTransport.route_id,
        driver_id: String(req.user.id),
        is_deleted: false
      }
    });

    if (!route) {
      return res.status(403).json({
        status: 0,
        message: "You are not authorized to update this student's status"
      });
    }

    // Update pickup status and advance current_status for picked-up students
    const newCurrentStatus =
      pickup_status === "picked_up" ? "in_vehicle" : "pending";

    await studentTransport.update({
      pickup_status,
      current_status: newCurrentStatus,
      skip_reason: skip_reason || null,
      pickup_latitude: latitude || null,
      pickup_longitude: longitude || null,
      pickup_timestamp: new Date()
    });

    // Log event type matches the actual outcome
    const eventTypeMap = {
      picked_up: "pickup_completed",
      absent: "pickup_absent",
      skipped: "pickup_skipped"
    };

    await db.TransportLog.create({
      route_id: route.id,
      driver_id: req.user.id,
      student_id: studentTransport.student_id,
      event_type: eventTypeMap[pickup_status],
      event_description: `Student pickup status updated to ${pickup_status}`,
      latitude: latitude || null,
      longitude: longitude || null,
      additional_data: {
        student_transport_id,
        pickup_status,
        skip_reason: skip_reason || null
      }
    });

    // Auto-update RouteStop status based on how many students are still pending
    const stopStudents = await db.StudentTransport.findAll({
      where: {
        route_id: route.id,
        route_stop_id: studentTransport.route_stop_id,
        is_deleted: false
      },
      attributes: ["pickup_status"]
    });

    const pendingAtStop = stopStudents.filter(
      (s) => s.pickup_status === "pending_pickup"
    ).length;

    const newStopStatus =
      pendingAtStop === stopStudents.length
        ? "pending"
        : pendingAtStop === 0
          ? "completed"
          : "in_progress";

    const stopUpdateData = { status: newStopStatus };

    if (newStopStatus !== "pending") {
      // Record first arrival time when driver starts working this stop
      const stop = await db.RouteStop.findOne({
        where: { id: studentTransport.route_stop_id }
      });
      if (stop && !stop.actual_arrival_time) {
        stopUpdateData.actual_arrival_time = new Date();
      }
    }

    await db.RouteStop.update(stopUpdateData, {
      where: { id: studentTransport.route_stop_id }
    });

    // Emit real-time student status update to admin
    emitToSockets(route.school_id, "transport:student_update", {
      route_id: route.id,
      student_transport_id: studentTransport.id,
      student_id: studentTransport.student_id,
      pickup_status,
      current_status: newCurrentStatus,
      stop_id: studentTransport.route_stop_id,
      stop_status: newStopStatus
    }).catch(() => {});

    // Auto-create exception for absent or skipped students so admin is alerted
    if (pickup_status === "absent" || pickup_status === "skipped") {
      const exception = await db.TransportException.create({
        route_id: route.id,
        student_id: studentTransport.student_id,
        exception_type:
          pickup_status === "absent" ? "student_absent" : "student_skipped",
        severity: pickup_status === "absent" ? "high" : "medium",
        description:
          pickup_status === "absent"
            ? `Student was not present at pickup stop`
            : `Student pickup skipped — reason: ${skip_reason || "not provided"}`,
        status: "open"
      });

      // Alert school admin about the exception via socket
      emitToSockets(route.school_id, "transport:exception", {
        exception_id: exception.id,
        route_id: route.id,
        route_name: route.route_name,
        exception_type: exception.exception_type,
        severity: exception.severity,
        description: exception.description
      }).catch(() => {});
    }

    // Notify the student's parent — fire-and-forget, don't block the response
    const student = await db.Student.findOne({
      where: { id: studentTransport.student_id },
      attributes: ["id", "full_name", "parent_id"]
    });

    if (student?.parent_id) {
      const notificationMessages = {
        picked_up: {
          title: "Child Picked Up",
          body: `${student.full_name} has been picked up and is on the way.`
        },
        absent: {
          title: "Child Absent at Stop",
          body: `${student.full_name} was not present at the pickup stop. Please contact the school.`
        },
        skipped: {
          title: "Pickup Skipped",
          body: `Driver was unable to pick up ${student.full_name}${skip_reason ? `: ${skip_reason}` : "."}`
        }
      };

      const msg = notificationMessages[pickup_status];
      save_and_send_notification({
        notification_by: req.user.id,
        notification_to: student.parent_id,
        notification_type: `transport_${pickup_status}`,
        title: msg.title,
        body: msg.body,
        school_id: route.school_id,
        data: {
          route_id: route.id,
          student_id: student.id,
          pickup_status
        }
      }).catch(() => {});
    }

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

    if (!recipient_type || !recipient_name) {
      return res.status(400).json({
        status: 0,
        message: "Recipient type and name are required for dropoff"
      });
    }

    const studentTransport = await db.StudentTransport.findOne({
      where: { id: student_transport_id, is_deleted: false }
    });

    if (!studentTransport) {
      return res.status(404).json({
        status: 0,
        message: "Student transport record not found"
      });
    }

    // Cannot drop off a student who was never picked up
    if (studentTransport.pickup_status !== "picked_up") {
      return res.status(400).json({
        status: 0,
        message: "Cannot complete dropoff — student was not picked up"
      });
    }

    // Prevent double dropoff
    if (studentTransport.current_status === "dropped_off") {
      return res.status(400).json({
        status: 0,
        message: "Student has already been dropped off"
      });
    }

    // Verify route belongs to driver
    const route = await db.Route.findOne({
      where: {
        id: studentTransport.route_id,
        driver_id: String(req.user.id),
        is_deleted: false
      }
    });

    if (!route) {
      return res.status(403).json({
        status: 0,
        message: "You are not authorized to update this student's status"
      });
    }

    // Validate recipient name against pre-registered authorized recipients.
    // We never block a dropoff over this — the child must be handed to someone —
    // but we flag the mismatch as a high-severity exception so admin can follow up.
    const authorizedRecipients = await db.DropOffRecipient.findAll({
      where: {
        student_id: studentTransport.student_id,
        is_active: true,
        is_deleted: false
      },
      attributes: ["id", "recipient_name", "recipient_type"]
    });

    if (authorizedRecipients.length > 0) {
      const normalizedInput = recipient_name.trim().toLowerCase();
      const matched = authorizedRecipients.some(
        (r) => r.recipient_name.trim().toLowerCase() === normalizedInput
      );

      if (!matched) {
        // Log mismatch as a high-priority exception for admin review
        const exception = await db.TransportException.create({
          route_id: route.id,
          student_id: studentTransport.student_id,
          exception_type: "no_authorized_recipient",
          severity: "high",
          description: `Student dropped off to "${recipient_name}" who is not on the authorized recipients list.`,
          status: "open"
        });

        emitToSockets(route.school_id, "transport:exception", {
          exception_id: exception.id,
          route_id: route.id,
          route_name: route.route_name,
          exception_type: "no_authorized_recipient",
          severity: "high",
          description: exception.description
        }).catch(() => {});
      }
    }

    await studentTransport.update({
      current_status: "dropped_off",
      dropoff_status: "completed",
      dropoff_recipient_type: recipient_type,
      dropoff_recipient_name: recipient_name,
      dropoff_latitude: latitude || null,
      dropoff_longitude: longitude || null,
      dropoff_timestamp: new Date()
    });

    await db.TransportLog.create({
      route_id: route.id,
      driver_id: req.user.id,
      student_id: studentTransport.student_id,
      event_type: "dropoff_completed",
      event_description: `Student dropped off to ${recipient_type}`,
      latitude: latitude || null,
      longitude: longitude || null,
      additional_data: {
        student_transport_id,
        recipient_type,
        recipient_name
      }
    });

    // Emit real-time dropoff update to admin
    emitToSockets(route.school_id, "transport:student_update", {
      route_id: route.id,
      student_transport_id: studentTransport.id,
      student_id: studentTransport.student_id,
      current_status: "dropped_off",
      dropoff_status: "completed"
    }).catch(() => {});

    // Notify the student's parent — fire-and-forget
    const student = await db.Student.findOne({
      where: { id: studentTransport.student_id },
      attributes: ["id", "full_name", "parent_id"]
    });

    if (student?.parent_id) {
      save_and_send_notification({
        notification_by: req.user.id,
        notification_to: student.parent_id,
        notification_type: "transport_dropoff",
        title: "Child Dropped Off",
        body: `${student.full_name} has been safely dropped off to ${recipient_name}.`,
        school_id: route.school_id,
        data: {
          route_id: route.id,
          student_id: student.id,
          recipient_type,
          recipient_name
        }
      }).catch(() => {});
    }

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
    const { route_id, final_vehicle_check_confirmed } = req.body;

    if (!final_vehicle_check_confirmed) {
      return res.status(400).json({
        status: 0,
        message:
          "You must confirm the final vehicle check before ending the route"
      });
    }

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

    if (String(route.driver_id) !== String(req.user.id)) {
      return res.status(403).json({
        status: 0,
        message: "You are not assigned to this route"
      });
    }

    // Route-type-aware completion check:
    // - pickup: all students must be processed (no one still pending_pickup)
    // - dropoff/round_trip: all picked-up students must be dropped off
    let blockedStudents = [];
    let blockMessage = "";

    if (route.route_type === "pickup") {
      blockedStudents = route.students.filter(
        (s) => s.pickup_status === "pending_pickup"
      );
      blockMessage = `Cannot end route — ${blockedStudents.length} student(s) not yet processed. Mark each student as picked up, absent, or skipped first.`;
    } else {
      blockedStudents = route.students.filter(
        (s) => s.pickup_status === "picked_up" && s.current_status !== "dropped_off"
      );
      blockMessage = `Cannot end route — ${blockedStudents.length} student(s) still in vehicle. All picked-up students must be dropped off first.`;
    }

    if (blockedStudents.length > 0) {
      const exceptions = await Promise.all(
        blockedStudents.map((s) =>
          db.TransportException.create({
            route_id: route.id,
            student_id: s.student_id,
            exception_type: "student_not_accounted_for",
            severity: "critical",
            description: `Route end attempted but student has not been ${route.route_type === "pickup" ? "processed" : "dropped off"}`,
            status: "open"
          })
        )
      );

      // Alert admin via socket and push for each unaccounted student
      for (const exception of exceptions) {
        const exceptionPayload = {
          exception_id: exception.id,
          route_id: route.id,
          route_name: route.route_name,
          exception_type: "student_not_accounted_for",
          severity: "critical",
          description: exception.description
        };
        emitToSockets(route.school_id, "transport:exception", exceptionPayload).catch(() => {});
        save_and_send_notification({
          notification_by: req.user.id,
          notification_to: route.school_id,
          notification_type: "transport_exception_critical",
          title: "CRITICAL: Student Not Accounted For",
          body: `Route "${route.route_name}" cannot end — a student has not been accounted for.`,
          school_id: route.school_id,
          data: exceptionPayload
        }).catch(() => {});
      }

      return res.status(400).json({
        status: 0,
        message: blockMessage,
        unaccounted_students: blockedStudents.map((s) => s.student_id)
      });
    }

    const now = new Date();

    await route.update({
      status: "completed",
      actual_end_time: now,
      final_vehicle_check_confirmed: true,
      final_check_timestamp: now
    });

    await db.TransportLog.create({
      route_id: route.id,
      driver_id: req.user.id,
      event_type: "route_ended",
      event_description: `Route ${route.route_name} ended — vehicle check confirmed`,
      additional_data: {
        total_students: route.students.length,
        final_vehicle_check_confirmed: true
      }
    });

    // Remove live location record — route is done, no stale pin on admin map
    db.DriverLocation.destroy({ where: { route_id: route.id } }).catch(() => {});

    // Notify admin dashboard that route is now completed
    emitToSockets(route.school_id, "transport:route_update", {
      route_id: route_id,
      status: "completed"
    }).catch(() => {});

    // Notify admin that the route completed successfully
    save_and_send_notification({
      notification_by: req.user.id,
      notification_to: route.school_id,
      notification_type: "transport_route_completed",
      title: "Route Completed",
      body: `Route "${route.route_name}" has been completed. Vehicle check confirmed.`,
      school_id: route.school_id,
      data: {
        route_id: route.id,
        total_students: route.students.length
      }
    }).catch(() => {});

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

/**
 * Get the driver's currently active route with full details.
 * Called on page load so drivers can resume mid-route after a refresh.
 */
const getActiveRoute = async (req, res) => {
  if (req.user.role !== "driver") {
    return res.status(403).json({
      status: 0,
      message: "Only drivers can access this endpoint"
    });
  }

  try {
    const route = await db.Route.findOne({
      where: {
        driver_id: String(req.user.id),
        status: "active",
        is_deleted: false
      },
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

    if (!route) {
      return res.status(200).json({
        status: 1,
        message: "No active route",
        data: null
      });
    }

    return res.status(200).json({
      status: 1,
      message: "Active route retrieved",
      data: route
    });
  } catch (error) {
    console.error("Get Active Route Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Update driver's live GPS location for an active route.
 * Upserts one record per route and broadcasts to all school admins via socket.
 */
const updateDriverLocation = async (req, res) => {
  if (req.user.role !== "driver") {
    return res.status(403).json({
      status: 0,
      message: "Only drivers can update location"
    });
  }

  try {
    const { route_id, latitude, longitude } = req.body;

    if (!route_id || latitude == null || longitude == null) {
      return res.status(400).json({
        status: 0,
        message: "route_id, latitude, and longitude are required"
      });
    }

    const route = await db.Route.findOne({
      where: {
        id: route_id,
        driver_id: String(req.user.id),
        status: "active",
        is_deleted: false
      }
    });

    if (!route) {
      return res.status(404).json({
        status: 0,
        message: "Active route not found or not assigned to you"
      });
    }

    const now = new Date();

    // Upsert — one live location row per route
    await db.DriverLocation.upsert({
      route_id,
      driver_id: req.user.id,
      school_id: route.school_id,
      latitude,
      longitude,
      last_updated: now
    });

    const payload = {
      route_id,
      driver_id: req.user.id,
      school_id: route.school_id,
      route_name: route.route_name,
      latitude,
      longitude,
      last_updated: now
    };

    // Broadcast to all admins of this school who are connected via socket
    const schoolAdmins = await db.User.findAll({
      where: { school_id: route.school_id, is_deleted: false },
      attributes: ["id"]
    });

    await Promise.all(
      schoolAdmins.map((admin) =>
        emitToSockets(admin.id, "transport:location_update", payload).catch(
          () => {}
        )
      )
    );

    // Also emit to the school owner/admin account directly
    emitToSockets(route.school_id, "transport:location_update", payload).catch(
      () => {}
    );

    return res.status(200).json({ status: 1, message: "Location updated" });
  } catch (error) {
    console.error("Update Driver Location Error:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  getAssignedRoutes,
  getActiveRoute,
  startRoute,
  updatePickupStatus,
  completeDropoff,
  endRoute,
  updateDriverLocation
};
