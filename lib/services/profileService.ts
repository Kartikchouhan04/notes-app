import type { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError } from "../errors";

/** Never select "*" here — it would happily return any column added later. */
const COLUMNS = "id, email, full_name, created_at, updated_at";

export async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("getProfile error:", error);
    throw error;
  }
  if (!data) {
    throw new NotFoundError("Profile not found");
  }
  return data;
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  fullName: string | null
) {
  // Only full_name is writable. Email is owned by Supabase Auth and mirrored
  // in by a trigger, so letting the client set it here would let the two drift.
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId)
    .select(COLUMNS);

  if (error) {
    console.error("updateProfile error:", error);
    throw error;
  }
  if (!data || data.length === 0) {
    throw new NotFoundError("Profile not found");
  }
  return data[0];
}
