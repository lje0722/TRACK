# TRACK 프로젝트 변경 이력

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

