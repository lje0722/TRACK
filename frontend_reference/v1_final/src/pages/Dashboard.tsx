import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/dashboard/Sidebar";
import StatCard from "@/components/dashboard/StatCard";
import DashboardCalendar from "@/components/dashboard/DashboardCalendar";
import RoutinePanel, { RoutineItem } from "@/components/dashboard/RoutinePanel";
import { useJobContext } from "@/contexts/JobContext";

const Dashboard = () => {
  const { applications, activities } = useJobContext();
  
  // Routine state - lifted up from RoutinePanel
  const [selfCheckItems, setSelfCheckItems] = useState<RoutineItem[]>([
    { id: "wakeup", label: "기상 (오전 8시 이전)", checked: false },
    { id: "exercise", label: "운동 (최소 10분)", checked: false },
  ]);
  
  // Auto check items are derived from activities
  const autoCheckItems: RoutineItem[] = [
    { id: "timeblock", label: "타임 블록 계획하기", checked: activities.hasAddedTimeBlock },
    { id: "news", label: "경제 뉴스 스크랩", checked: activities.hasAddedNewsScrap },
    { id: "joblisting", label: "기업 리스트 추가", checked: activities.hasAddedJobListing },
  ];

  // Weekly completion history (Mon-Fri for the current month)
  // Each day has 5 possible tasks, tracking completed count per day
  const [weeklyHistory] = useState<Record<string, number>>({
    // Example: storing how many tasks completed each weekday
    // Format: "YYYY-MM-DD": completedCount (0-5)
    "2026-01-06": 5, // Week 1 Mon
    "2026-01-07": 4, // Week 1 Tue
    "2026-01-08": 5, // Week 1 Wed
    "2026-01-09": 3, // Week 1 Thu
    "2026-01-10": 5, // Week 1 Fri
    "2026-01-13": 5, // Week 2 Mon
    "2026-01-14": 5, // Week 2 Tue
    "2026-01-15": 4, // Week 2 Wed
    "2026-01-16": 5, // Week 2 Thu
    "2026-01-17": 5, // Week 2 Fri
    "2026-01-20": 3, // Week 3 Mon
    "2026-01-21": 4, // Week 3 Tue
    "2026-01-22": 5, // Week 3 Wed
    "2026-01-23": 2, // Week 3 Thu
    "2026-01-24": 5, // Week 3 Fri
    "2026-01-27": 4, // Week 4 Mon
    "2026-01-28": 5, // Week 4 Tue
    "2026-01-29": 3, // Week 4 Wed
    // Today (2026-01-30) will be calculated from current state
  });

  const toggleSelfCheck = (id: string) => {
    setSelfCheckItems(items =>
      items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };
  
  // Auto check toggle is disabled - these are read-only based on activities
  const toggleAutoCheck = (_id: string) => {
    // Do nothing - auto check items are controlled by activities
  };

  // Calculate today's focus percentage (5 checkboxes = 100%)
  const todayFocusPercentage = useMemo(() => {
    const totalItems = selfCheckItems.length + autoCheckItems.length; // 5
    const checkedItems = 
      selfCheckItems.filter(item => item.checked).length + 
      autoCheckItems.filter(item => item.checked).length;
    return Math.round((checkedItems / totalItems) * 100);
  }, [selfCheckItems, autoCheckItems]);

  // Calculate weekly cumulative achievement rate
  // Based on Mon-Fri completion for the month (each day has 5 tasks)
  const weeklyAchievementRate = useMemo(() => {
    // Count weekdays in January 2026 (Mon-Fri)
    const weekdaysInMonth: string[] = [];
    const year = 2026;
    const month = 0; // January
    
    for (let day = 1; day <= 31; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      // Mon=1, Tue=2, Wed=3, Thu=4, Fri=5
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        weekdaysInMonth.push(dateStr);
      }
    }

    // Calculate total possible tasks (5 tasks per weekday)
    const totalPossibleTasks = weekdaysInMonth.length * 5;
    
    // Calculate completed tasks from history + today
    let completedTasks = 0;
    
    // Add historical data
    for (const dateStr of weekdaysInMonth) {
      if (weeklyHistory[dateStr] !== undefined) {
        completedTasks += weeklyHistory[dateStr];
      }
    }
    
    // Add today's progress (2026-01-30)
    const todayChecked = 
      selfCheckItems.filter(item => item.checked).length + 
      autoCheckItems.filter(item => item.checked).length;
    completedTasks += todayChecked;

    return Math.round((completedTasks / totalPossibleTasks) * 100);
  }, [selfCheckItems, autoCheckItems, weeklyHistory]);

  // Calculate weekly application count (applications made this week)
  const weeklyApplicationStats = useMemo(() => {
    const today = new Date(2026, 0, 30);
    const dayOfWeek = today.getDay();
    // Get start of week (Monday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get end of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Count applications made this week
    const weeklyCount = applications.filter(app => {
      const appliedDate = new Date(app.appliedAt);
      return appliedDate >= startOfWeek && appliedDate <= endOfWeek;
    }).length;
    
    const percentage = Math.min(weeklyCount * 50, 100); // 50% per application, max 100%
    const level: "red" | "yellow" | "green" = 
      weeklyCount === 0 ? "red" : 
      weeklyCount === 1 ? "yellow" : "green";
    
    const subtitle = weeklyCount === 0 
      ? "이번 주 지원 내역이 없어요!" 
      : weeklyCount === 1 
        ? "1개 완료! 1개 더 지원해보세요" 
        : `${weeklyCount}개 완료! 목표 달성 🎉`;
    
    return { count: weeklyCount, percentage, level, subtitle };
  }, [applications]);

  // Helper function to get level and comment based on percentage
  const getPercentageStats = (percentage: number) => {
    if (percentage < 30) {
      return { level: "red" as const, comment: "...뭐하세요?" };
    } else if (percentage < 70) {
      return { level: "yellow" as const, comment: "힘내세요" };
    } else {
      return { level: "green" as const, comment: "고생했어요~" };
    }
  };

  const todayFocusStats = getPercentageStats(todayFocusPercentage);
  const weeklyAchievementStats = getPercentageStats(weeklyAchievementRate);

  // Get today's date for subtitle
  const today = new Date(2026, 0, 30);
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
            <StatCard 
              title="오늘의 몰입도" 
              value={todayFocusPercentage} 
              subtitle={dateSubtitle}
              comment={todayFocusStats.comment}
              variant="progress"
              progressLevel={todayFocusStats.level}
            />
            <StatCard 
              title="주간 누적 달성" 
              value={weeklyAchievementRate} 
              subtitle="완벽한 한 주를 만들어보세요"
              comment={weeklyAchievementStats.comment}
              variant="progress"
              progressLevel={weeklyAchievementStats.level}
            />
            <StatCard 
              title="이번 주 지원 완료" 
              value={weeklyApplicationStats.percentage} 
              unit="%" 
              subtitle={weeklyApplicationStats.subtitle}
              variant="progress"
              progressLevel={weeklyApplicationStats.level}
            />
          </div>
          
          {/* Calendar and Routine Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DashboardCalendar />
            <RoutinePanel 
              selfCheckItems={selfCheckItems}
              autoCheckItems={autoCheckItems}
              onSelfCheckToggle={toggleSelfCheck}
              onAutoCheckToggle={toggleAutoCheck}
              disableAutoCheck={true}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
