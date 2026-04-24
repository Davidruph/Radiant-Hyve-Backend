# Transport Database Tables - Quick Reference

## 📊 All Tables at a Glance

### 1. VEHICLES

Store vehicle information and current driver assignments

| Column              | Type      | Notes                         |
| ------------------- | --------- | ----------------------------- |
| id                  | UUID      | Primary Key                   |
| school_id           | UUID      | FK → users (school admin)     |
| vehicle_name        | VARCHAR   | e.g., "Bus A", "Van 1"        |
| registration_plate  | VARCHAR   | UNIQUE license plate          |
| vehicle_type        | ENUM      | bus, van, car                 |
| capacity            | INT       | Max students                  |
| driver_id           | UUID      | FK → users (current driver)   |
| color               | VARCHAR   | Vehicle color                 |
| year_of_manufacture | INT       | Year of manufacture           |
| insurance_expiry    | DATE      | Insurance expiry date         |
| status              | ENUM      | active, inactive, maintenance |
| is_deleted          | BOOLEAN   | Soft delete flag              |
| created_at          | TIMESTAMP | Auto-set                      |
| updated_at          | TIMESTAMP | Auto-updated                  |

---

### 2. ROUTES

Manage route lifecycle from scheduled to completed

| Column                        | Type      | Notes                                   |
| ----------------------------- | --------- | --------------------------------------- |
| id                            | UUID      | Primary Key                             |
| school_id                     | UUID      | FK → users (school)                     |
| vehicle_id                    | UUID      | FK → vehicles                           |
| driver_id                     | UUID      | FK → users (assigned driver)            |
| route_name                    | VARCHAR   | e.g., "Morning Route A"                 |
| route_type                    | ENUM      | pickup, dropoff, round_trip             |
| status                        | ENUM      | scheduled, active, completed, cancelled |
| scheduled_start_time          | DATETIME  | Planned start                           |
| actual_start_time             | DATETIME  | When driver started                     |
| scheduled_end_time            | DATETIME  | Planned end                             |
| actual_end_time               | DATETIME  | When driver ended                       |
| final_vehicle_check_confirmed | BOOLEAN   | Safety check verified                   |
| final_check_timestamp         | DATETIME  | When check was done                     |
| notes                         | TEXT      | Additional notes                        |
| is_deleted                    | BOOLEAN   | Soft delete flag                        |
| created_at                    | TIMESTAMP | Auto-set                                |
| updated_at                    | TIMESTAMP | Auto-updated                            |

---

### 3. ROUTE_STOPS

Individual pickup/dropoff points within a route

| Column                 | Type          | Notes                                    |
| ---------------------- | ------------- | ---------------------------------------- |
| id                     | UUID          | Primary Key                              |
| route_id               | UUID          | FK → routes                              |
| stop_sequence          | INT           | Order in route (1, 2, 3...)              |
| stop_name              | VARCHAR       | e.g., "School Gate", "Park"              |
| latitude               | DECIMAL(10,8) | GPS coordinate                           |
| longitude              | DECIMAL(11,8) | GPS coordinate                           |
| address                | TEXT          | Full address                             |
| stop_type              | ENUM          | pickup or dropoff                        |
| scheduled_arrival_time | DATETIME      | Planned arrival                          |
| actual_arrival_time    | DATETIME      | Actual arrival                           |
| status                 | ENUM          | pending, in_progress, completed, skipped |
| is_deleted             | BOOLEAN       | Soft delete flag                         |
| created_at             | TIMESTAMP     | Auto-set                                 |
| updated_at             | TIMESTAMP     | Auto-updated                             |

---

### 4. STUDENT_TRANSPORTS

Track each student's status throughout transport journey

| Column            | Type          | Notes                                       |
| ----------------- | ------------- | ------------------------------------------- |
| id                | UUID          | Primary Key                                 |
| route_id          | UUID          | FK → routes                                 |
| student_id        | UUID          | FK → students                               |
| route_stop_id     | UUID          | FK → route_stops (pickup point)             |
| pickup_status     | ENUM          | pending_pickup, picked_up, absent, skipped  |
| pickup_timestamp  | DATETIME      | When picked up                              |
| pickup_latitude   | DECIMAL(10,8) | Pickup GPS                                  |
| pickup_longitude  | DECIMAL(11,8) | Pickup GPS                                  |
| skip_reason       | TEXT          | Why skipped (if applicable)                 |
| current_status    | ENUM          | pending, in_vehicle, dropped_off, exception |
| dropoff_status    | ENUM          | pending, completed, exception               |
| dropoff_timestamp | DATETIME      | When dropped off                            |
| dropoff_latitude  | DECIMAL(10,8) | Dropoff GPS                                 |
| dropoff_longitude | DECIMAL(11,8) | Dropoff GPS                                 |
| sequence_position | INT           | Position in pickup/dropoff order            |
| is_deleted        | BOOLEAN       | Soft delete flag                            |
| created_at        | TIMESTAMP     | Auto-set                                    |
| updated_at        | TIMESTAMP     | Auto-updated                                |

---

### 5. DROP_OFF_RECIPIENTS

Authorized people to receive students at dropoff

| Column                  | Type      | Notes                          |
| ----------------------- | --------- | ------------------------------ |
| id                      | UUID      | Primary Key                    |
| student_id              | UUID      | FK → students                  |
| school_id               | UUID      | FK → users (school)            |
| recipient_type          | ENUM      | parent or authorized_person    |
| recipient_name          | VARCHAR   | Name of recipient              |
| recipient_phone         | VARCHAR   | Contact number                 |
| relationship_to_student | VARCHAR   | Mother, Father, Guardian, etc. |
| is_primary              | BOOLEAN   | Primary recipient flag         |
| is_active               | BOOLEAN   | Currently active               |
| is_deleted              | BOOLEAN   | Soft delete flag               |
| created_at              | TIMESTAMP | Auto-set                       |
| updated_at              | TIMESTAMP | Auto-updated                   |

---

### 6. TRANSPORT_LOGS

Complete audit trail of all transport events

| Column            | Type          | Notes                                                                              |
| ----------------- | ------------- | ---------------------------------------------------------------------------------- |
| id                | UUID          | Primary Key                                                                        |
| route_id          | UUID          | FK → routes                                                                        |
| student_id        | UUID          | FK → students (nullable)                                                           |
| driver_id         | UUID          | FK → users (who performed action)                                                  |
| event_type        | ENUM          | route_started, pickup_completed, dropoff_completed, final_check, route_ended, etc. |
| event_description | TEXT          | Detailed description                                                               |
| latitude          | DECIMAL(10,8) | GPS at event                                                                       |
| longitude         | DECIMAL(11,8) | GPS at event                                                                       |
| additional_data   | JSON          | Extra data in JSON format                                                          |
| is_deleted        | BOOLEAN       | Soft delete flag                                                                   |
| created_at        | TIMESTAMP     | Auto-set                                                                           |
| updated_at        | TIMESTAMP     | Auto-updated                                                                       |

**Event Types:**

- route_started
- pickup_pending
- pickup_completed
- pickup_absent
- pickup_skipped
- dropoff_completed
- dropoff_exception
- final_check
- route_ended

---

### 7. TRANSPORT_EXCEPTIONS

Track exceptions and resolution status

| Column           | Type      | Notes                                                                                                                                         |
| ---------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| id               | UUID      | Primary Key                                                                                                                                   |
| route_id         | UUID      | FK → routes                                                                                                                                   |
| student_id       | UUID      | FK → students (nullable)                                                                                                                      |
| exception_type   | ENUM      | student_absent, student_skipped, no_authorized_recipient, route_delayed, driver_replaced, connectivity_loss, student_not_accounted_for, other |
| severity         | ENUM      | low, medium, high, critical                                                                                                                   |
| description      | TEXT      | What happened                                                                                                                                 |
| status           | ENUM      | open, acknowledged, resolved                                                                                                                  |
| resolved_by      | UUID      | FK → users (admin who resolved)                                                                                                               |
| resolution_notes | TEXT      | How it was resolved                                                                                                                           |
| resolved_at      | DATETIME  | When resolved                                                                                                                                 |
| is_deleted       | BOOLEAN   | Soft delete flag                                                                                                                              |
| created_at       | TIMESTAMP | Auto-set                                                                                                                                      |
| updated_at       | TIMESTAMP | Auto-updated                                                                                                                                  |

**Exception Types:**

- student_absent
- student_skipped
- no_authorized_recipient
- route_delayed
- driver_replaced
- connectivity_loss
- student_not_accounted_for
- other

---

## 📈 Table Relationships

```
users (school)
    ↓
vehicles (school_id + driver_id)
    ↓
routes (school_id + vehicle_id + driver_id)
    ├── route_stops (route_id)
    │   ↓
    │   student_transports (route_stop_id)
    ├── transport_logs (route_id + driver_id)
    └── transport_exceptions (route_id)

students
    ├── student_transports (student_id)
    └── drop_off_recipients (student_id)
```

---

## 🔑 Foreign Keys Summary

| Table                | Foreign Key   | References  | Behavior |
| -------------------- | ------------- | ----------- | -------- |
| vehicles             | school_id     | users       | CASCADE  |
| vehicles             | driver_id     | users       | SET NULL |
| routes               | school_id     | users       | CASCADE  |
| routes               | vehicle_id    | vehicles    | CASCADE  |
| routes               | driver_id     | users       | CASCADE  |
| route_stops          | route_id      | routes      | CASCADE  |
| student_transports   | route_id      | routes      | CASCADE  |
| student_transports   | student_id    | students    | CASCADE  |
| student_transports   | route_stop_id | route_stops | CASCADE  |
| drop_off_recipients  | student_id    | students    | CASCADE  |
| drop_off_recipients  | school_id     | users       | CASCADE  |
| transport_logs       | route_id      | routes      | CASCADE  |
| transport_logs       | student_id    | students    | SET NULL |
| transport_logs       | driver_id     | users       | CASCADE  |
| transport_exceptions | route_id      | routes      | CASCADE  |
| transport_exceptions | student_id    | students    | SET NULL |
| transport_exceptions | resolved_by   | users       | SET NULL |

---

## 📋 Indexes Summary

### Unique Indexes

- vehicles: registration_plate
- route_stops: route_id + stop_sequence
- student_transports: route_id + student_id

### Regular Indexes

- vehicles: school_id, driver_id, status, registration_plate
- routes: school_id, vehicle_id, driver_id, status, scheduled_start_time, route_type
- route_stops: route_id, stop_sequence, status
- student_transports: route_id, student_id, route_stop_id, pickup_status, current_status, sequence_position
- drop_off_recipients: student_id, school_id, is_active, is_primary
- transport_logs: route_id, student_id, driver_id, event_type, created_at
- transport_exceptions: route_id, student_id, exception_type, severity, status, created_at

### Composite Indexes

- vehicles: school_id + status, driver_id + status
- routes: school_id + status + scheduled_start_time, vehicle_id + scheduled_start_time, driver_id + status
- student_transports: route_id + pickup_status, student_id + current_status
- transport_logs: route_id + event_type + created_at, driver_id + created_at
- transport_exceptions: route_id + severity, exception_type + status

---

## 📊 Views Available

### 1. active_routes_view

Shows currently scheduled and active routes with statistics

```sql
SELECT * FROM active_routes_view;
```

Columns:

- id, route_name, status
- vehicle_name, registration_plate
- driver_name, driver_email
- scheduled_start_time
- total_students, students_picked_up, students_pending
- total_stops

---

### 2. route_completion_summary

Analytics on completed routes

```sql
SELECT * FROM route_completion_summary;
```

Columns:

- id, route_name
- scheduled_start_time, actual_start_time, actual_end_time
- vehicle_name, driver_name
- total_students, picked_up_count, absent_count, skipped_count
- final_vehicle_check_confirmed
- exceptions_count

---

### 3. open_exceptions_report

All outstanding exceptions needing attention

```sql
SELECT * FROM open_exceptions_report;
```

Columns:

- id, route_id, route_name
- student_id, student_name, last_name
- exception_type, severity, status
- created_at, created_by_admin
- description

---

## 💾 Storage Size Estimate

| Table                | Approx Size (per 1000 records) |
| -------------------- | ------------------------------ |
| vehicles             | 150 KB                         |
| routes               | 200 KB                         |
| route_stops          | 180 KB                         |
| student_transports   | 300 KB                         |
| drop_off_recipients  | 120 KB                         |
| transport_logs       | 250 KB                         |
| transport_exceptions | 200 KB                         |
| **TOTAL**            | **~1.4 MB**                    |

---

## 🚀 Installation Checklist

- [ ] Backup existing database
- [ ] Ensure MySQL version 5.7+
- [ ] Verify users and students tables exist
- [ ] Run TRANSPORT_DATABASE_SCHEMA.sql
- [ ] Verify all 7 tables created
- [ ] Verify all 3 views created
- [ ] Check indexes with: `SHOW INDEXES FROM [table_name];`
- [ ] Test sample queries
- [ ] Update backend config if needed
- [ ] Run API tests
- [ ] Monitor performance

---

**Version:** 1.0  
**Last Updated:** April 24, 2026  
**Status:** Ready for Deployment
