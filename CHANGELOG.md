# TRACK 프로젝트 변경 이력

## 2026-02-06: UI/UX 개선 & 버그 수정

### 주요 변경사항

1. **대시보드 Sticker 스크롤 기능**
   - 파일: `frontend/src/components/dashboard/Sticker.tsx`
   - 할 일이 12개를 초과하면 내부 스크롤 활성화 (`max-h-[340px] overflow-y-auto`)
   - X 버튼에 `mr-1` 추가하여 스크롤바와 겹침 방지

2. **뉴스 스크랩 - 적용점/인터뷰 질문 truncate**
   - 파일: `frontend/src/pages/NewsScrap.tsx`
   - 20자 초과 시 "..." 표시, 클릭하면 Popover로 전체 내용 확인

3. **뉴스 스크랩 - 수정 기능 추가**
   - 파일: `frontend/src/pages/NewsScrap.tsx`
   - 테이블에 수정 버튼(연필 아이콘) 추가
   - 기존 3단계 폼에서 데이터 로드 후 수정 가능
   - `updateNewsScrap` API 연동

4. **기업 지원 리스트 - 마감일 timezone 버그 수정**
   - 파일: `frontend/src/pages/JobListings.tsx`, `frontend/src/lib/job-listings.ts`
   - 문제: `new Date("YYYY-MM-DD")`가 UTC로 해석되어 한국 시간에서 하루 전으로 표시
   - 해결: `new Date(year, month - 1, day)` 로컬 타임존 파싱 적용
   - 저장 시에도 `toISOString()` 대신 로컬 타임존 기준 포맷 사용

5. **기업 지원 리스트 - 규모 컬럼 줄바꿈 방지**
   - 파일: `frontend/src/pages/JobListings.tsx`
   - 규모 컬럼에 `whitespace-nowrap` 추가하여 화면 축소 시 줄바꿈 방지

---

## 2026-02-05: 대시보드 실시간 동기화 & UI 개선

### 주요 변경사항

1. **자동 체크 실시간 동기화**
   - 시간관리, 뉴스스크랩, 기업리스트 페이지에서 작업 후 대시보드 자동 체크가 즉시 반영
   - `dashboardStore`에 `refreshTodayRoutines()` 추가, 각 페이지에서 auto-check 후 호출

2. **대시보드 StatCard 색상/멘트 적용**
   - 오늘의 몰입도 / 주간 누적 달성: 0-30% 빨간색, 31-70% 노란색, 71-100% 초록색
   - 이번 주 지원 완료: 0개 빨간색, 1개 노란색, 2개+ 초록색
   - 구간별 멘트 추가 (뭐하세요? / 할 수 있어요! / 고생했어요~)
   - 초록색 `emerald-400` → `green-500` (tailwind 커스텀 override 충돌 해결)

3. **시간관리 '개인공부' 카테고리 색상 수정**
   - `bg-emerald-200` → `bg-green-200` (tailwind emerald override로 색상 누락 해결)

4. **브라우저 탭 브랜딩**
   - 탭 제목: "Lovable App" → "TRACK"
   - 파비콘: TRACK 로고 SVG로 교체
   - 메타 태그(og:title 등) TRACK으로 통일

---

## 2026-02-04: 캘린더 일정 기능 & UI 개선

### 주요 변경사항

1. **JobListings 페이지 - 상태 옵션 정리**
   - 파일: `frontend/src/pages/JobListings.tsx`
   - 단계 컬럼: "Not applied", "Applied" 두 개만 표시

2. **Applications 페이지 - D-day 팝업 개선**
   - 파일: `frontend/src/pages/Applications.tsx`
   - D-day 팝업 중앙 정렬 (`align="center"`)
   - 상태 버튼 (인적성, AI면접, 1차면접, 2차면접) 저장된 상태에 따라 하이라이트
   - 다른 단계 선택 시 이전 하이라이트 해제

3. **Dashboard 캘린더 - 일정 추가 기능**
   - 파일: `frontend/src/components/dashboard/DashboardCalendar.tsx`
   - 파일: `frontend/src/lib/schedules.ts`
   - 날짜 클릭 → 팝업에서 일정 추가/삭제 가능
   - Application 이벤트 (기업명 + 단계) 팝업에 표시
   - D-day: rejected/accepted 제외한 모든 상태 표시

4. **Sticker 컴포넌트 개선**
   - 파일: `frontend/src/components/dashboard/Sticker.tsx`
   - 파일: `frontend/src/lib/stickers.ts`
   - 텍스트 클릭 → 인라인 수정 가능 (Enter 저장, Esc 취소)
   - localStorage 캐시로 즉시 로딩 (페이지 이동 시 딜레이 없음)

### Supabase 설정 필요

**schedules 테이블 RLS 정책** (이미 적용됨):
```sql
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON schedules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 버그 수정
- `getSchedulesByMonth`: 2월 31일 등 잘못된 날짜로 쿼리하던 문제 수정
  - 해당 월의 실제 마지막 날짜 계산하도록 변경

---

## 2026-02-03: Vercel 배포 & OAuth 404 문제 해결

### 문제
- Google OAuth 로그인 후 `/dashboard`로 이동 시 404 발생
- 로컬 환경에서는 정상, Vercel 배포 환경에서만 실패
- 시크릿 모드 및 신규 사용자 접속 불가

### 해결
1. **OAuth Redirect 경로 변경**
   - 파일: `frontend/src/pages/Index.tsx:43`
   - 변경: `redirectTo: window.location.origin` (루트로만 리다이렉트)
   - 이유: SPA 경로를 서버가 직접 처리하면 404 발생

2. **Vercel SPA 라우팅 설정 추가**
   - 파일: `frontend/vercel.json` (신규 생성)
   - 내용: 모든 비파일 경로를 index.html로 fallback

3. **보안 강화**
   - `.gitignore`: .env 파일 제외
   - `.vercelignore`: 불필요한 파일 배포 제외

### Git Commits
```
9c32567 - Fix: OAuth redirect to root path for Vercel SPA routing
064b9f7 - chore: remove reference code and prepare for deployment
```

### 참고
- Supabase Redirect URLs: 루트 경로만 등록 (`https://track-fawn-mu.vercel.app`)
- Vercel Root Directory: `frontend`
- 환경변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## 다음 작업 시 참고사항

### 프로젝트 구조
```
TRACK/
├── frontend/              # Vite + React 프로젝트 (Root Directory)
│   ├── src/
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── stores/       # Zustand 전역 상태
│   │   └── lib/          # Supabase 클라이언트, API 함수
│   ├── vercel.json       # SPA 라우팅 설정
│   └── .env              # 환경변수 (git ignore됨)
└── frontend_reference/   # 참조용 (배포 제외)
```

### 주요 상태 관리
- `dashboardStore.ts`: Dashboard 데이터 전역 관리
- App.tsx에서 preloadData() 호출하여 초기 데이터 로드

### 배포
- Vercel 자동 배포 (Git push 시)
- 환경변수는 Vercel Dashboard에서 설정

