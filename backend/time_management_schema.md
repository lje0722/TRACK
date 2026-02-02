# Time Management Database Schema

## 테이블 설계

### 1. time_logs (시간 기록 로그)

사용자의 시간 기록을 저장하는 테이블입니다.

```sql
CREATE TABLE time_logs (
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
CREATE INDEX idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX idx_time_logs_date ON time_logs(date);
CREATE INDEX idx_time_logs_user_date ON time_logs(user_id, date);

-- Enable Row Level Security (RLS)
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own time logs"
  ON time_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time logs"
  ON time_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time logs"
  ON time_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time logs"
  ON time_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for automatic updated_at update
CREATE TRIGGER update_time_logs_updated_at
    BEFORE UPDATE ON time_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. weekly_goals (주간 목표)

사용자의 주간 목표를 저장하는 테이블입니다.

```sql
CREATE TABLE weekly_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- Format: YYYY-MM
  week INTEGER NOT NULL CHECK (week >= 1 AND week <= 4),
  goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, year_month, week)
);

-- Indexes
CREATE INDEX idx_weekly_goals_user_id ON weekly_goals(user_id);
CREATE INDEX idx_weekly_goals_year_month ON weekly_goals(year_month);
CREATE INDEX idx_weekly_goals_user_month ON weekly_goals(user_id, year_month);

-- Enable Row Level Security (RLS)
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own weekly goals"
  ON weekly_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly goals"
  ON weekly_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly goals"
  ON weekly_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly goals"
  ON weekly_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for automatic updated_at update
CREATE TRIGGER update_weekly_goals_updated_at
    BEFORE UPDATE ON weekly_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 데이터 로딩 전략

### Time Logs

- **주간 범위 기준 로딩**
  - 선택된 주의 시작일 ~ 종료일 범위의 데이터만 로드
  - 예: 2026-01-26 ~ 2026-02-01

```typescript
// Example query
const { data, error } = await supabase
  .from('time_logs')
  .select('*')
  .gte('date', startDate)
  .lte('date', endDate)
  .order('date', { ascending: true })
  .order('start_hour', { ascending: true });
```

### Weekly Goals

- **현재 월 기준 로딩**
  - year_month 필드로 필터링 (예: "2026-01")
  - 해당 월의 1~4주차 목표 모두 로드

```typescript
// Example query
const { data, error } = await supabase
  .from('weekly_goals')
  .select('*')
  .eq('year_month', yearMonth)
  .order('week', { ascending: true });
```

## 카테고리 정의

```typescript
const CATEGORIES = [
  { id: "personal_study", label: "개인공부", color: "bg-emerald-200" },
  { id: "other", label: "기타", color: "bg-gray-200" },
  { id: "routine", label: "루틴", color: "bg-pink-200" },
  { id: "interview", label: "면접", color: "bg-purple-200" },
  { id: "meal", label: "식사", color: "bg-yellow-200" },
  { id: "exercise", label: "운동", color: "bg-lime-200" },
  { id: "sleep", label: "잠", color: "bg-slate-200" },
  { id: "resume", label: "자소서", color: "bg-blue-200" },
  { id: "certificate", label: "자격증", color: "bg-teal-200" },
];
```

## 주의사항

1. **로그 기반 설계**: 모든 데이터는 로그에서 계산하여 표시
2. **사용자 격리**: RLS를 통한 데이터 보안 보장
3. **주간 목표 UNIQUE 제약**: 같은 연월/주차에 중복 목표 방지
4. **시간 검증**: start_hour < end_hour 체크 (CONSTRAINT)
5. **자동 업데이트**: updated_at은 트리거로 자동 관리
