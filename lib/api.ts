import { supabase } from "@/lib/supabase";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** The API surfaces errors in a few different shapes; normalise them here. */
export function getErrorMessage(
  payload: unknown,
  fallback = "Something went wrong"
): string {
  if (payload instanceof Error) return payload.message || fallback;
  if (!payload || typeof payload !== "object") return fallback;

  const data = payload as Record<string, unknown>;

  if (typeof data.error === "string") return data.error;

  // Zod-style issue lists arrive under either `error` or `details`.
  for (const key of ["error", "details"] as const) {
    const value = data[key];
    if (Array.isArray(value)) {
      const first = value[0];
      if (first && typeof first === "object" && "message" in first) {
        const message = (first as { message: unknown }).message;
        if (typeof message === "string") return message;
      }
    }
  }

  if (typeof data.message === "string") return data.message;

  return fallback;
}

/** fetch() with the Supabase access token attached and errors thrown as ApiError. */
export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(path, { ...init, headers });
  } catch {
    throw new ApiError("Network error — check your connection", 0);
  }

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    throw new ApiError(getErrorMessage(payload, `Request failed (${res.status})`), res.status);
  }

  return payload as T;
}
