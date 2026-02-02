import { create } from 'zustand';
import {
  getRoutinesByDate,
  toggleSelfCheckRoutine,
  type DailyRoutine
} from '@/lib/daily-routines';
import { getAllApplications, type Application } from '@/lib/applications';
import { getAllNewsScraps, type NewsScrap } from '@/lib/news-scraps';

// ==================== Types ====================

interface DashboardState {
  // Ready flag
  isReady: boolean;

  // Raw data
  todayRoutines: DailyRoutine[];
  weekRoutines: Map<string, DailyRoutine[]>;
  applications: Application[];
  newsScraps: NewsScrap[];

  // Computed metrics
  todayFocusPercentage: number;
  weeklyAveragePercentage: number;
  weeklyApplicationStats: {
    count: number;
    percentage: number;
    subtitle: string;
  };

  // Actions
  preloadData: () => Promise<void>;
  updateTodayRoutines: (routines: DailyRoutine[]) => void;
  addApplication: (app: Application) => void;
  updateApplications: (apps: Application[]) => void;
  addNewsScrap: (news: NewsScrap) => void;
  updateNewsScraps: (scraps: NewsScrap[]) => void;
  recalculateMetrics: () => void;
}

// ==================== Helper Functions ====================

const getTodayDateString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const loadWeekRoutines = async (): Promise<Map<string, DailyRoutine[]>> => {
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Get start of week (Monday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const weekRoutinesMap = new Map<string, DailyRoutine[]>();

  // Load routines for each weekday up to today
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);

    if (date > today) break; // Don't load future dates

    const dayOfWeek = date.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday only
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayRoutines = await getRoutinesByDate(dateStr);
      weekRoutinesMap.set(dateStr, dayRoutines);
    }
  }

  return weekRoutinesMap;
};

// ==================== Store ====================

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  isReady: false,
  todayRoutines: [],
  weekRoutines: new Map(),
  applications: [],
  newsScraps: [],
  todayFocusPercentage: 0,
  weeklyAveragePercentage: 0,
  weeklyApplicationStats: {
    count: 0,
    percentage: 0,
    subtitle: '이번 주 지원 내역이 없어요!'
  },

  // Preload all data
  preloadData: async () => {
    try {
      const todayStr = getTodayDateString();

      // Fetch all data in parallel
      const [routines, apps, news, weekRoutines] = await Promise.all([
        getRoutinesByDate(todayStr),
        getAllApplications(),
        getAllNewsScraps(),
        loadWeekRoutines()
      ]);

      set({
        todayRoutines: routines,
        applications: apps,
        newsScraps: news,
        weekRoutines,
      });

      // Calculate metrics
      get().recalculateMetrics();

      // Ready to render
      set({ isReady: true });
    } catch (error) {
      console.error('Failed to preload dashboard data:', error);
      // Even on error, mark as ready to prevent infinite loading
      set({ isReady: true });
    }
  },

  // Update today's routines (after toggle)
  updateTodayRoutines: (routines) => {
    set({ todayRoutines: routines });

    // Also update in weekRoutines if today is included
    const todayStr = getTodayDateString();
    const { weekRoutines } = get();
    if (weekRoutines.has(todayStr)) {
      const newWeekRoutines = new Map(weekRoutines);
      newWeekRoutines.set(todayStr, routines);
      set({ weekRoutines: newWeekRoutines });
    }

    get().recalculateMetrics();
  },

  // Add single application
  addApplication: (app) => {
    set({ applications: [...get().applications, app] });
    get().recalculateMetrics();
  },

  // Update all applications (bulk update)
  updateApplications: (apps) => {
    set({ applications: apps });
    get().recalculateMetrics();
  },

  // Add single news scrap
  addNewsScrap: (news) => {
    set({ newsScraps: [news, ...get().newsScraps] });
  },

  // Update all news scraps (bulk update)
  updateNewsScraps: (scraps) => {
    set({ newsScraps: scraps });
  },

  // Recalculate all metrics
  recalculateMetrics: () => {
    const { todayRoutines, weekRoutines, applications } = get();
    const todayStr = getTodayDateString();

    // Calculate today focus percentage
    const totalRoutines = 5;
    const completedRoutines = todayRoutines.filter(r => r.is_completed).length;
    const todayFocusPercentage = Math.round((completedRoutines / totalRoutines) * 100);

    // Calculate weekly average percentage
    let totalPercentage = 0;
    let daysCount = 0;

    weekRoutines.forEach((dayRoutines, dateStr) => {
      const routinesToUse = dateStr === todayStr ? todayRoutines : dayRoutines;
      const completedRoutines = routinesToUse.filter(r => r.is_completed).length;
      const dayPercentage = (completedRoutines / totalRoutines) * 100;
      totalPercentage += dayPercentage;
      daysCount++;
    });

    const weeklyAveragePercentage = daysCount > 0
      ? Math.round(totalPercentage / daysCount)
      : 0;

    // Calculate weekly application stats
    const today = new Date();
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
      const appliedDate = new Date(app.applied_at);
      return appliedDate >= startOfWeek && appliedDate <= endOfWeek;
    }).length;

    const weeklyApplicationStats = {
      count: weeklyCount,
      percentage: Math.min(weeklyCount * 50, 100),
      subtitle: weeklyCount === 0
        ? "이번 주 지원 내역이 없어요!"
        : weeklyCount === 1
          ? "1개 완료! 1개 더 지원해보세요"
          : `${weeklyCount}개 완료! 목표 달성 🎉`
    };

    set({
      todayFocusPercentage,
      weeklyAveragePercentage,
      weeklyApplicationStats,
    });
  },
}));
