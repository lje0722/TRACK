import { supabase } from "./supabase";

// ==================== Types ====================

export interface TimeLog {
  id: string;
  user_id: string;
  category: string;
  content: string;
  date: string; // YYYY-MM-DD
  start_hour: number;
  end_hour: number;
  created_at: string;
  updated_at: string;
}

export interface WeeklyGoal {
  id: string;
  user_id: string;
  year_month: string; // YYYY-MM
  week: number; // 1-4
  goal: string;
  created_at: string;
  updated_at: string;
}

export interface TimeLogInput {
  category: string;
  content: string;
  date: string; // YYYY-MM-DD
  start_hour: number;
  end_hour: number;
}

export interface WeeklyGoalInput {
  year_month: string; // YYYY-MM
  week: number;
  goal: string;
}

// ==================== Time Logs Functions ====================

/**
 * Fetch time logs for a specific week range
 * @param startDate Start date of the week (YYYY-MM-DD)
 * @param endDate End date of the week (YYYY-MM-DD)
 */
export async function getTimeLogsByWeek(
  startDate: string,
  endDate: string
): Promise<TimeLog[]> {
  const { data, error } = await supabase
    .from("time_logs")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("start_hour", { ascending: true });

  if (error) {
    console.error("Error fetching time logs:", error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new time log
 */
export async function createTimeLog(
  input: TimeLogInput
): Promise<TimeLog> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("time_logs")
    .insert({
      user_id: user.id,
      ...input,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating time log:", error);
    throw error;
  }

  return data;
}

/**
 * Update an existing time log
 */
export async function updateTimeLog(
  id: string,
  input: Partial<TimeLogInput>
): Promise<TimeLog> {
  const { data, error } = await supabase
    .from("time_logs")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating time log:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a time log
 */
export async function deleteTimeLog(id: string): Promise<void> {
  const { error } = await supabase
    .from("time_logs")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting time log:", error);
    throw error;
  }
}

// ==================== Weekly Goals Functions ====================

/**
 * Fetch weekly goals for a specific month
 * @param yearMonth Format: YYYY-MM (e.g., "2026-01")
 */
export async function getWeeklyGoalsByMonth(
  yearMonth: string
): Promise<WeeklyGoal[]> {
  const { data, error } = await supabase
    .from("weekly_goals")
    .select("*")
    .eq("year_month", yearMonth)
    .order("week", { ascending: true });

  if (error) {
    console.error("Error fetching weekly goals:", error);
    throw error;
  }

  return data || [];
}

/**
 * Upsert (insert or update) a weekly goal
 * Uses Postgres UPSERT to handle unique constraint on (user_id, year_month, week)
 */
export async function upsertWeeklyGoal(
  input: WeeklyGoalInput
): Promise<WeeklyGoal> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("weekly_goals")
    .upsert(
      {
        user_id: user.id,
        ...input,
      },
      {
        onConflict: "user_id,year_month,week",
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting weekly goal:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a weekly goal
 */
export async function deleteWeeklyGoal(id: string): Promise<void> {
  const { error } = await supabase
    .from("weekly_goals")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting weekly goal:", error);
    throw error;
  }
}

// ==================== Utility Functions ====================

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date object to YYYY-MM string
 */
export function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  const weekStart = new Date(date);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * Get the end of the week (Sunday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}
