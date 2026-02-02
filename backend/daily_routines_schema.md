# Daily Routines Schema

## Table: daily_routine_status

사용자의 일일 루틴 체크 상태를 저장하는 테이블입니다.

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 고유 식별자 |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | 사용자 ID |
| date | DATE | NOT NULL | 루틴 날짜 (YYYY-MM-DD) |
| routine_key | TEXT | NOT NULL | 루틴 식별자 (wake_up, exercise, time_block, news_scrap, job_listing) |
| check_type | TEXT | NOT NULL | 체크 타입 (self: 직접 체크, auto: 자동 체크) |
| is_completed | BOOLEAN | NOT NULL, DEFAULT false | 완료 여부 |
| completed_at | TIMESTAMP WITH TIME ZONE | NULL | 완료 시간 |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | 생성일 |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | 수정일 |

### Indexes

- `idx_daily_routine_user_date` on `(user_id, date)`
- `idx_daily_routine_user_date_key` on `(user_id, date, routine_key)` (UNIQUE)

### Constraints

- `check_type` CHECK (check_type IN ('self', 'auto'))
- `routine_key` CHECK (routine_key IN ('wake_up', 'exercise', 'time_block', 'news_scrap', 'job_listing'))
- UNIQUE constraint on (user_id, date, routine_key) - 하루에 하나의 루틴은 한 번만 기록

### RLS (Row Level Security)

모든 사용자는 자신의 루틴만 조회/수정/삭제할 수 있습니다.

### Business Logic

1. **직접 체크 (Self Check):**
   - wake_up, exercise
   - 사용자가 직접 체크/해제 가능
   - 체크 시 is_completed = true, completed_at = NOW()
   - 해제 시 is_completed = false, completed_at = NULL

2. **자동 체크 (Auto Check):**
   - time_block: 타임 블록 계획 추가 시
   - news_scrap: 뉴스 스크랩 저장 시
   - job_listing: 기업 리스트 추가 시
   - 시스템이 자동으로 is_completed = true 설정
   - 사용자 직접 체크/해제 불가

3. **몰입도 계산:**
   - 오늘의 몰입도 = (완료한 루틴 수 / 전체 루틴 수) × 100
   - 예: 5개 루틴 중 3개 완료 → 60%

4. **날짜별 조회:**
   - 특정 날짜의 모든 루틴 상태 조회
   - 없으면 빈 배열 반환 (기본값 없음)
