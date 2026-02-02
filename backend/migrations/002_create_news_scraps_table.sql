-- ==================== News Scraps Table Migration ====================
-- This migration creates the news_scraps table with RLS policies
-- Execute this in Supabase SQL Editor

-- ==================== News Scraps Table ====================

CREATE TABLE IF NOT EXISTS news_scraps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_url TEXT NOT NULL,
  headline TEXT NOT NULL,
  content TEXT NOT NULL,
  applied_role TEXT,
  industry TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_news_scraps_user_id ON news_scraps(user_id);
CREATE INDEX IF NOT EXISTS idx_news_scraps_created_at ON news_scraps(created_at);
CREATE INDEX IF NOT EXISTS idx_news_scraps_user_date ON news_scraps(user_id, created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE news_scraps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for news_scraps
DROP POLICY IF EXISTS "Users can view their own news scraps" ON news_scraps;
CREATE POLICY "Users can view their own news scraps"
  ON news_scraps FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own news scraps" ON news_scraps;
CREATE POLICY "Users can insert their own news scraps"
  ON news_scraps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own news scraps" ON news_scraps;
CREATE POLICY "Users can update their own news scraps"
  ON news_scraps FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own news scraps" ON news_scraps;
CREATE POLICY "Users can delete their own news scraps"
  ON news_scraps FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for automatic updated_at update
DROP TRIGGER IF EXISTS update_news_scraps_updated_at ON news_scraps;
CREATE TRIGGER update_news_scraps_updated_at
    BEFORE UPDATE ON news_scraps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== Verification ====================

-- Verify tables were created successfully
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Created table: news_scraps';
  RAISE NOTICE 'Enabled RLS policies';
  RAISE NOTICE 'Created indexes for optimized queries';
END $$;
