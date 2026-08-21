import type { SupabaseClient } from "@supabase/supabase-js";
import { InternalServerError, NotFoundError } from "../errors";

/**
 * Every query is scoped by user_id as well as by RLS. The redundancy is
 * deliberate: a policy change can't silently widen what these functions return.
 */

export async function getNotes(
  supabase: SupabaseClient,
  userId: string,
  topicId?: string,
  limit = 200,
  offset = 0
) {
  let query = supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (topicId) {
    query = query.eq("topic_id", topicId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getNotes error:", error);
    throw error;
  }
  return data ?? [];
}

export async function createNote(
  supabase: SupabaseClient,
  userId: string,
  text: string,
  topicId: string
) {
  const { data, error } = await supabase
    .from("notes")
    .insert({ text, user_id: userId, topic_id: topicId })
    .select()
    .single();

  if (error) {
    console.error("createNote error:", error);
    throw error;
  }
  if (!data) {
    throw new InternalServerError("Failed to create note");
  }
  return data;
}

export async function updateNote(
  supabase: SupabaseClient,
  userId: string,
  noteId: string,
  text?: string,
  pinned?: boolean
) {
  const payload: Record<string, unknown> = {};
  if (text !== undefined) payload.text = text;
  if (pinned !== undefined) payload.pinned = pinned;

  // Filtering on user_id means a note owned by someone else updates zero rows,
  // and the empty result below turns into a 404 rather than a silent success.
  const { data, error } = await supabase
    .from("notes")
    .update(payload)
    .eq("id", noteId)
    .eq("user_id", userId)
    .select();

  if (error) {
    console.error("updateNote error:", error);
    throw error;
  }
  if (!data || data.length === 0) {
    throw new NotFoundError("Note not found");
  }
  return data[0];
}

export async function deleteNote(
  supabase: SupabaseClient,
  userId: string,
  noteId: string
) {
  // .select() is what makes a no-op delete detectable.
  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", userId)
    .select("id");

  if (error) {
    console.error("deleteNote error:", error);
    throw error;
  }
  if (!data || data.length === 0) {
    throw new NotFoundError("Note not found");
  }
  return true;
}
