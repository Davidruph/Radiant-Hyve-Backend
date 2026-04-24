-- =====================================================
-- TRANSPORT MANAGEMENT SYSTEM - DATABASE TABLES
-- =====================================================
-- This SQL script creates all necessary tables for the
-- safety-first transport management system
-- =====================================================

-- 1. VEHICLES TABLE
-- Stores vehicle information and driver assignments
CREATE TABLE IF NOT EXISTS `tbl_vehicles` (
  `id` CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  `school_id` CHAR(36) NOT NULL COMMENT 'Reference to school/admin user',
  `vehicle_name` VARCHAR(255) NOT NULL COMMENT 'Name of the vehicle',
  `registration_plate` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Vehicle license plate',
  `vehicle_type` ENUM('bus', 'van', 'car') DEFAULT 'bus' COMMENT 'Type of vehicle',
  `capacity` INT NOT NULL COMMENT 'Maximum number of students',
  `driver_id` CHAR(36) COMMENT 'Currently assigned driver',
  `color` VARCHAR(100) COMMENT 'Vehicle color',
  `year_of_manufacture` INT COMMENT 'Year vehicle was manufactured',
  `insurance_expiry` DATE COMMENT 'Insurance expiry date',
  `status` ENUM('active', 'inactive', 'maintenance') DEFAULT 'active' COMMENT 'Vehicle status',
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_school_id` (`school_id`),
  INDEX `idx_driver_id` (`driver_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_registration_plate` (`registration_plate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================

-- 2. ROUTES TABLE
-- Stores route information and lifecycle tracking
CREATE TABLE IF NOT EXISTS `tbl_routes` (
  `id` CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  `school_id` CHAR(36) NOT NULL COMMENT 'Reference to school',
  `vehicle_id` CHAR(36) NOT NULL COMMENT 'Assigned vehicle',
  `driver_id` CHAR(36) NOT NULL COMMENT 'Assigned driver',
  `route_name` VARCHAR(255) NOT NULL COMMENT 'Name of route',
  `route_type` ENUM('pickup', 'dropoff', 'round_trip') DEFAULT 'round_trip' COMMENT 'Type of route',
  `status` ENUM('scheduled', 'active', 'completed', 'cancelled') DEFAULT 'scheduled' COMMENT 'Route lifecycle status',
  `scheduled_start_time` DATETIME NOT NULL COMMENT 'Planned start time',
  `actual_start_time` DATETIME COMMENT 'When driver actually started',
  `scheduled_end_time` DATETIME COMMENT 'Planned end time',
  `actual_end_time` DATETIME COMMENT 'When route was completed',
  `final_vehicle_check_confirmed` BOOLEAN DEFAULT FALSE COMMENT 'Driver confirmed vehicle check',
  `final_check_timestamp` DATETIME COMMENT 'Timestamp of final check',
  `notes` TEXT COMMENT 'Additional notes',
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_school_id` (`school_id`),
  INDEX `idx_vehicle_id` (`vehicle_id`),
  INDEX `idx_driver_id` (`driver_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_scheduled_start_time` (`scheduled_start_time`),
  INDEX `idx_route_type` (`route_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================

-- 3. ROUTE STOPS TABLE
-- Stores individual stops within a route
CREATE TABLE IF NOT EXISTS `tbl_route_stops` (
  `id` CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  `route_id` CHAR(36) NOT NULL COMMENT 'Reference to route',
  `stop_sequence` INT NOT NULL COMMENT 'Order of stop in route (1, 2, 3...)',
  `stop_name` VARCHAR(255) NOT NULL COMMENT 'Name of stop location',
  `latitude` DECIMAL(10, 8) COMMENT 'Geographic latitude',
  `longitude` DECIMAL(11, 8) COMMENT 'Geographic longitude',
  `address` TEXT COMMENT 'Full address of stop',
  `stop_type` ENUM('pickup', 'dropoff') NOT NULL COMMENT 'Type of stop',
  `scheduled_arrival_time` DATETIME COMMENT 'Planned arrival time',
  `actual_arrival_time` DATETIME COMMENT 'Actual arrival time',
  `status` ENUM('pending', 'in_progress', 'completed', 'skipped') DEFAULT 'pending' COMMENT 'Stop status',
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_route_id` (`route_id`),
  INDEX `idx_stop_sequence` (`stop_sequence`),
  INDEX `idx_status` (`status`),
  UNIQUE KEY `unique_route_sequence` (`route_id`, `stop_sequence`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================

-- 4. STUDENT TRANSPORT TABLE
-- Tracks student status throughout transport journey
CREATE TABLE IF NOT EXISTS `tbl_student_transports` (
  `id` CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  `route_id` CHAR(36) NOT NULL COMMENT 'Reference to route',
  `student_id` CHAR(36) NOT NULL COMMENT 'Reference to student',
  `route_stop_id` CHAR(36) NOT NULL COMMENT 'Pickup stop for student',
  `pickup_status` ENUM('pending_pickup', 'picked_up', 'absent', 'skipped') DEFAULT 'pending_pickup' COMMENT 'Pickup status',
  `pickup_timestamp` DATETIME COMMENT 'When student was picked up',
  `pickup_latitude` DECIMAL(10, 8) COMMENT 'Pickup location latitude',
  `pickup_longitude` DECIMAL(11, 8) COMMENT 'Pickup location longitude',
  `skip_reason` TEXT COMMENT 'Reason if student was skipped',
  `current_status` ENUM('pending', 'in_vehicle', 'dropped_off', 'exception') DEFAULT 'pending' COMMENT 'Current location/status',
  `dropoff_status` ENUM('pending', 'completed', 'exception') DEFAULT 'pending' COMMENT 'Dropoff process status',
  `dropoff_timestamp` DATETIME COMMENT 'When student was dropped off',
  `dropoff_latitude` DECIMAL(10, 8) COMMENT 'Dropoff location latitude',
  `dropoff_longitude` DECIMAL(11, 8) COMMENT 'Dropoff location longitude',
  `sequence_position` INT NOT NULL COMMENT 'Position in pickup/dropoff sequence',
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_route_id` (`route_id`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_route_stop_id` (`route_stop_id`),
  INDEX `idx_pickup_status` (`pickup_status`),
  INDEX `idx_current_status` (`current_status`),
  INDEX `idx_sequence_position` (`sequence_position`),
  UNIQUE KEY `unique_route_student` (`route_id`, `student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================

-- 5. DROP-OFF RECIPIENTS TABLE
-- Authorized recipients for safe student handoff
CREATE TABLE IF NOT EXISTS `tbl_drop_off_recipients` (
  `id` CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  `student_id` CHAR(36) NOT NULL COMMENT 'Reference to student',
  `school_id` CHAR(36) NOT NULL COMMENT 'Reference to school',
  `recipient_type` ENUM('parent', 'authorized_person') NOT NULL COMMENT 'Type of recipient',
  `recipient_name` VARCHAR(255) NOT NULL COMMENT 'Name of recipient',
  `recipient_phone` VARCHAR(20) COMMENT 'Contact phone number',
  `relationship_to_student` VARCHAR(100) COMMENT 'e.g., Mother, Father, Guardian',
  `is_primary` BOOLEAN DEFAULT FALSE COMMENT 'Primary recipient flag',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Whether recipient is active',
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_school_id` (`school_id`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_is_primary` (`is_primary`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================

-- 6. TRANSPORT LOG TABLE
-- Audit trail for all transport events
CREATE TABLE IF NOT EXISTS `tbl_transport_logs` (
  `id` CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  `route_id` CHAR(36) NOT NULL COMMENT 'Reference to route',
  `student_id` CHAR(36) COMMENT 'Reference to student (if applicable)',
  `driver_id` CHAR(36) NOT NULL COMMENT 'Driver who performed action',
  `event_type` ENUM(
    'route_started',
    'pickup_pending',
    'pickup_completed',
    'pickup_absent',
    'pickup_skipped',
    'dropoff_completed',
    'dropoff_exception',
    'final_check',
    'route_ended'
  ) NOT NULL COMMENT 'Type of event',
  `event_description` TEXT NOT NULL COMMENT 'Detailed description of event',
  `latitude` DECIMAL(10, 8) COMMENT 'GPS latitude at event',
  `longitude` DECIMAL(11, 8) COMMENT 'GPS longitude at event',
  `additional_data` JSON COMMENT 'Extra data as JSON',
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_route_id` (`route_id`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_driver_id` (`driver_id`),
  INDEX `idx_event_type` (`event_type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================

-- 7. TRANSPORT EXCEPTIONS TABLE
-- Exception tracking and resolution
CREATE TABLE IF NOT EXISTS `tbl_transport_exceptions` (
  `id` CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  `route_id` CHAR(36) NOT NULL COMMENT 'Reference to route',
  `student_id` CHAR(36) COMMENT 'Reference to student (if applicable)',
  `exception_type` ENUM(
    'student_absent',
    'student_skipped',
    'no_authorized_recipient',
    'route_delayed',
    'driver_replaced',
    'connectivity_loss',
    'student_not_accounted_for',
    'other'
  ) NOT NULL COMMENT 'Type of exception',
  `severity` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium' COMMENT 'Severity level',
  `description` TEXT NOT NULL COMMENT 'Description of exception',
  `status` ENUM('open', 'acknowledged', 'resolved') DEFAULT 'open' COMMENT 'Resolution status',
  `resolved_by` CHAR(36) COMMENT 'Admin who resolved exception',
  `resolution_notes` TEXT COMMENT 'Notes on how exception was resolved',
  `resolved_at` DATETIME COMMENT 'When exception was resolved',
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_route_id` (`route_id`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_exception_type` (`exception_type`),
  INDEX `idx_severity` (`severity`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- NOTE: Foreign key constraints removed to ensure compatibility
-- with existing database structure. Add them manually after 
-- verifying tbl_user and tbl_student table definitions match.
-- =====================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================

-- Vehicle performance indexes
ALTER TABLE `tbl_vehicles` ADD INDEX `idx_school_status` (`school_id`, `status`);
ALTER TABLE `tbl_vehicles` ADD INDEX `idx_driver_status` (`driver_id`, `status`);

-- Route performance indexes
ALTER TABLE `tbl_routes` ADD INDEX `idx_school_status_time` (`school_id`, `status`, `scheduled_start_time`);
ALTER TABLE `tbl_routes` ADD INDEX `idx_vehicle_time` (`vehicle_id`, `scheduled_start_time`);
ALTER TABLE `tbl_routes` ADD INDEX `idx_driver_status` (`driver_id`, `status`);

-- Student transport performance indexes
ALTER TABLE `tbl_student_transports` ADD INDEX `idx_route_pickup_status` (`route_id`, `pickup_status`);
ALTER TABLE `tbl_student_transports` ADD INDEX `idx_student_current_status` (`student_id`, `current_status`);

-- Transport log indexes
ALTER TABLE `tbl_transport_logs` ADD INDEX `idx_route_event_time` (`route_id`, `event_type`, `created_at`);
ALTER TABLE `tbl_transport_logs` ADD INDEX `idx_driver_time` (`driver_id`, `created_at`);

-- Transport exception indexes
ALTER TABLE `tbl_transport_exceptions` ADD INDEX `idx_route_severity` (`route_id`, `severity`);
ALTER TABLE `tbl_transport_exceptions` ADD INDEX `idx_type_status` (`exception_type`, `status`);

-- =====================================================
-- USEFUL VIEWS FOR QUERIES
-- =====================================================

-- Active Routes with Vehicle and Driver Info
CREATE OR REPLACE VIEW tbl_active_routes_view AS
SELECT 
  r.id,
  r.route_name,
  r.status,
  v.vehicle_name,
  v.registration_plate,
  u.full_name AS driver_name,
  u.email AS driver_email,
  r.scheduled_start_time,
  COUNT(DISTINCT st.student_id) AS total_students,
  SUM(CASE WHEN st.pickup_status = 'picked_up' THEN 1 ELSE 0 END) AS students_picked_up,
  SUM(CASE WHEN st.pickup_status = 'pending_pickup' THEN 1 ELSE 0 END) AS students_pending,
  COUNT(DISTINCT rs.id) AS total_stops
FROM tbl_routes r
LEFT JOIN tbl_vehicles v ON r.vehicle_id = v.id
LEFT JOIN tbl_user u ON r.driver_id = u.id
LEFT JOIN tbl_student_transports st ON r.id = st.route_id
LEFT JOIN tbl_route_stops rs ON r.id = rs.route_id
WHERE r.status IN ('scheduled', 'active')
GROUP BY r.id, r.route_name, r.status, v.vehicle_name, v.registration_plate, u.full_name, u.email, r.scheduled_start_time;

-- Route Completion Summary
CREATE OR REPLACE VIEW tbl_route_completion_summary AS
SELECT 
  r.id,
  r.route_name,
  r.scheduled_start_time,
  r.actual_start_time,
  r.actual_end_time,
  v.vehicle_name,
  u.full_name AS driver_name,
  COUNT(st.id) AS total_students,
  SUM(CASE WHEN st.pickup_status = 'picked_up' THEN 1 ELSE 0 END) AS picked_up_count,
  SUM(CASE WHEN st.pickup_status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
  SUM(CASE WHEN st.pickup_status = 'skipped' THEN 1 ELSE 0 END) AS skipped_count,
  r.final_vehicle_check_confirmed,
  COUNT(DISTINCT te.id) AS exceptions_count
FROM tbl_routes r
LEFT JOIN tbl_vehicles v ON r.vehicle_id = v.id
LEFT JOIN tbl_user u ON r.driver_id = u.id
LEFT JOIN tbl_student_transports st ON r.id = st.route_id
LEFT JOIN tbl_transport_exceptions te ON r.id = te.route_id
WHERE r.status = 'completed'
GROUP BY r.id, r.route_name, r.scheduled_start_time, r.actual_start_time, r.actual_end_time, v.vehicle_name, u.full_name;

-- Open Exceptions Report
CREATE OR REPLACE VIEW tbl_open_exceptions_report AS
SELECT 
  te.id,
  te.route_id,
  r.route_name,
  te.student_id,
  s.full_name AS student_name,
  te.exception_type,
  te.severity,
  te.status,
  te.created_at,
  u.full_name AS created_by_admin,
  te.description
FROM tbl_transport_exceptions te
LEFT JOIN tbl_routes r ON te.route_id = r.id
LEFT JOIN tbl_student s ON te.student_id = s.id
LEFT JOIN tbl_user u ON r.driver_id = u.id
WHERE te.status IN ('open', 'acknowledged')
ORDER BY te.severity DESC, te.created_at DESC;

-- =====================================================
-- END OF TRANSPORT MANAGEMENT SYSTEM SCHEMA
-- =====================================================
