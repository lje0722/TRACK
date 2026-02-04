import { supabase } from "./supabase";

export interface Schedule {
  id: string;
  user_id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  created_at: string;
  updated_at: string;
}

/**
 * Get all schedules for the current user
 */
export async function getAllSchedules(): Promise<Schedule[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get schedules for a specific month
 */
export async function getSchedulesByMonth(year: number, month: number): Promise<Schedule[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  // Get the actual last day of the month
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Create a new schedule
 */
export async function createSchedule(title: string, date: string): Promise<Schedule> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("schedules")
    .insert({
      user_id: user.id,
      title: title.trim(),
      date,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("schedules")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
}
