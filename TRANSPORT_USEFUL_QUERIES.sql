-- =====================================================
-- TRANSPORT SYSTEM - USEFUL SQL QUERIES
-- =====================================================
-- Common queries for testing and operations

-- =====================================================
-- 1. VEHICLE MANAGEMENT QUERIES
-- =====================================================

-- Get all active vehicles for a school
SELECT id, vehicle_name, registration_plate, capacity, driver_id, status
FROM vehicles
WHERE school_id = 'SCHOOL_UUID_HERE'
  AND status = 'active'
  AND is_deleted = FALSE
ORDER BY vehicle_name;

-- Find vehicles without assigned drivers
SELECT id, vehicle_name, registration_plate, capacity, status
FROM vehicles
WHERE driver_id IS NULL
  AND is_deleted = FALSE
  AND status = 'active';

-- Get vehicle with current driver information
SELECT 
  v.id,
  v.vehicle_name,
  v.registration_plate,
  v.capacity,
  v.vehicle_type,
  u.first_name AS driver_name,
  u.email AS driver_email,
  u.mobile_no AS driver_phone
FROM vehicles v
LEFT JOIN users u ON v.driver_id = u.id
WHERE v.school_id = 'SCHOOL_UUID_HERE'
  AND v.is_deleted = FALSE;

-- Check insurance expiry alerts
SELECT id, vehicle_name, registration_plate, insurance_expiry
FROM vehicles
WHERE insurance_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  AND is_deleted = FALSE
ORDER BY insurance_expiry;

-- =====================================================
-- 2. ROUTE MANAGEMENT QUERIES
-- =====================================================

-- Get all routes for today
SELECT 
  id, route_name, vehicle_id, driver_id, route_type, status,
  scheduled_start_time, actual_start_time
FROM routes
WHERE school_id = 'SCHOOL_UUID_HERE'
  AND DATE(scheduled_start_time) = CURDATE()
  AND is_deleted = FALSE
ORDER BY scheduled_start_time;

-- Get active routes (currently executing)
SELECT 
  r.id, r.route_name, r.status, v.vehicle_name,
  u.first_name AS driver_name,
  COUNT(DISTINCT st.student_id) AS total_students,
  SUM(CASE WHEN st.pickup_status = 'picked_up' THEN 1 ELSE 0 END) AS picked_up
FROM routes r
LEFT JOIN vehicles v ON r.vehicle_id = v.id
LEFT JOIN users u ON r.driver_id = u.id
LEFT JOIN student_transports st ON r.id = st.route_id
WHERE r.status = 'active'
  AND r.is_deleted = FALSE
GROUP BY r.id, r.route_name, r.status, v.vehicle_name, u.first_name;

-- Get routes for a specific driver
SELECT 
  id, route_name, route_type, status,
  scheduled_start_time, actual_start_time, actual_end_time
FROM routes
WHERE driver_id = 'DRIVER_UUID_HERE'
  AND is_deleted = FALSE
ORDER BY scheduled_start_time DESC
LIMIT 10;

-- Get routes that are overdue (actual time > scheduled + 30 min)
SELECT 
  r.id, r.route_name, r.scheduled_end_time, r.actual_end_time,
  u.first_name AS driver_name,
  TIMESTAMPDIFF(MINUTE, r.scheduled_end_time, r.actual_end_time) AS minutes_late
FROM routes r
LEFT JOIN users u ON r.driver_id = u.id
WHERE r.status = 'active'
  AND r.actual_end_time IS NULL
  AND r.scheduled_end_time < NOW()
  AND r.is_deleted = FALSE;

-- Routes without final vehicle check confirmed
SELECT 
  id, route_name, status, actual_end_time,
  final_vehicle_check_confirmed
FROM routes
WHERE status = 'completed'
  AND final_vehicle_check_confirmed = FALSE
  AND is_deleted = FALSE;

-- =====================================================
-- 3. ROUTE STOPS QUERIES
-- =====================================================

-- Get all stops for a specific route (in sequence)
SELECT 
  id, stop_sequence, stop_name, stop_type,
  address, latitude, longitude,
  scheduled_arrival_time, actual_arrival_time, status
FROM route_stops
WHERE route_id = 'ROUTE_UUID_HERE'
  AND is_deleted = FALSE
ORDER BY stop_sequence;

-- Find stops that were skipped
SELECT 
  id, stop_name, stop_sequence, route_id, status
FROM route_stops
WHERE status = 'skipped'
  AND is_deleted = FALSE
  AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY);

-- Get stops with students assigned
SELECT 
  rs.id, rs.stop_name, rs.stop_sequence,
  COUNT(st.student_id) AS students_count
FROM route_stops rs
LEFT JOIN student_transports st ON rs.id = st.route_stop_id
WHERE rs.route_id = 'ROUTE_UUID_HERE'
  AND rs.is_deleted = FALSE
GROUP BY rs.id, rs.stop_name, rs.stop_sequence;

-- =====================================================
-- 4. STUDENT TRANSPORT QUERIES
-- =====================================================

-- Get all students in a specific route
SELECT 
  st.id, st.sequence_position,
  s.first_name, s.last_name,
  st.pickup_status, st.current_status,
  st.pickup_timestamp, st.dropoff_timestamp
FROM student_transports st
LEFT JOIN students s ON st.student_id = s.id
WHERE st.route_id = 'ROUTE_UUID_HERE'
  AND st.is_deleted = FALSE
ORDER BY st.sequence_position;

-- Get students still pending pickup
SELECT 
  st.id, st.sequence_position,
  s.first_name, s.last_name,
  st.pickup_status, st.current_status
FROM student_transports st
LEFT JOIN students s ON st.student_id = s.id
WHERE st.route_id = 'ROUTE_UUID_HERE'
  AND st.pickup_status = 'pending_pickup'
  AND st.is_deleted = FALSE
ORDER BY st.sequence_position;

-- Get absent students count by route
SELECT 
  r.id, r.route_name,
  COUNT(DISTINCT CASE WHEN st.pickup_status = 'absent' THEN st.student_id END) AS absent_count,
  COUNT(DISTINCT CASE WHEN st.pickup_status = 'skipped' THEN st.student_id END) AS skipped_count
FROM routes r
LEFT JOIN student_transports st ON r.id = st.route_id
WHERE r.is_deleted = FALSE
  AND DATE(r.scheduled_start_time) = CURDATE()
GROUP BY r.id, r.route_name;

-- Get student transport history for a student
SELECT 
  st.id, r.route_name, r.scheduled_start_time,
  st.pickup_status, st.current_status,
  st.pickup_timestamp, st.dropoff_timestamp,
  r.status
FROM student_transports st
LEFT JOIN routes r ON st.route_id = r.id
WHERE st.student_id = 'STUDENT_UUID_HERE'
  AND st.is_deleted = FALSE
ORDER BY r.scheduled_start_time DESC
LIMIT 20;

-- Students not picked up (absent or skipped)
SELECT 
  s.id, s.first_name, s.last_name,
  r.route_name, st.pickup_status, st.skip_reason
FROM student_transports st
LEFT JOIN students s ON st.student_id = s.id
LEFT JOIN routes r ON st.route_id = r.id
WHERE st.route_id = 'ROUTE_UUID_HERE'
  AND st.pickup_status IN ('absent', 'skipped')
  AND st.is_deleted = FALSE;

-- =====================================================
-- 5. DROP-OFF RECIPIENT QUERIES
-- =====================================================

-- Get authorized recipients for a student
SELECT 
  id, recipient_name, recipient_type, recipient_phone,
  relationship_to_student, is_primary, is_active
FROM drop_off_recipients
WHERE student_id = 'STUDENT_UUID_HERE'
  AND is_deleted = FALSE;

-- Get primary recipients for all students
SELECT 
  s.id, s.first_name, s.last_name,
  dor.recipient_name, dor.recipient_type,
  dor.recipient_phone
FROM students s
LEFT JOIN drop_off_recipients dor ON s.id = dor.student_id 
  AND dor.is_primary = TRUE 
  AND dor.is_deleted = FALSE
WHERE s.school_id = 'SCHOOL_UUID_HERE'
  AND s.is_deleted = FALSE;

-- Find students with no active recipients
SELECT 
  s.id, s.first_name, s.last_name
FROM students s
LEFT JOIN drop_off_recipients dor ON s.id = dor.student_id 
  AND dor.is_active = TRUE 
  AND dor.is_deleted = FALSE
WHERE s.school_id = 'SCHOOL_UUID_HERE'
  AND s.is_deleted = FALSE
  AND dor.id IS NULL;

-- Get all active recipients for a school
SELECT 
  dor.id, dor.recipient_name, dor.recipient_type,
  s.first_name AS student_fname, s.last_name AS student_lname,
  dor.is_primary, dor.recipient_phone
FROM drop_off_recipients dor
LEFT JOIN students s ON dor.student_id = s.id
WHERE dor.school_id = 'SCHOOL_UUID_HERE'
  AND dor.is_active = TRUE
  AND dor.is_deleted = FALSE
ORDER BY s.last_name, s.first_name;

-- =====================================================
-- 6. TRANSPORT LOG QUERIES
-- =====================================================

-- Get all events for a specific route
SELECT 
  id, event_type, event_description,
  driver_id, student_id,
  latitude, longitude, created_at
FROM transport_logs
WHERE route_id = 'ROUTE_UUID_HERE'
  AND is_deleted = FALSE
ORDER BY created_at;

-- Get pickup events for a student
SELECT 
  tl.id, tl.event_type, tl.event_description,
  tl.latitude, tl.longitude, tl.created_at
FROM transport_logs tl
WHERE tl.student_id = 'STUDENT_UUID_HERE'
  AND tl.event_type LIKE '%pickup%'
  AND tl.is_deleted = FALSE
ORDER BY tl.created_at DESC;

-- Get all events by a driver today
SELECT 
  id, event_type, route_id, event_description,
  created_at
FROM transport_logs
WHERE driver_id = 'DRIVER_UUID_HERE'
  AND DATE(created_at) = CURDATE()
  AND is_deleted = FALSE
ORDER BY created_at;

-- Get event timeline for a route
SELECT 
  event_type, COUNT(*) as count, MIN(created_at) as first_event
FROM transport_logs
WHERE route_id = 'ROUTE_UUID_HERE'
  AND is_deleted = FALSE
GROUP BY event_type
ORDER BY MIN(created_at);

-- =====================================================
-- 7. TRANSPORT EXCEPTION QUERIES
-- =====================================================

-- Get all open exceptions
SELECT 
  te.id, te.exception_type, te.severity, te.status,
  r.route_name, s.first_name, s.last_name,
  te.description, te.created_at
FROM transport_exceptions te
LEFT JOIN routes r ON te.route_id = r.id
LEFT JOIN students s ON te.student_id = s.id
WHERE te.status = 'open'
  AND te.is_deleted = FALSE
ORDER BY te.severity DESC, te.created_at DESC;

-- Get critical and high severity exceptions
SELECT 
  te.id, te.exception_type, te.severity,
  r.route_name, te.description,
  te.created_at
FROM transport_exceptions te
LEFT JOIN routes r ON te.route_id = r.id
WHERE te.severity IN ('critical', 'high')
  AND te.status != 'resolved'
  AND te.is_deleted = FALSE
ORDER BY te.created_at DESC;

-- Get exceptions by type and count
SELECT 
  exception_type, severity,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
  SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open
FROM transport_exceptions
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  AND is_deleted = FALSE
GROUP BY exception_type, severity
ORDER BY total DESC;

-- Get exceptions for a specific route
SELECT 
  id, exception_type, severity, status,
  description, created_at, resolved_at
FROM transport_exceptions
WHERE route_id = 'ROUTE_UUID_HERE'
  AND is_deleted = FALSE
ORDER BY created_at DESC;

-- Get student absence patterns
SELECT 
  s.id, s.first_name, s.last_name,
  COUNT(*) as absence_count,
  SUM(CASE WHEN te.exception_type = 'student_absent' THEN 1 ELSE 0 END) as absent,
  SUM(CASE WHEN te.exception_type = 'student_skipped' THEN 1 ELSE 0 END) as skipped
FROM transport_exceptions te
LEFT JOIN students s ON te.student_id = s.id
WHERE te.exception_type IN ('student_absent', 'student_skipped')
  AND te.is_deleted = FALSE
  AND te.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY s.id, s.first_name, s.last_name
HAVING absence_count > 0
ORDER BY absence_count DESC;

-- =====================================================
-- 8. ANALYTICS & REPORTS
-- =====================================================

-- Daily route summary
SELECT 
  DATE(r.scheduled_start_time) as route_date,
  COUNT(DISTINCT r.id) as total_routes,
  SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN r.status = 'active' THEN 1 ELSE 0 END) as active,
  COUNT(DISTINCT st.student_id) as total_students,
  SUM(CASE WHEN st.pickup_status = 'picked_up' THEN 1 ELSE 0 END) as picked_up
FROM routes r
LEFT JOIN student_transports st ON r.id = st.route_id
WHERE DATE(r.scheduled_start_time) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  AND r.is_deleted = FALSE
GROUP BY DATE(r.scheduled_start_time)
ORDER BY route_date DESC;

-- Driver performance metrics
SELECT 
  u.id, u.first_name, u.last_name, u.email,
  COUNT(DISTINCT r.id) as total_routes,
  SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed_routes,
  SUM(CASE WHEN r.final_vehicle_check_confirmed = TRUE THEN 1 ELSE 0 END) as safety_checks_done,
  COUNT(DISTINCT te.id) as exceptions
FROM users u
LEFT JOIN routes r ON u.id = r.driver_id
LEFT JOIN transport_exceptions te ON r.id = te.route_id
WHERE u.role = 'driver'
  AND u.is_deleted = FALSE
GROUP BY u.id, u.first_name, u.last_name, u.email
ORDER BY completed_routes DESC;

-- Vehicle utilization report
SELECT 
  v.id, v.vehicle_name, v.registration_plate, v.capacity,
  COUNT(DISTINCT r.id) as total_routes,
  SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed,
  AVG(COUNT(st.student_id)) as avg_students_per_route
FROM vehicles v
LEFT JOIN routes r ON v.id = r.vehicle_id
LEFT JOIN student_transports st ON r.id = st.route_id
WHERE v.is_deleted = FALSE
  AND r.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY v.id, v.vehicle_name, v.registration_plate, v.capacity
ORDER BY total_routes DESC;

-- =====================================================
-- 9. DATA CLEANUP & MAINTENANCE
-- =====================================================

-- Count deleted records
SELECT 
  'vehicles' as table_name, COUNT(*) as deleted_count FROM vehicles WHERE is_deleted = TRUE
UNION
SELECT 'routes', COUNT(*) FROM routes WHERE is_deleted = TRUE
UNION
SELECT 'route_stops', COUNT(*) FROM route_stops WHERE is_deleted = TRUE
UNION
SELECT 'student_transports', COUNT(*) FROM student_transports WHERE is_deleted = TRUE
UNION
SELECT 'drop_off_recipients', COUNT(*) FROM drop_off_recipients WHERE is_deleted = TRUE
UNION
SELECT 'transport_logs', COUNT(*) FROM transport_logs WHERE is_deleted = TRUE
UNION
SELECT 'transport_exceptions', COUNT(*) FROM transport_exceptions WHERE is_deleted = TRUE;

-- Archive old completed routes (mark as deleted)
-- WARNING: Use with caution - this is a hard delete example
-- UPDATE routes SET is_deleted = TRUE 
-- WHERE status = 'completed' 
-- AND actual_end_time < DATE_SUB(CURDATE(), INTERVAL 90 DAY);

-- Analyze table performance
ANALYZE TABLE vehicles;
ANALYZE TABLE routes;
ANALYZE TABLE route_stops;
ANALYZE TABLE student_transports;
ANALYZE TABLE drop_off_recipients;
ANALYZE TABLE transport_logs;
ANALYZE TABLE transport_exceptions;

-- Optimize tables
OPTIMIZE TABLE vehicles;
OPTIMIZE TABLE routes;
OPTIMIZE TABLE route_stops;
OPTIMIZE TABLE student_transports;
OPTIMIZE TABLE drop_off_recipients;
OPTIMIZE TABLE transport_logs;
OPTIMIZE TABLE transport_exceptions;

-- =====================================================
-- 10. TEST DATA INSERTION
-- =====================================================

-- NOTE: Replace UUID_PLACEHOLDERS with actual UUIDs from your system

-- Insert test vehicle
-- INSERT INTO vehicles (id, school_id, vehicle_name, registration_plate, vehicle_type, capacity, driver_id, status, created_at, updated_at)
-- VALUES (UUID(), 'SCHOOL_UUID', 'Test Bus', 'TEST-123', 'bus', 50, NULL, 'active', NOW(), NOW());

-- Insert test route
-- INSERT INTO routes (id, school_id, vehicle_id, driver_id, route_name, route_type, status, scheduled_start_time, created_at, updated_at)
-- VALUES (UUID(), 'SCHOOL_UUID', 'VEHICLE_UUID', 'DRIVER_UUID', 'Test Route', 'round_trip', 'scheduled', NOW(), NOW(), NOW());

-- =====================================================
-- END OF USEFUL QUERIES
-- =====================================================
