import type { SupabaseClient } from "@supabase/supabase-js";
import { InternalServerError, NotFoundError } from "../errors";

const COLUMNS = "id, name, created_at";

export async function getTopics(supabase: SupabaseClient, userId: string) {
  // Ask for the related notes count so the UI can label each topic card.
  const { data, error } = await supabase
    .from("topics")
    .select(`${COLUMNS}, notes(count)`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!error) {
    return (data ?? []).map((topic) => ({
      id: topic.id,
      name: topic.name,
      created_at: topic.created_at,
      note_count: topic.notes?.[0]?.count ?? 0,
    }));
  }

  // The embedded count needs a notes -> topics foreign key. Without it, fall
  // back to plain topics rather than failing the whole request.
  console.warn("getTopics count select failed, falling back:", error);

  const { data: plain, error: plainError } = await supabase
    .from("topics")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (plainError) {
    console.error("getTopics error:", plainError);
    throw plainError;
  }
  return plain ?? [];
}

export async function getTopicById(
  supabase: SupabaseClient,
  userId: string,
  topicId: string
) {
  const { data, error } = await supabase
    .from("topics")
    .select(COLUMNS)
    .eq("id", topicId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getTopicById error:", error);
    throw error;
  }
  if (!data) {
    throw new NotFoundError("Topic not found");
  }
  return data;
}

export async function createTopic(
  supabase: SupabaseClient,
  userId: string,
  name: string
) {
  const { data, error } = await supabase
    .from("topics")
    .insert({ name, user_id: userId })
    .select(COLUMNS)
    .single();

  if (error) {
    console.error("createTopic error:", error);
    throw error;
  }
  if (!data) {
    throw new InternalServerError("Failed to create topic");
  }
  return data;
}

export async function updateTopic(
  supabase: SupabaseClient,
  userId: string,
  topicId: string,
  name: string
) {
  const { data, error } = await supabase
    .from("topics")
    .update({ name })
    .eq("id", topicId)
    .eq("user_id", userId)
    .select(COLUMNS);

  if (error) {
    console.error("updateTopic error:", error);
    throw error;
  }
  // A topic that isn't there — or isn't theirs — is a 404, not a 500.
  if (!data || data.length === 0) {
    throw new NotFoundError("Topic not found");
  }
  return data[0];
}

export async function deleteTopic(
  supabase: SupabaseClient,
  userId: string,
  topicId: string
) {
  const { data, error } = await supabase
    .from("topics")
    .delete()
    .eq("id", topicId)
    .eq("user_id", userId)
    .select("id");

  if (error) {
    console.error("deleteTopic error:", error);
    throw error;
  }
  if (!data || data.length === 0) {
    throw new NotFoundError("Topic not found");
  }
  return true;
}
