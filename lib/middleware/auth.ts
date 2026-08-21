import type { SupabaseClient, User } from "@supabase/supabase-js";
import { UnauthorizedError } from "../errors";

/**
 * Verifies the caller's token with Supabase and returns the user.
 * Throws UnauthorizedError when the token is missing, expired or invalid.
 */
export async function requireUser(supabase: SupabaseClient): Promise<User> {
  const { data, error } = await supabase.auth.getUser();

  // A null user with no error is still an unauthenticated request.
  if (error || !data?.user) {
    throw new UnauthorizedError();
  }

  return data.user;
}
