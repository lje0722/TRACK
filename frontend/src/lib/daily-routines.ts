import { supabase } from "./supabase";

export type RoutineKey = "wake_up" | "exercise" | "time_block" | "news_scrap" | "job_listing";
export type CheckType = "self" | "auto";

export interface DailyRoutine {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  routine_key: RoutineKey;
  check_type: CheckType;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoutineDefinition {
  key: RoutineKey;
  label: string;
  check_type: CheckType;
}

// 루틴 정의
export const ROUTINE_DEFINITIONS: RoutineDefinition[] = [
  { key: "wake_up", label: "기상 (오전 8시 이전)", check_type: "self" },
  { key: "exercise", label: "운동 (최소 10분)", check_type: "self" },
  { key: "time_block", label: "타임 블록 계획하기", check_type: "auto" },
  { key: "news_scrap", label: "경제 뉴스 스크랩", check_type: "auto" },
  { key: "job_listing", label: "기업 리스트 추가", check_type: "auto" },
];

/**
 * Get routines for a specific date
 */
export async function getRoutinesByDate(date: string): Promise<DailyRoutine[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("daily_routine_status")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date);

  if (error) {
    console.error("Error fetching routines:", error);
    throw new Error(`Failed to fetch routines: ${error.message}`);
  }

  return data || [];
}

/**
 * Toggle self-check routine (wake_up, exercise)
 */
export async function toggleSelfCheckRoutine(
  date: string,
  routineKey: RoutineKey
): Promise<DailyRoutine> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Check if routine exists
  const { data: existing } = await supabase
    .from("daily_routine_status")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .eq("routine_key", routineKey)
    .single();

  if (existing) {
    // Toggle existing routine
    const newCompleted = !existing.is_completed;
    const { data, error } = await supabase
      .from("daily_routine_status")
      .update({
        is_completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating routine:", error);
      throw new Error(`Failed to update routine: ${error.message}`);
    }

    return data;
  } else {
    // Create new routine (completed)
    const { data, error } = await supabase
      .from("daily_routine_status")
      .insert({
        user_id: user.id,
        date,
        routine_key: routineKey,
        check_type: "self",
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating routine:", error);
      throw new Error(`Failed to create routine: ${error.message}`);
    }

    return data;
  }
}

/**
 * Mark auto-check routine as completed (time_block, news_scrap, job_listing)
 */
export async function markAutoCheckRoutine(
  date: string,
  routineKey: RoutineKey
): Promise<DailyRoutine> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Check if routine exists
  const { data: existing } = await supabase
    .from("daily_routine_status")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .eq("routine_key", routineKey)
    .single();

  if (existing) {
    // Already exists, return as is
    return existing;
  } else {
    // Create new routine (auto-completed)
    const { data, error } = await supabase
      .from("daily_routine_status")
      .insert({
        user_id: user.id,
        date,
        routine_key: routineKey,
        check_type: "auto",
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating auto routine:", error);
      throw new Error(`Failed to create auto routine: ${error.message}`);
    }

    return data;
  }
}

/**
 * Calculate today's focus score (몰입도)
 */
export async function calculateFocusScore(date: string): Promise<number> {
  const routines = await getRoutinesByDate(date);
  const totalRoutines = ROUTINE_DEFINITIONS.length;
  const completedRoutines = routines.filter((r) => r.is_completed).length;

  if (totalRoutines === 0) return 0;

  return Math.round((completedRoutines / totalRoutines) * 100);
}

/**
 * Get routine status map for easy lookup
 */
export function getRoutineStatusMap(routines: DailyRoutine[]): Map<RoutineKey, boolean> {
  const map = new Map<RoutineKey, boolean>();
  routines.forEach((routine) => {
    map.set(routine.routine_key, routine.is_completed);
  });
  return map;
}
