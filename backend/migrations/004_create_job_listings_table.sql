-- Migration: Create job_listings table
-- Description: 사용자가 관심 있는 채용 공고를 저장하고 관리하는 테이블 생성
-- Date: 2026-02-01

-- Create job_listings table
CREATE TABLE IF NOT EXISTS job_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  location TEXT,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('대기업', '중견기업', '중소기업', '스타트업')),
  status TEXT NOT NULL DEFAULT 'Not applied' CHECK (status IN ('Not applied', 'Applied')),
  deadline DATE,
  job_post_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_listings_user_id ON job_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_deadline ON job_listings(deadline);
CREATE INDEX IF NOT EXISTS idx_job_listings_status ON job_listings(status);

-- Enable RLS
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own job listings"
  ON job_listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job listings"
  ON job_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job listings"
  ON job_listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own job listings"
  ON job_listings FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_job_listings_updated_at
  BEFORE UPDATE ON job_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE job_listings IS '사용자가 관심 있는 채용 공고를 저장하고 관리하는 테이블';
