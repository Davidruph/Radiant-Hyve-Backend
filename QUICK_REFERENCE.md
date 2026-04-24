# Transport Database - Quick Reference Card

## 🚀 Installation (Copy & Paste)

```bash
mysql -u root -p your_database < TRANSPORT_DATABASE_SCHEMA.sql
```

## 📊 All 7 Tables

| #   | Table                | Columns | Purpose                  |
| --- | -------------------- | ------- | ------------------------ |
| 1   | vehicles             | 14      | Vehicle & driver info    |
| 2   | routes               | 15      | Route lifecycle          |
| 3   | route_stops          | 12      | Pickup/dropoff points    |
| 4   | student_transports   | 16      | Student journey tracking |
| 5   | drop_off_recipients  | 11      | Authorized recipients    |
| 6   | transport_logs       | 10      | Audit trail              |
| 7   | transport_exceptions | 11      | Exception tracking       |

## 👁️ Views (3 Total)

```sql
SELECT * FROM active_routes_view;           -- Current routes with stats
SELECT * FROM route_completion_summary;     -- Completed routes analysis
SELECT * FROM open_exceptions_report;       -- Outstanding exceptions
```

## 🔑 Key Fields

**vehicles:** vehicle_name, registration_plate, capacity, driver_id, status  
**routes:** route_name, vehicle_id, driver_id, status, scheduled_start_time  
**route_stops:** stop_name, stop_sequence, stop_type, latitude, longitude  
**student_transports:** pickup_status, current_status, sequence_position  
**drop_off_recipients:** recipient_name, recipient_type, is_primary  
**transport_logs:** event_type, event_description, latitude, longitude  
**transport_exceptions:** exception_type, severity, status, resolved_by

## 📋 Status Values

**route_status:** scheduled, active, completed, cancelled  
**pickup_status:** pending_pickup, picked_up, absent, skipped  
**current_status:** pending, in_vehicle, dropped_off, exception  
**exception_type:** student_absent, student_skipped, no_authorized_recipient, route_delayed, driver_replaced, connectivity_loss, student_not_accounted_for, other  
**severity:** low, medium, high, critical

## 🔍 Most Used Queries

```sql
-- Get active routes
SELECT * FROM active_routes_view;

-- Get vehicles for a school
SELECT * FROM vehicles WHERE school_id = 'SCHOOL_UUID' AND status = 'active';

-- Get route details
SELECT * FROM routes WHERE id = 'ROUTE_UUID' AND is_deleted = FALSE;

-- Get students in route
SELECT * FROM student_transports WHERE route_id = 'ROUTE_UUID' ORDER BY sequence_position;

-- Get open exceptions
SELECT * FROM open_exceptions_report;

-- Get driver history
SELECT * FROM routes WHERE driver_id = 'DRIVER_UUID' ORDER BY scheduled_start_time DESC;

-- Get recipients for student
SELECT * FROM drop_off_recipients WHERE student_id = 'STUDENT_UUID' AND is_active = TRUE;

-- Get event log
SELECT * FROM transport_logs WHERE route_id = 'ROUTE_UUID' ORDER BY created_at DESC;
```

## 🔗 Relationships

```
users ──┬─→ vehicles ──→ routes ──┬─→ route_stops ──→ student_transports
        │                         ├─→ transport_logs
        │                         └─→ transport_exceptions
        │
        └─→ drop_off_recipients ◄── students
                                      ├─→ student_transports
                                      ├─→ transport_logs
                                      └─→ transport_exceptions
```

## 📈 Common Joins

```sql
-- Route with vehicle and driver
SELECT r.*, v.vehicle_name, u.first_name as driver_name
FROM routes r
LEFT JOIN vehicles v ON r.vehicle_id = v.id
LEFT JOIN users u ON r.driver_id = u.id;

-- Student transport with student and route info
SELECT st.*, s.first_name, s.last_name, r.route_name
FROM student_transports st
LEFT JOIN students s ON st.student_id = s.id
LEFT JOIN routes r ON st.route_id = r.id;

-- Transport exception with route and student
SELECT te.*, r.route_name, s.first_name, s.last_name
FROM transport_exceptions te
LEFT JOIN routes r ON te.route_id = r.id
LEFT JOIN students s ON te.student_id = s.id;
```

## 🛠️ Management

```sql
-- Check table sizes
SELECT
  TABLE_NAME,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) as MB
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'your_database'
ORDER BY (data_length + index_length) DESC;

-- Analyze tables
ANALYZE TABLE vehicles, routes, route_stops, student_transports, drop_off_recipients, transport_logs, transport_exceptions;

-- Optimize tables
OPTIMIZE TABLE vehicles, routes, route_stops, student_transports, drop_off_recipients, transport_logs, transport_exceptions;

-- Check indexes
SHOW INDEXES FROM routes;

-- Row counts
SELECT 'vehicles' as table_name, COUNT(*) FROM vehicles
UNION
SELECT 'routes', COUNT(*) FROM routes
UNION
SELECT 'route_stops', COUNT(*) FROM route_stops
UNION
SELECT 'student_transports', COUNT(*) FROM student_transports
UNION
SELECT 'drop_off_recipients', COUNT(*) FROM drop_off_recipients
UNION
SELECT 'transport_logs', COUNT(*) FROM transport_logs
UNION
SELECT 'transport_exceptions', COUNT(*) FROM transport_exceptions;
```

## 📚 Documentation Files

- **TRANSPORT_DATABASE_SCHEMA.sql** - Full SQL schema (run this first)
- **TRANSPORT_TABLES_REFERENCE.md** - Complete table reference
- **TRANSPORT_USEFUL_QUERIES.sql** - 100+ query examples
- **DATABASE_INSTALLATION_GUIDE.md** - Setup help
- **TRANSPORT_DATABASE_INDEX.md** - Navigation guide

## ✅ Verification

```sql
-- Verify tables exist
SHOW TABLES LIKE '%transport%';

-- Verify views exist
SHOW FULL TABLES WHERE TABLE_TYPE LIKE 'VIEW';

-- Test a view
SELECT * FROM active_routes_view LIMIT 5;

-- Check table structure
DESCRIBE routes;
DESCRIBE student_transports;

-- Verify indexes
SHOW INDEXES FROM routes;
```

## 🎯 Start Here

1. Copy TRANSPORT_DATABASE_SCHEMA.sql
2. Run: `mysql -u root -p database < TRANSPORT_DATABASE_SCHEMA.sql`
3. Verify: `SHOW TABLES LIKE '%transport%';`
4. Test: `SELECT * FROM active_routes_view;`
5. Ready to go!

---

**Version:** 1.0 | **Date:** Apr 24, 2026 | **Status:** ✅ Ready
