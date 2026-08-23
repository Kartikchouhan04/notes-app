import type { SupabaseClient } from "@supabase/supabase-js";
import { InternalServerError, NotFoundError } from "../errors";

/**
 * Every query is scoped by user_id as well as by RLS. The redundancy is
 * deliberate: a policy change can't silently widen what these functions return.
 */

export interface ListNotesOptions {
  topicId?: string;
  search?: string;
  archived?: boolean;
  limit?: number;
  offset?: number;
}

export async function getNotes(
  supabase: SupabaseClient,
  userId: string,
  options: ListNotesOptions = {}
) {
  const {
    topicId,
    search,
    archived = false,
    limit = 200,
    offset = 0,
  } = options;

  let query = supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .eq("archived", archived)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (topicId) {
    query = query.eq("topic_id", topicId);
  }

  if (search) {
    // Escape the LIKE wildcards so a literal % or _ doesn't widen the match.
    const escaped = search.replace(/[%_]/g, (char) => `\\${char}`);
    query = query.ilike("text", `%${escaped}%`);
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

export interface NoteUpdate {
  text?: string;
  pinned?: boolean;
  archived?: boolean;
  topicId?: string;
}

export async function updateNote(
  supabase: SupabaseClient,
  userId: string,
  noteId: string,
  changes: NoteUpdate
) {
  const payload: Record<string, unknown> = {};
  if (changes.text !== undefined) payload.text = changes.text;
  if (changes.pinned !== undefined) payload.pinned = changes.pinned;
  if (changes.archived !== undefined) payload.archived = changes.archived;
  if (changes.topicId !== undefined) payload.topic_id = changes.topicId;

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

/** Permanently removes every archived note. Used by "empty archive". */
export async function purgeArchived(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("user_id", userId)
    .eq("archived", true)
    .select("id");

  if (error) {
    console.error("purgeArchived error:", error);
    throw error;
  }
  return data?.length ?? 0;
}
