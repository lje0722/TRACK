import { supabase } from "./supabase";

export interface JobListing {
  id: string;
  user_id: string;
  company: string;
  position: string;
  location: string;
  industry: string;
  company_size: "대기업" | "중견기업" | "중소기업" | "스타트업" | null;
  status: "Not applied" | "Applied";
  deadline: string | null; // DATE format: YYYY-MM-DD
  job_post_url: string;
  created_at: string;
  updated_at: string;
}

export interface CreateJobListingInput {
  company: string;
  position: string;
  location?: string;
  industry?: string;
  company_size?: "대기업" | "중견기업" | "중소기업" | "스타트업";
  deadline?: Date | null;
  job_post_url?: string;
}

export interface UpdateJobListingInput {
  company?: string;
  position?: string;
  location?: string;
  industry?: string;
  company_size?: "대기업" | "중견기업" | "중소기업" | "스타트업" | null;
  status?: "Not applied" | "Applied";
  deadline?: Date | null;
  job_post_url?: string;
}

/**
 * Get all job listings for the current user
 */
export async function getAllJobListings(): Promise<JobListing[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("job_listings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching job listings:", error);
    throw new Error(`Failed to fetch job listings: ${error.message}`);
  }

  return data || [];
}

/**
 * Get job listings by status
 */
export async function getJobListingsByStatus(
  status: "Not applied" | "Applied"
): Promise<JobListing[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("job_listings")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching job listings by status:", error);
    throw new Error(`Failed to fetch job listings: ${error.message}`);
  }

  return data || [];
}

/**
 * Get job listings with upcoming deadlines
 */
export async function getUpcomingJobListings(days: number = 7): Promise<JobListing[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + days);

  // Format dates as YYYY-MM-DD for DATE comparison
  const todayStr = now.toISOString().split('T')[0];
  const futureDateStr = futureDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from("job_listings")
    .select("*")
    .eq("user_id", user.id)
    .not("deadline", "is", null)
    .gte("deadline", todayStr)
    .lte("deadline", futureDateStr)
    .order("deadline", { ascending: true });

  if (error) {
    console.error("Error fetching upcoming job listings:", error);
    throw new Error(`Failed to fetch upcoming job listings: ${error.message}`);
  }

  return data || [];
}

/**
 * Get job listings for a specific month (for calendar)
 */
export async function getJobListingsByMonth(year: number, month: number): Promise<JobListing[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Get first and last day of the month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const firstDayStr = firstDay.toISOString().split('T')[0];
  const lastDayStr = lastDay.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from("job_listings")
    .select("*")
    .eq("user_id", user.id)
    .not("deadline", "is", null)
    .gte("deadline", firstDayStr)
    .lte("deadline", lastDayStr)
    .order("deadline", { ascending: true });

  if (error) {
    console.error("Error fetching job listings by month:", error);
    throw new Error(`Failed to fetch job listings: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a new job listing
 */
export async function createJobListing(
  input: CreateJobListingInput
): Promise<JobListing> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("job_listings")
    .insert({
      user_id: user.id,
      company: input.company,
      position: input.position,
      location: input.location || "",
      industry: input.industry || "",
      company_size: input.company_size || null,
      deadline: input.deadline ? input.deadline.toISOString().split('T')[0] : null,
      job_post_url: input.job_post_url || "",
      status: "Not applied",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating job listing:", error);
    throw new Error(`Failed to create job listing: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing job listing
 */
export async function updateJobListing(
  id: string,
  input: UpdateJobListingInput
): Promise<JobListing> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const updateData: any = {};

  if (input.company !== undefined) updateData.company = input.company;
  if (input.position !== undefined) updateData.position = input.position;
  if (input.location !== undefined) updateData.location = input.location;
  if (input.industry !== undefined) updateData.industry = input.industry;
  if (input.company_size !== undefined) updateData.company_size = input.company_size;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.job_post_url !== undefined) updateData.job_post_url = input.job_post_url;
  if (input.deadline !== undefined) {
    updateData.deadline = input.deadline ? input.deadline.toISOString().split('T')[0] : null;
  }

  const { data, error } = await supabase
    .from("job_listings")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating job listing:", error);
    throw new Error(`Failed to update job listing: ${error.message}`);
  }

  return data;
}

/**
 * Delete a job listing
 */
export async function deleteJobListing(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("job_listings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting job listing:", error);
    throw new Error(`Failed to delete job listing: ${error.message}`);
  }
}

/**
 * Get count of job listings added this week (for dashboard)
 */
export async function getThisWeekJobListingsCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const now = new Date();
  const dayOfWeek = now.getDay();
  // Get start of week (Monday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("job_listings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfWeek.toISOString());

  if (error) {
    console.error("Error fetching this week job listings count:", error);
    throw new Error(`Failed to fetch count: ${error.message}`);
  }

  return count || 0;
}
