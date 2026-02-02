-- ==================== Time Management Tables Migration ====================
-- This migration creates the time_logs and weekly_goals tables with RLS policies
-- Execute this in Supabase SQL Editor

-- ==================== Helper Function ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==================== Time Logs Table ====================

CREATE TABLE IF NOT EXISTS time_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL,
  start_hour INTEGER NOT NULL CHECK (start_hour >= 0 AND start_hour < 24),
  end_hour INTEGER NOT NULL CHECK (end_hour > 0 AND end_hour <= 24),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (end_hour > start_hour)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON time_logs(date);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_date ON time_logs(user_id, date);

-- Enable Row Level Security (RLS)
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for time_logs
DROP POLICY IF EXISTS "Users can view their own time logs" ON time_logs;
CREATE POLICY "Users can view their own time logs"
  ON time_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own time logs" ON time_logs;
CREATE POLICY "Users can insert their own time logs"
  ON time_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own time logs" ON time_logs;
CREATE POLICY "Users can update their own time logs"
  ON time_logs FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own time logs" ON time_logs;
CREATE POLICY "Users can delete their own time logs"
  ON time_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for automatic updated_at update
DROP TRIGGER IF EXISTS update_time_logs_updated_at ON time_logs;
CREATE TRIGGER update_time_logs_updated_at
    BEFORE UPDATE ON time_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== Weekly Goals Table ====================

CREATE TABLE IF NOT EXISTS weekly_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- Format: YYYY-MM
  week INTEGER NOT NULL CHECK (week >= 1 AND week <= 4),
  goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, year_month, week)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_id ON weekly_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_year_month ON weekly_goals(year_month);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_month ON weekly_goals(user_id, year_month);

-- Enable Row Level Security (RLS)
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_goals
DROP POLICY IF EXISTS "Users can view their own weekly goals" ON weekly_goals;
CREATE POLICY "Users can view their own weekly goals"
  ON weekly_goals FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own weekly goals" ON weekly_goals;
CREATE POLICY "Users can insert their own weekly goals"
  ON weekly_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own weekly goals" ON weekly_goals;
CREATE POLICY "Users can update their own weekly goals"
  ON weekly_goals FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own weekly goals" ON weekly_goals;
CREATE POLICY "Users can delete their own weekly goals"
  ON weekly_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for automatic updated_at update
DROP TRIGGER IF EXISTS update_weekly_goals_updated_at ON weekly_goals;
CREATE TRIGGER update_weekly_goals_updated_at
    BEFORE UPDATE ON weekly_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== Verification ====================

-- Verify tables were created successfully
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Created tables: time_logs, weekly_goals';
  RAISE NOTICE 'Enabled RLS policies for both tables';
  RAISE NOTICE 'Created indexes for optimized queries';
END $$;
