import { supabase } from "./supabase";

// ==================== Types ====================

export interface NewsScrap {
  id: string;
  user_id: string;
  article_url: string;
  headline: string;
  content: string;
  applied_role: string | null;
  industry: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsScrapInput {
  article_url: string;
  headline: string;
  content: string;
  applied_role?: string;
  industry?: string;
  company_name?: string;
}

// ==================== News Scraps Functions ====================

/**
 * Fetch all news scraps for the current user
 * @returns Array of news scraps sorted by created_at (newest first)
 */
export async function getAllNewsScraps(): Promise<NewsScrap[]> {
  const { data, error } = await supabase
    .from("news_scraps")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching news scraps:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get count of news scraps for today (for dashboard)
 * @returns Number of scraps created today (Asia/Seoul timezone)
 */
export async function getTodayNewsScrapsCount(): Promise<number> {
  // Get today's date range in Asia/Seoul timezone
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const { count, error } = await supabase
    .from("news_scraps")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString());

  if (error) {
    console.error("Error fetching today's news scraps count:", error);
    throw error;
  }

  return count || 0;
}

/**
 * Create a new news scrap
 */
export async function createNewsScrap(
  input: NewsScrapInput
): Promise<NewsScrap> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("news_scraps")
    .insert({
      user_id: user.id,
      ...input,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating news scrap:", error);
    throw error;
  }

  return data;
}

/**
 * Update an existing news scrap
 */
export async function updateNewsScrap(
  id: string,
  input: Partial<NewsScrapInput>
): Promise<NewsScrap> {
  const { data, error } = await supabase
    .from("news_scraps")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating news scrap:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a news scrap
 */
export async function deleteNewsScrap(id: string): Promise<void> {
  const { error } = await supabase
    .from("news_scraps")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting news scrap:", error);
    throw error;
  }
}
