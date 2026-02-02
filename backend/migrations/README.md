# Database Migrations

This directory contains SQL migration files for the TRACK application.

## How to Execute Migrations in Supabase

### Method 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/wpowmixknjociaxktssw
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of the migration file (e.g., `001_create_time_management_tables.sql`)
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration
7. Check for success messages or errors in the Results panel

### Method 2: Using Supabase CLI (Alternative)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref wpowmixknjociaxktssw

# Run the migration
supabase db push
```

## Available Migrations

### 001_create_time_management_tables.sql

**Description:** Creates the core Time Management feature tables

**Tables Created:**
- `time_logs` - Stores user time tracking records
- `weekly_goals` - Stores weekly goals for each user

**Features:**
- Row Level Security (RLS) policies for data isolation
- Indexes for optimized query performance
- Automatic `updated_at` timestamp triggers
- Data validation constraints (time ranges, week numbers)

**Execute this migration to enable the Time Management feature in the frontend.**

## Migration Status

| Migration | Status | Executed Date |
|-----------|--------|---------------|
| 001_create_time_management_tables.sql | ⏳ Pending | - |
| 002_create_news_scraps_table.sql | ⏳ Pending | - |

## Notes

- Always backup your database before running migrations
- Migrations are idempotent (safe to run multiple times)
- Check the Supabase dashboard after migration to verify tables were created
