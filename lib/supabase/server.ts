import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { InternalServerError, UnauthorizedError } from "../errors";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Builds a Supabase client that acts as the caller: the anon key identifies the
 * project, the caller's access token identifies the user, and RLS does the rest.
 */
export function createServerClient(req: Request): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // A config problem, not a caller problem — surfaces as a 500.
    throw new InternalServerError("Supabase environment variables are not set");
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    throw new UnauthorizedError("Missing authorization header");
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    throw new UnauthorizedError("Missing access token");
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: {
      // Server requests are stateless; never try to persist or refresh a session.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
