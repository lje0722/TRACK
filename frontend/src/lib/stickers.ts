import { supabase } from "./supabase";

export interface Sticker {
  id: string;
  user_id: string;
  text: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all stickers for the current user
 */
export async function getAllStickers(): Promise<Sticker[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("stickers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Create a new sticker
 */
export async function createSticker(text: string): Promise<Sticker> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("stickers")
    .insert({
      user_id: user.id,
      text: text.trim(),
      is_completed: false,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Toggle sticker completion status
 */
export async function toggleSticker(id: string): Promise<Sticker> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // First get current status
  const { data: current, error: fetchError } = await supabase
    .from("stickers")
    .select("is_completed")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Toggle the status
  const { data, error } = await supabase
    .from("stickers")
    .update({ is_completed: !current.is_completed })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update sticker text
 */
export async function updateSticker(id: string, text: string): Promise<Sticker> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("stickers")
    .update({ text: text.trim() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Delete a sticker
 */
export async function deleteSticker(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("stickers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
}
