# Job Listings Schema

## Table: job_listings

사용자가 관심 있는 채용 공고를 저장하고 관리하는 테이블입니다.

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 고유 식별자 |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | 사용자 ID |
| company | TEXT | NOT NULL | 회사명 |
| position | TEXT | NOT NULL | 포지션/직무 |
| location | TEXT | NULL | 근무 위치 |
| industry | TEXT | NULL | 산업/분야 |
| company_size | TEXT | NULL | 기업 규모 (대기업, 중견기업, 중소기업, 스타트업) |
| status | TEXT | NOT NULL, DEFAULT 'Not applied' | 지원 상태 (Not applied, Applied) |
| deadline | DATE | NULL | 마감일 |
| job_post_url | TEXT | NULL | 채용 공고 URL |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | 생성일 |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | 수정일 |

### Indexes

- `idx_job_listings_user_id` on `user_id`
- `idx_job_listings_deadline` on `deadline`
- `idx_job_listings_status` on `status`

### RLS (Row Level Security)

모든 사용자는 자신의 채용 공고만 조회/수정/삭제할 수 있습니다.

```sql
-- Enable RLS
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select their own job listings
CREATE POLICY "Users can view own job listings"
  ON job_listings FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own job listings
CREATE POLICY "Users can insert own job listings"
  ON job_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own job listings
CREATE POLICY "Users can update own job listings"
  ON job_listings FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own job listings
CREATE POLICY "Users can delete own job listings"
  ON job_listings FOR DELETE
  USING (auth.uid() = user_id);
```

### Triggers

```sql
-- Auto-update updated_at timestamp
CREATE TRIGGER update_job_listings_updated_at
  BEFORE UPDATE ON job_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Business Logic

- 상태가 "Not applied"에서 "Applied"로 변경되면 applications 테이블로 데이터 이동
- 마감일이 있는 공고는 캘린더에 표시
- 필터링: 직무, 기업 규모
