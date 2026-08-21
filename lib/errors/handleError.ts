import { AppError } from ".";

/**
 * Postgres / PostgREST codes that mean "the caller got it wrong", mapped to the
 * status they deserve. Anything not listed here is treated as a server fault.
 */
const CODE_MAP: Record<string, { status: number; message: string }> = {
  "22P02": { status: 400, message: "Invalid value in request" },
  "23502": { status: 400, message: "Missing required field" },
  "23503": { status: 400, message: "Referenced record does not exist" },
  "23505": { status: 409, message: "That record already exists" },
  "42501": { status: 403, message: "Not allowed" },
  PGRST116: { status: 404, message: "Not found" },
};

function getCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  return undefined;
}

export function handleError(err: unknown) {
  // Known, expected failures carry their own status and a safe message.
  if (err instanceof AppError && err.isOperational) {
    return Response.json({ error: err.message }, { status: err.statusCode });
  }

  const mapped = CODE_MAP[getCode(err) ?? ""];
  if (mapped) {
    console.error("Handled database error:", err);
    return Response.json({ error: mapped.message }, { status: mapped.status });
  }

  // Unknown failure: log the detail, return nothing that could leak internals.
  console.error("Unhandled error:", err);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
