# Transport Database - Complete Documentation Index

## 📚 Documentation Files

### 1. **TRANSPORT_DATABASE_SCHEMA.sql** ⭐ START HERE

**Purpose:** Complete SQL schema with all 7 tables  
**Contains:**

- All table definitions with columns and data types
- Foreign key relationships
- Indexes for performance optimization
- 3 pre-built views
- Timestamp and soft delete fields
- Comments explaining each field

**How to use:**

```bash
mysql -u [username] -p [database] < TRANSPORT_DATABASE_SCHEMA.sql
```

**Tables Created:**

1. vehicles
2. routes
3. route_stops
4. student_transports
5. drop_off_recipients
6. transport_logs
7. transport_exceptions

---

### 2. **DATABASE_INSTALLATION_GUIDE.md**

**Purpose:** Step-by-step installation and verification guide  
**Contains:**

- 4 different installation methods (CLI, Workbench, PHPMyAdmin, Sequelize)
- Complete table structure reference
- Relationship diagram
- Useful example queries
- Troubleshooting guide
- Backup instructions
- Performance optimization tips

**Best for:** First-time setup and troubleshooting

---

### 3. **TRANSPORT_TABLES_REFERENCE.md**

**Purpose:** Quick reference guide for all tables  
**Contains:**

- All 7 tables with columns and descriptions
- All 3 views with column listings
- Foreign key summary table
- Indexes summary
- Data type specifications
- Storage size estimates
- Installation checklist
- View descriptions

**Best for:** Quick lookups and understanding schema

---

### 4. **TRANSPORT_USEFUL_QUERIES.sql**

**Purpose:** Common SQL queries for operations and analytics  
**Contains:**

- Vehicle management queries (8 examples)
- Route management queries (7 examples)
- Route stops queries (3 examples)
- Student transport queries (8 examples)
- Drop-off recipient queries (4 examples)
- Transport log queries (4 examples)
- Transport exception queries (7 examples)
- Analytics and reports (3 examples)
- Data maintenance queries (5 examples)
- Test data insertion templates

**Best for:** Daily operations and reporting

---

## 🗂️ Quick Navigation

### I need to...

**Install the database**
→ Read: TRANSPORT_DATABASE_SCHEMA.sql + DATABASE_INSTALLATION_GUIDE.md

**Understand the schema**
→ Read: TRANSPORT_TABLES_REFERENCE.md

**Query the database**
→ Read: TRANSPORT_USEFUL_QUERIES.sql

**Check table definitions**
→ Read: TRANSPORT_TABLES_REFERENCE.md (Quick Reference section)

**Troubleshoot issues**
→ Read: DATABASE_INSTALLATION_GUIDE.md (Troubleshooting section)

**See relationships**
→ Read: TRANSPORT_TABLES_REFERENCE.md (Relationships section)

**Write reports**
→ Read: TRANSPORT_USEFUL_QUERIES.sql (Analytics section)

---

## 📋 Table Overview

| Table                | Purpose                              | Records      | Size   |
| -------------------- | ------------------------------------ | ------------ | ------ |
| vehicles             | Vehicle data & driver assignments    | ~50-200      | 150 KB |
| routes               | Route lifecycle (scheduled→complete) | ~500-2000    | 200 KB |
| route_stops          | Pickup/dropoff points                | ~2000-5000   | 180 KB |
| student_transports   | Student status during routes         | ~5000-20000  | 300 KB |
| drop_off_recipients  | Authorized recipients                | ~500-2000    | 120 KB |
| transport_logs       | Complete audit trail                 | ~10000-50000 | 250 KB |
| transport_exceptions | Exception tracking                   | ~500-5000    | 200 KB |

---

## 🔑 Key Concepts

### Workflow Status Flow

```
Route: scheduled → active → completed/cancelled
Stop: pending → in_progress → completed/skipped
StudentTransport:
  - pickup: pending_pickup → picked_up/absent/skipped
  - current: pending → in_vehicle → dropped_off/exception
  - dropoff: pending → completed/exception
```

### Safety Enforcement

- ✓ Route cannot start without pre-start checklist
- ✓ Route cannot end without all students accounted for
- ✓ Dropoff requires authorized recipient validation
- ✓ Final vehicle check mandatory before completion
- ✓ All actions logged with GPS coordinates

### Data Retention

- Soft delete via `is_deleted` flag
- Timestamps for audit trail (created_at, updated_at)
- Resolved_at timestamp for exception resolution
- JSON field for flexible additional data

---

## 🚀 Installation Sequence

### Step 1: Prepare

```bash
# Backup existing database
mysqldump -u root -p radiant_hyve > backup_before_transport.sql

# Verify connectivity
mysql -u root -p -e "SELECT VERSION();"
```

### Step 2: Execute Schema

```bash
# Run the main schema
mysql -u root -p radiant_hyve < TRANSPORT_DATABASE_SCHEMA.sql
```

### Step 3: Verify

```bash
# Check tables created
mysql -u root -p -e "SHOW TABLES LIKE '%transport%' OR LIKE '%vehicle%' OR LIKE '%route%';"

# Check specific table structure
mysql -u root -p -e "DESCRIBE routes;"

# Check views
mysql -u root -p -e "SHOW FULL TABLES FROM radiant_hyve WHERE TABLE_TYPE LIKE 'VIEW';"
```

### Step 4: Test

```bash
# Run test queries
mysql -u root -p radiant_hyve < TRANSPORT_USEFUL_QUERIES.sql

# Check view data
mysql -u root -p -e "SELECT * FROM active_routes_view LIMIT 5;"
```

### Step 5: Optimize

```bash
# Analyze tables
mysql -u root -p -e "ANALYZE TABLE vehicles, routes, route_stops, student_transports, drop_off_recipients, transport_logs, transport_exceptions;"

# Optimize tables
mysql -u root -p -e "OPTIMIZE TABLE vehicles, routes, route_stops, student_transports, drop_off_recipients, transport_logs, transport_exceptions;"
```

---

## 📊 Data Dictionary

### Enums

**vehicle_type:** bus, van, car  
**vehicle_status:** active, inactive, maintenance  
**route_type:** pickup, dropoff, round_trip  
**route_status:** scheduled, active, completed, cancelled  
**stop_type:** pickup, dropoff  
**stop_status:** pending, in_progress, completed, skipped  
**pickup_status:** pending_pickup, picked_up, absent, skipped  
**current_status:** pending, in_vehicle, dropped_off, exception  
**dropoff_status:** pending, completed, exception  
**recipient_type:** parent, authorized_person  
**event_type:** route_started, pickup_completed, dropoff_completed, final_check, route_ended, etc.  
**exception_type:** student_absent, student_skipped, no_authorized_recipient, route_delayed, driver_replaced, connectivity_loss, student_not_accounted_for, other  
**exception_severity:** low, medium, high, critical  
**exception_status:** open, acknowledged, resolved

---

## 🔍 Common Queries Quick Links

**Get active routes:**

```sql
SELECT * FROM active_routes_view;
```

**Get route completion summary:**

```sql
SELECT * FROM route_completion_summary;
```

**Get open exceptions:**

```sql
SELECT * FROM open_exceptions_report;
```

**Find students with no recipients:**

```sql
SELECT s.* FROM students s
LEFT JOIN drop_off_recipients dor ON s.id = dor.student_id
WHERE dor.id IS NULL;
```

**Get driver performance:**

```sql
SELECT driver_id, COUNT(*) as routes,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
FROM routes GROUP BY driver_id;
```

---

## 🛠️ Maintenance Tasks

### Daily

- Monitor open exceptions
- Verify final vehicle checks completed
- Check for any route delays

### Weekly

- Analyze table performance
- Review exception patterns
- Check insurance expiry alerts

### Monthly

- Optimize tables
- Archive old completed routes
- Generate utilization reports

### Quarterly

- Full database backup
- Performance tuning
- Storage review

---

## 🚨 Troubleshooting Reference

### Foreign Key Errors

→ Ensure users and students tables exist  
→ Check: `SET FOREIGN_KEY_CHECKS = 1;`

### UUID Issues

→ Use CHAR(36) for UUID fields  
→ Or change to INT AUTO_INCREMENT

### Performance Issues

→ Run ANALYZE TABLE command  
→ Check indexes with: SHOW INDEXES FROM [table]

### View Errors

→ Ensure all referenced tables exist first  
→ Create views after all tables

### Missing Data

→ Check is_deleted field (soft deletes)  
→ Look at timestamps for data time range

---

## 📞 Support Resources

### In These Files

1. **TRANSPORT_DATABASE_SCHEMA.sql** - View complete schema
2. **DATABASE_INSTALLATION_GUIDE.md** - Installation help
3. **TRANSPORT_TABLES_REFERENCE.md** - Table reference
4. **TRANSPORT_USEFUL_QUERIES.sql** - Query examples

### Other Resources

- Backend models: `/model/vehicle.js`, `/model/route.js`, etc.
- API endpoints: `/routes/transportRoutes.js`
- Frontend components: `/pages/admin/Transportation/`
- Driver dashboard: `/pages/driver/Dashboard/`

---

## ✅ Implementation Checklist

- [ ] Read TRANSPORT_DATABASE_SCHEMA.sql
- [ ] Read DATABASE_INSTALLATION_GUIDE.md
- [ ] Backup existing database
- [ ] Run schema script
- [ ] Verify all 7 tables created
- [ ] Verify all 3 views created
- [ ] Run test queries
- [ ] Optimize tables
- [ ] Update backend config (if needed)
- [ ] Run API tests
- [ ] Test driver dashboard workflow
- [ ] Test admin dashboard
- [ ] Monitor for 24 hours
- [ ] Deploy to production

---

## 📈 Next Steps

1. **Install Schema**
   - Execute TRANSPORT_DATABASE_SCHEMA.sql
   - Verify in DATABASE_INSTALLATION_GUIDE.md

2. **Test Queries**
   - Run examples from TRANSPORT_USEFUL_QUERIES.sql
   - Verify data integrity

3. **Connect Backend**
   - Update config/db.js with new models
   - Run Sequelize sync
   - Test API endpoints

4. **Frontend Testing**
   - Test admin transportation dashboard
   - Test driver dashboard
   - Test all workflows

5. **Production Deployment**
   - Final backup
   - Deploy schema
   - Monitor performance
   - Gather user feedback

---

## 📝 Version History

| Version | Date         | Changes                                                        |
| ------- | ------------ | -------------------------------------------------------------- |
| 1.0     | Apr 24, 2026 | Initial release with 7 tables, 3 views, complete documentation |

---

## 📞 Document Status

- **Created:** April 24, 2026
- **Last Updated:** April 24, 2026
- **Status:** ✅ Ready for Production
- **Compatibility:** MySQL 5.7+, Sequelize ORM

---

**Questions?** Refer to the specific documentation file based on your need:

- Schema questions → TRANSPORT_TABLES_REFERENCE.md
- Installation issues → DATABASE_INSTALLATION_GUIDE.md
- Query help → TRANSPORT_USEFUL_QUERIES.sql
- Full schema → TRANSPORT_DATABASE_SCHEMA.sql
