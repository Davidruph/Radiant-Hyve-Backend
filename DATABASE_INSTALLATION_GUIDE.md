# Transport Database Schema - Installation Guide

## Overview

This guide explains how to add the transport management tables to your database.

## Files Included

- `TRANSPORT_DATABASE_SCHEMA.sql` - Complete SQL schema for all 7 tables

## What Gets Created

### 7 Core Tables

1. **vehicles** - Vehicle information and driver assignments
2. **routes** - Route lifecycle tracking
3. **route_stops** - Individual stops within routes
4. **student_transports** - Student status throughout journey
5. **drop_off_recipients** - Authorized recipients for handoff
6. **transport_logs** - Audit trail of all events
7. **transport_exceptions** - Exception tracking and resolution

### 3 Useful Views

- `active_routes_view` - Current routes with summary stats
- `route_completion_summary` - Completed routes analysis
- `open_exceptions_report` - Outstanding exceptions

## Installation Steps

### Option 1: Using MySQL CLI

```bash
# Connect to your database
mysql -u [username] -p [database_name] < TRANSPORT_DATABASE_SCHEMA.sql

# Example:
mysql -u root -p radiant_hyve < TRANSPORT_DATABASE_SCHEMA.sql
```

### Option 2: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your database
3. File → Open SQL Script
4. Select `TRANSPORT_DATABASE_SCHEMA.sql`
5. Execute (Cmd+Enter or Ctrl+Enter)

### Option 3: Using PHPMyAdmin

1. Login to PHPMyAdmin
2. Select your database
3. Go to "SQL" tab
4. Paste contents of `TRANSPORT_DATABASE_SCHEMA.sql`
5. Click "Go"

### Option 4: Using Node.js/Sequelize

If using Sequelize ORM (already set up in your project):

```javascript
// In your database initialization file
const db = require("./config/db");

// Run migrations
db.sync({ force: false, alter: true }).then(() => {
  console.log("Tables synced successfully");
});
```

## Table Structure Details

### 1. VEHICLES TABLE

```
Columns:
- id (UUID PRIMARY KEY)
- school_id (FK → users)
- vehicle_name (VARCHAR)
- registration_plate (VARCHAR UNIQUE)
- vehicle_type (ENUM: bus, van, car)
- capacity (INT)
- driver_id (FK → users, nullable)
- color (VARCHAR)
- year_of_manufacture (INT)
- insurance_expiry (DATE)
- status (ENUM: active, inactive, maintenance)
- is_deleted (BOOLEAN)
- created_at, updated_at (TIMESTAMPS)

Indexes:
- PRIMARY: id
- FOREIGN: school_id, driver_id
- INDEX: status, registration_plate
```

### 2. ROUTES TABLE

```
Columns:
- id (UUID PRIMARY KEY)
- school_id (FK → users)
- vehicle_id (FK → vehicles)
- driver_id (FK → users)
- route_name (VARCHAR)
- route_type (ENUM: pickup, dropoff, round_trip)
- status (ENUM: scheduled, active, completed, cancelled)
- scheduled_start_time, actual_start_time (DATETIME)
- scheduled_end_time, actual_end_time (DATETIME)
- final_vehicle_check_confirmed (BOOLEAN)
- final_check_timestamp (DATETIME)
- notes (TEXT)
- is_deleted (BOOLEAN)
- created_at, updated_at (TIMESTAMPS)

Indexes:
- PRIMARY: id
- FOREIGN: school_id, vehicle_id, driver_id
- INDEX: status, scheduled_start_time
```

### 3. ROUTE STOPS TABLE

```
Columns:
- id (UUID PRIMARY KEY)
- route_id (FK → routes)
- stop_sequence (INT) - Unique per route
- stop_name (VARCHAR)
- latitude, longitude (DECIMAL)
- address (TEXT)
- stop_type (ENUM: pickup, dropoff)
- scheduled_arrival_time, actual_arrival_time (DATETIME)
- status (ENUM: pending, in_progress, completed, skipped)
- is_deleted (BOOLEAN)
- created_at, updated_at (TIMESTAMPS)

Indexes:
- PRIMARY: id
- FOREIGN: route_id
- INDEX: stop_sequence
- UNIQUE: route_id + stop_sequence
```

### 4. STUDENT TRANSPORTS TABLE

```
Columns:
- id (UUID PRIMARY KEY)
- route_id (FK → routes)
- student_id (FK → students)
- route_stop_id (FK → route_stops)
- pickup_status (ENUM: pending_pickup, picked_up, absent, skipped)
- pickup_timestamp (DATETIME)
- pickup_latitude, pickup_longitude (DECIMAL)
- skip_reason (TEXT)
- current_status (ENUM: pending, in_vehicle, dropped_off, exception)
- dropoff_status (ENUM: pending, completed, exception)
- dropoff_timestamp (DATETIME)
- dropoff_latitude, dropoff_longitude (DECIMAL)
- sequence_position (INT)
- is_deleted (BOOLEAN)
- created_at, updated_at (TIMESTAMPS)

Indexes:
- PRIMARY: id
- FOREIGN: route_id, student_id, route_stop_id
- INDEX: pickup_status, current_status, sequence_position
- UNIQUE: route_id + student_id
```

### 5. DROP-OFF RECIPIENTS TABLE

```
Columns:
- id (UUID PRIMARY KEY)
- student_id (FK → students)
- school_id (FK → users)
- recipient_type (ENUM: parent, authorized_person)
- recipient_name (VARCHAR)
- recipient_phone (VARCHAR)
- relationship_to_student (VARCHAR)
- is_primary (BOOLEAN)
- is_active (BOOLEAN)
- is_deleted (BOOLEAN)
- created_at, updated_at (TIMESTAMPS)

Indexes:
- PRIMARY: id
- FOREIGN: student_id, school_id
- INDEX: is_active, is_primary
```

### 6. TRANSPORT LOGS TABLE

```
Columns:
- id (UUID PRIMARY KEY)
- route_id (FK → routes)
- student_id (FK → students, nullable)
- driver_id (FK → users)
- event_type (ENUM: route_started, pickup_completed, dropoff_completed, etc.)
- event_description (TEXT)
- latitude, longitude (DECIMAL)
- additional_data (JSON)
- is_deleted (BOOLEAN)
- created_at, updated_at (TIMESTAMPS)

Indexes:
- PRIMARY: id
- FOREIGN: route_id, student_id, driver_id
- INDEX: event_type, created_at
- COMPOSITE: route_id + event_type + created_at
```

### 7. TRANSPORT EXCEPTIONS TABLE

```
Columns:
- id (UUID PRIMARY KEY)
- route_id (FK → routes)
- student_id (FK → students, nullable)
- exception_type (ENUM: student_absent, no_authorized_recipient, etc.)
- severity (ENUM: low, medium, high, critical)
- description (TEXT)
- status (ENUM: open, acknowledged, resolved)
- resolved_by (FK → users, nullable)
- resolution_notes (TEXT)
- resolved_at (DATETIME)
- is_deleted (BOOLEAN)
- created_at, updated_at (TIMESTAMPS)

Indexes:
- PRIMARY: id
- FOREIGN: route_id, student_id, resolved_by
- INDEX: exception_type, severity, status
- COMPOSITE: route_id + severity
```

## Key Features

### 1. Foreign Key Constraints

- All relationships properly enforced
- CASCADE delete on route/vehicle/student deletion
- SET NULL on optional relationships

### 2. Indexes

- Primary keys on all tables
- Foreign keys indexed for JOIN performance
- Composite indexes on frequently queried combinations
- UNIQUE constraints where needed

### 3. Data Types

- UUIDs for all primary keys (matches Sequelize models)
- DECIMAL(10,8) for latitude, DECIMAL(11,8) for longitude
- ENUM for controlled vocabularies
- JSON for flexible additional data
- TIMESTAMP with automatic update

### 4. Audit Trail

- All tables have `created_at` and `updated_at`
- `is_deleted` soft delete flag on all tables
- Transport logs record all events with GPS coordinates
- Exceptions track resolution with admin and timestamp

## Relationships Diagram

```
users (school_id)
├── vehicles
│   └── routes
│       ├── route_stops
│       │   └── student_transports
│       │       ├── transport_logs
│       │       ├── transport_exceptions
│       │       └── drop_off_recipients (via student_id)
│       └── transport_logs
│       └── transport_exceptions

students
├── student_transports (via routes)
├── drop_off_recipients
└── transport_logs (via routes)
└── transport_exceptions (via routes)
```

## Useful Queries

### Get Active Routes with Stats

```sql
SELECT * FROM active_routes_view;
```

### Get Route Completion Summary

```sql
SELECT * FROM route_completion_summary;
```

### Get Open Exceptions

```sql
SELECT * FROM open_exceptions_report;
```

### Find All Routes for a School

```sql
SELECT * FROM routes
WHERE school_id = 'school-uuid'
AND status IN ('scheduled', 'active')
ORDER BY scheduled_start_time DESC;
```

### Get Vehicle Utilization

```sql
SELECT
  v.vehicle_name,
  v.registration_plate,
  COUNT(r.id) as total_routes,
  SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed_routes
FROM vehicles v
LEFT JOIN routes r ON v.id = r.vehicle_id
GROUP BY v.id
ORDER BY total_routes DESC;
```

### Find Students with Missing Recipients

```sql
SELECT s.id, s.first_name, s.last_name
FROM students s
LEFT JOIN drop_off_recipients dor ON s.id = dor.student_id AND dor.is_active = TRUE
WHERE dor.id IS NULL;
```

### Get Exception Summary by Type

```sql
SELECT
  exception_type,
  severity,
  COUNT(*) as count,
  SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
FROM transport_exceptions
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY exception_type, severity
ORDER BY count DESC;
```

## Verification

After installation, verify all tables were created:

```sql
-- Show all tables
SHOW TABLES LIKE '%route%' OR LIKE '%vehicle%' OR LIKE '%transport%';

-- Show table structure
DESCRIBE vehicles;
DESCRIBE routes;
DESCRIBE route_stops;
DESCRIBE student_transports;
DESCRIBE drop_off_recipients;
DESCRIBE transport_logs;
DESCRIBE transport_exceptions;

-- Show views
SHOW FULL TABLES WHERE TABLE_TYPE LIKE 'VIEW';
```

## Backup Before Installation

```bash
# Backup your database
mysqldump -u [username] -p [database_name] > backup_before_transport.sql

# If you need to restore:
mysql -u [username] -p [database_name] < backup_before_transport.sql
```

## Troubleshooting

### Foreign Key Constraint Errors

- Ensure `users` and `students` tables exist first
- Check that foreign key constraints are enabled:
  ```sql
  SET FOREIGN_KEY_CHECKS = 1;
  ```

### UUID Issues

- Ensure your database supports UUID
- If using auto-increment IDs instead, modify CHAR(36) to INT AUTO_INCREMENT

### Performance Issues

- Run ANALYZE on tables after large data inserts:
  ```sql
  ANALYZE TABLE vehicles, routes, route_stops, student_transports, drop_off_recipients, transport_logs, transport_exceptions;
  ```

### View Errors

- If views fail to create, ensure they're created after all tables
- Views depend on tables existing first

## Next Steps

1. ✅ Run the SQL script to create tables
2. ✅ Verify tables are created correctly
3. ✅ Update backend `config/db.js` if needed
4. ✅ Run Sequelize sync to initialize models
5. ✅ Test API endpoints
6. ✅ Deploy to production

---

**Created:** April 24, 2026  
**Version:** 1.0  
**Status:** Ready for Database Installation
