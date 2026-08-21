import { z } from "zod";
import { BadRequestError } from "../errors";

const uuid = z.uuid();

/**
 * Route params arrive as untrusted strings. Rejecting a malformed id here means
 * Postgres never sees it, so the caller gets a 400 instead of a 500.
 */
export function parseId(value: unknown, label = "id"): string {
  const result = uuid.safeParse(value);
  if (!result.success) {
    throw new BadRequestError(`Invalid ${label}`);
  }
  return result.data;
}

/** Turns a Zod failure into a 400 carrying the first useful message. */
export function parseBody<T>(
  schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false; error: z.ZodError } },
  input: unknown,
  fallback = "Invalid request body"
): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new BadRequestError(result.error.issues[0]?.message || fallback);
  }
  return result.data;
}

/** req.json() throws on an empty or malformed body; that's a 400, not a 500. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON");
  }
}
