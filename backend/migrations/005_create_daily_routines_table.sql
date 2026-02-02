-- Migration: Create daily_routine_status table
-- Description: 사용자의 일일 루틴 체크 상태를 저장하는 테이블 생성
-- Date: 2026-02-01

-- Create daily_routine_status table
CREATE TABLE IF NOT EXISTS daily_routine_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  routine_key TEXT NOT NULL CHECK (routine_key IN ('wake_up', 'exercise', 'time_block', 'news_scrap', 'job_listing')),
  check_type TEXT NOT NULL CHECK (check_type IN ('self', 'auto')),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: 하루에 하나의 루틴은 한 번만 기록
  UNIQUE(user_id, date, routine_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_routine_user_date ON daily_routine_status(user_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_routine_user_date_key ON daily_routine_status(user_id, date, routine_key);

-- Enable RLS
ALTER TABLE daily_routine_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own daily routines"
  ON daily_routine_status FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily routines"
  ON daily_routine_status FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily routines"
  ON daily_routine_status FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily routines"
  ON daily_routine_status FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_daily_routine_status_updated_at
  BEFORE UPDATE ON daily_routine_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE daily_routine_status IS '사용자의 일일 루틴 체크 상태를 저장하는 테이블';
