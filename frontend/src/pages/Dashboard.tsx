import { useMemo } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import StatCard from "@/components/dashboard/StatCard";
import DashboardCalendar from "@/components/dashboard/DashboardCalendar";
import Sticker from "@/components/dashboard/Sticker";
import RoutinePanel, { RoutineItem } from "@/components/dashboard/RoutinePanel";
import {
  getRoutinesByDate,
  toggleSelfCheckRoutine as toggleRoutine,
  getRoutineStatusMap,
} from "@/lib/daily-routines";
import { useDashboardStore } from "@/stores/dashboardStore";

const Dashboard = () => {
  // Read from global store
  const isLoading = useDashboardStore(state => !state.isReady);
  const todayRoutines = useDashboardStore(state => state.todayRoutines);
  const todayFocusPercentage = useDashboardStore(state => state.todayFocusPercentage);
  const weeklyAveragePercentage = useDashboardStore(state => state.weeklyAveragePercentage);
  const weeklyApplicationStats = useDashboardStore(state => state.weeklyApplicationStats);
  const updateTodayRoutines = useDashboardStore(state => state.updateTodayRoutines);

  // Get today's date string (always uses current date)
  const getTodayDateString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  // Get routine status map
  const routineStatusMap = useMemo(() => getRoutineStatusMap(todayRoutines), [todayRoutines]);

  // Self-check routines from todayRoutines
  const selfCheckItems: RoutineItem[] = useMemo(() => [
    { id: "wake_up", label: "기상 (오전 8시 이전)", checked: routineStatusMap.get("wake_up") || false },
    { id: "exercise", label: "운동 (최소 10분)", checked: routineStatusMap.get("exercise") || false },
  ], [routineStatusMap]);

  // Auto-check routines from todayRoutines
  const autoCheckItems: RoutineItem[] = useMemo(() => [
    { id: "time_block", label: "타임 블록 계획하기", checked: routineStatusMap.get("time_block") || false },
    { id: "news_scrap", label: "경제 뉴스 스크랩", checked: routineStatusMap.get("news_scrap") || false },
    { id: "job_listing", label: "기업 리스트 추가", checked: routineStatusMap.get("job_listing") || false },
  ], [routineStatusMap]);

  const toggleSelfCheck = async (id: string) => {
    const todayStr = getTodayDateString();

    // Optimistic update in store
    const existing = todayRoutines.find(r => r.routine_key === id);
    let optimisticRoutines;

    if (existing) {
      // Toggle existing
      optimisticRoutines = todayRoutines.map(r =>
        r.routine_key === id
          ? { ...r, is_completed: !r.is_completed, completed_at: !r.is_completed ? new Date().toISOString() : null }
          : r
      );
    } else {
      // Add new (checked)
      optimisticRoutines = [...todayRoutines, {
        id: `temp-${Date.now()}`,
        user_id: 'temp',
        date: todayStr,
        routine_key: id as any,
        check_type: 'self' as const,
        is_completed: true,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }];
    }

    // Update store immediately
    updateTodayRoutines(optimisticRoutines);

    // Background save
    try {
      await toggleRoutine(todayStr, id as any);
      // Reload to get correct data from DB
      const routines = await getRoutinesByDate(todayStr);
      updateTodayRoutines(routines);
    } catch (error) {
      console.error("Failed to toggle routine:", error);
      // Revert on error
      const routines = await getRoutinesByDate(todayStr);
      updateTodayRoutines(routines);
    }
  };

  // Auto check toggle is disabled - these are read-only
  const toggleAutoCheck = (_id: string) => {
    // Do nothing - auto check items are controlled by activities
  };

  // Helper function for comments
  const getPercentageComment = (percentage: number): string => {
    if (percentage <= 30) return "...뭐하세요?";
    if (percentage <= 60) return "힘내세요";
    return "고생했어요~";
  };

  // Stats for each card (computed from store)
  const todayFocusComment = getPercentageComment(todayFocusPercentage);
  const weeklyAverageComment = getPercentageComment(weeklyAveragePercentage);

  // Get today's date for subtitle
  const today = new Date();
  const dateSubtitle = `${today.getMonth() + 1}월 ${today.getDate()}일 (${["일", "월", "화", "수", "목", "금", "토"][today.getDay()]}) 목표 달성률`;

  return (
    <div className="h-screen flex w-full bg-[hsl(var(--light-gray))] overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Content Area */}
        <main className="flex-1 px-32 py-6 overflow-auto">
          {/* Page Title - Centered */}
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-foreground mb-2">
              오늘의 루틴 (Today's Routine)
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm mb-2">
              <span>✓</span>
              평일(월-금) 필수 체크
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              작은 승리의 반복이 압도적인 성공을 만듭니다.
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {isLoading ? (
              // Loading skeletons
              <>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white relative overflow-hidden rounded-2xl border-2 border-gray-200 shadow-sm animate-pulse"
                  >
                    <div className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-10 bg-gray-200 rounded w-1/3 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              // Actual cards - only render when data is ready
              <>
                <StatCard
                  title="오늘의 몰입도"
                  value={todayFocusPercentage}
                  subtitle={dateSubtitle}
                  comment={todayFocusComment}
                  variant="progress"
                  percentage={todayFocusPercentage}
                />
                <StatCard
                  title="주간 누적 달성"
                  value={weeklyAveragePercentage}
                  subtitle="완벽한 한 주를 만들어보세요"
                  comment={weeklyAverageComment}
                  variant="progress"
                  percentage={weeklyAveragePercentage}
                />
                <StatCard
                  title="이번 주 지원 완료"
                  value={weeklyApplicationStats.percentage}
                  unit="%"
                  subtitle={weeklyApplicationStats.subtitle}
                  variant="progress"
                  percentage={weeklyApplicationStats.percentage}
                />
              </>
            )}
          </div>

          {/* RoutinePanel, Sticker, and Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RoutinePanel
              selfCheckItems={selfCheckItems}
              autoCheckItems={autoCheckItems}
              onSelfCheckToggle={toggleSelfCheck}
              onAutoCheckToggle={toggleAutoCheck}
              disableAutoCheck={true}
            />
            <Sticker />
            <DashboardCalendar />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
