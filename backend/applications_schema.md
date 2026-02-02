# Applications Schema

## Table: applications

사용자의 채용 지원 내역을 저장하는 테이블입니다.

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 고유 식별자 |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | 사용자 ID |
| company | TEXT | NOT NULL | 회사명 |
| position | TEXT | NOT NULL | 지원 포지션 |
| stage | TEXT | NOT NULL | 현재 진행 단계 (예: 서류 접수, 1차면접 합격 등) |
| progress | INTEGER | NOT NULL, CHECK (progress >= 0 AND progress <= 100) | 진행률 (0-100) |
| deadline | TIMESTAMP WITH TIME ZONE | NULL | 마감일 (없을 수 있음) |
| applied_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | 지원일 |
| status | TEXT | NOT NULL, DEFAULT 'active' | 상태 (active, reviewing, rejected, accepted) |
| url | TEXT | NULL | 채용 공고 URL |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | 생성일 |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | 수정일 |

### Indexes

- `idx_applications_user_id` on `user_id`
- `idx_applications_deadline` on `deadline`
- `idx_applications_status` on `status`

### RLS (Row Level Security)

모든 사용자는 자신의 지원 내역만 조회/수정/삭제할 수 있습니다.

```sql
-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select their own applications
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own applications
CREATE POLICY "Users can insert own applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own applications
CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own applications
CREATE POLICY "Users can delete own applications"
  ON applications FOR DELETE
  USING (auth.uid() = user_id);
```

### Triggers

```sql
-- Auto-update updated_at timestamp
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```
