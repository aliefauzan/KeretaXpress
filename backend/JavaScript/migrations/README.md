# 🗄️ Database Migrations for KeretaXpress Backend

This document outlines the database migration process for the KeretaXpress Node.js backend. Migrations are used to manage changes to the database schema.

## 📋 Quick Start

### Running All Migrations (Recommended)

To run all pending migrations in sequence, use the `run_all.js` script:

```bash
cd backend/JavaScript
node migrations/scripts/run_all.js
```

This script will execute all `.sql` files found in the `migrations/` directory in alphanumeric order.

### Running a Single Migration

To execute a specific migration file, use the `run_migration.js` script:

```bash
cd backend/JavaScript
node migrations/scripts/run_migration.js 01_create_users_table.sql
```

Replace `01_create_users_table.sql` with the actual filename of the migration you wish to run.

### Manual Execution

Alternatively, you can manually execute the SQL content of each file using a PostgreSQL client (e.g., pgAdmin, DBeaver, or Supabase SQL Editor).

## 📁 Structure

The `migrations/` directory contains the SQL migration files and Node.js scripts to run them:

```
migrations/
├── 01_create_users_table.sql               # Creates the 'users' table.
├── 02_create_admins_table.sql              # Creates the 'admins' table.
├── 03_create_stations_table.sql            # Creates the 'stations' table.
├── 04_create_trains_table.sql              # Creates the 'trains' table.
├── 05_create_bookings_table.sql            # Creates the 'bookings' table.
├── 06_create_payments_table.sql            # Creates the 'payments' table.
├── 07_create_booking_history_table.sql     # Creates the 'booking_history' table.
├── 08_create_notifications_table.sql       # Creates the 'notifications' table.
├── 09_fix_payments_table_constraints.sql   # Fixes constraints on the 'payments' table.
├── schema.dbml                             # DBML schema definition for visualization (e.g., dbdiagram.io).
├── complete_schema.sql                     # Full database schema for reference and visualization tools.
└── scripts/
    ├── run_all.js                          # Node.js script to run all migrations.
    └── run_migration.js                    # Node.js script to run a single migration.
```

## ✅ Verify Migration

After running migrations, you can verify the created tables by connecting to your PostgreSQL database and executing the following SQL query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables to be present:
- `admins`
- `booking_history`
- `bookings`
- `notifications`
- `payments`
- `stations`
- `trains`
- `users`
- `train_maintenance` (if exists from other migration)

---

## ⚠️ Important Notes

-   Always back up your database before running migrations.
-   Test migrations on a development environment before applying them to production.
-   The `schema.dbml` and `complete_schema.sql` files are primarily for schema visualization and reference. While `complete_schema.sql` can be run, it's generally recommended to use the individual migration scripts for controlled schema evolution.

---

## 🆘 Troubleshooting

### "Table already exists" error

This usually means the table you are trying to create already exists in your database. You might have run the migration previously or are trying to run a `CREATE TABLE` statement on an existing table.

**Solution**:
-   If running `run_all.js`, ensure your database is clean or that the SQL files use `CREATE TABLE IF NOT EXISTS`.
-   If manually running, check the table existence before executing.

### Foreign key constraint errors

These errors occur when a foreign key constraint references a table or column that does not exist, or if there's a data integrity issue.

**Solution**:
-   Ensure all referenced tables are created before their dependent tables.
-   Check the migration order and ensure all prerequisite migrations have been run.

---