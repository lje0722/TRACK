import { supabase } from "./supabase";

export interface Application {
  id: string;
  user_id: string;
  company: string;
  position: string;
  stage: string;
  progress: number;
  deadline: string | null;
  applied_at: string;
  status: "active" | "reviewing" | "rejected" | "accepted";
  url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateApplicationInput {
  company: string;
  position: string;
  stage: string;
  progress: number;
  deadline?: Date | null;
  applied_at?: Date;
  status?: "active" | "reviewing" | "rejected" | "accepted";
  url?: string;
}

export interface UpdateApplicationInput {
  company?: string;
  position?: string;
  stage?: string;
  progress?: number;
  deadline?: Date | null;
  status?: "active" | "reviewing" | "rejected" | "accepted";
  url?: string;
}

/**
 * Get all applications for the current user
 */
export async function getAllApplications(): Promise<Application[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("applied_at", { ascending: false });

  if (error) {
    console.error("Error fetching applications:", error);
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  return data || [];
}

/**
 * Get applications by status
 */
export async function getApplicationsByStatus(
  status: "active" | "reviewing" | "rejected" | "accepted"
): Promise<Application[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", status)
    .order("applied_at", { ascending: false });

  if (error) {
    console.error("Error fetching applications by status:", error);
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  return data || [];
}

/**
 * Get count of applications by status for dashboard
 */
export async function getApplicationsCountByStatus(): Promise<{
  active: number;
  reviewing: number;
  rejected: number;
  accepted: number;
  total: number;
}> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("applications")
    .select("status")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching applications count:", error);
    throw new Error(`Failed to fetch applications count: ${error.message}`);
  }

  const counts = {
    active: 0,
    reviewing: 0,
    rejected: 0,
    accepted: 0,
    total: data?.length || 0,
  };

  data?.forEach((app) => {
    if (app.status === "active") counts.active++;
    else if (app.status === "reviewing") counts.reviewing++;
    else if (app.status === "rejected") counts.rejected++;
    else if (app.status === "accepted") counts.accepted++;
  });

  return counts;
}

/**
 * Get applications with upcoming deadlines (within next 7 days)
 */
export async function getUpcomingDeadlines(): Promise<Application[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["active", "reviewing"])
    .not("deadline", "is", null)
    .gte("deadline", now.toISOString())
    .lte("deadline", sevenDaysFromNow.toISOString())
    .order("deadline", { ascending: true });

  if (error) {
    console.error("Error fetching upcoming deadlines:", error);
    throw new Error(`Failed to fetch upcoming deadlines: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a new application
 */
export async function createApplication(
  input: CreateApplicationInput
): Promise<Application> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      company: input.company,
      position: input.position,
      stage: input.stage,
      progress: input.progress,
      deadline: input.deadline?.toISOString() || null,
      applied_at: input.applied_at?.toISOString() || new Date().toISOString(),
      status: input.status || "active",
      url: input.url || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating application:", error);
    throw new Error(`Failed to create application: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing application
 */
export async function updateApplication(
  id: string,
  input: UpdateApplicationInput
): Promise<Application> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const updateData: any = {};

  if (input.company !== undefined) updateData.company = input.company;
  if (input.position !== undefined) updateData.position = input.position;
  if (input.stage !== undefined) updateData.stage = input.stage;
  if (input.progress !== undefined) updateData.progress = input.progress;
  if (input.deadline !== undefined) {
    updateData.deadline = input.deadline ? input.deadline.toISOString() : null;
  }
  if (input.status !== undefined) updateData.status = input.status;
  if (input.url !== undefined) updateData.url = input.url;

  const { data, error } = await supabase
    .from("applications")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating application:", error);
    throw new Error(`Failed to update application: ${error.message}`);
  }

  return data;
}

/**
 * Delete an application
 */
export async function deleteApplication(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting application:", error);
    throw new Error(`Failed to delete application: ${error.message}`);
  }
}

/**
 * Calculate D-day from deadline
 */
export function calculateDDay(deadline: string | null): number | null {
  if (!deadline) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Format D-day for display
 */
export function formatDDay(deadline: string | null): string {
  const dday = calculateDDay(deadline);

  if (dday === null) return "-";
  if (dday === 0) return "D-Day";
  if (dday > 0) return `D-${dday}`;
  return `D+${Math.abs(dday)}`;
}
