# News Scraps Database Schema

## 테이블 설계

### news_scraps (경제 뉴스 스크랩)

사용자가 스크랩한 경제 뉴스와 적용점을 저장하는 테이블입니다.

```sql
CREATE TABLE news_scraps (
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
CREATE INDEX idx_news_scraps_user_id ON news_scraps(user_id);
CREATE INDEX idx_news_scraps_created_at ON news_scraps(created_at);
CREATE INDEX idx_news_scraps_user_date ON news_scraps(user_id, created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE news_scraps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own news scraps"
  ON news_scraps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own news scraps"
  ON news_scraps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own news scraps"
  ON news_scraps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own news scraps"
  ON news_scraps FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for automatic updated_at update
CREATE TRIGGER update_news_scraps_updated_at
    BEFORE UPDATE ON news_scraps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 데이터 로딩 전략

### News Scraps

- **전체 리스트 로딩**
  - 사용자별로 모든 스크랩 기록 로드
  - 최신순으로 정렬 (created_at DESC)

```typescript
// Load all scraps for current user
const { data, error } = await supabase
  .from('news_scraps')
  .select('*')
  .order('created_at', { ascending: false });
```

- **오늘 날짜 기록 카운트 (대시보드용)**
  - Asia/Seoul 타임존 기준 오늘 00:00 ~ 23:59
  - count 쿼리로 개수만 확인

```typescript
// Get today's count for dashboard
const today = new Date();
const startOfDay = new Date(today.setHours(0, 0, 0, 0));
const endOfDay = new Date(today.setHours(23, 59, 59, 999));

const { count, error } = await supabase
  .from('news_scraps')
  .select('*', { count: 'exact', head: true })
  .gte('created_at', startOfDay.toISOString())
  .lte('created_at', endOfDay.toISOString());
```

## 주의사항

1. **사용자 격리**: RLS를 통한 데이터 보안 보장
2. **초기 상태**: 항상 빈 리스트로 시작
3. **대시보드 연동**: 저장된 데이터는 DB에 없고 실시간 집계로 계산
4. **타임존**: Asia/Seoul 기준으로 오늘 날짜 계산
5. **자동 업데이트**: updated_at은 트리거로 자동 관리
