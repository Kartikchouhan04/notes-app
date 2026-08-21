import { handleError } from "@/lib/errors/handleError";
import { requireUser } from "@/lib/middleware/auth";
import { getProfile, updateProfile } from "@/lib/services/profileService";
import { createServerClient } from "@/lib/supabase/server";
import { parseBody, readJson } from "@/lib/validators/params";
import { updateProfileSchema } from "@/lib/validators/profile";

export async function GET(req: Request) {
  try {
    const supabase = createServerClient(req);
    const user = await requireUser(supabase);

    const profile = await getProfile(supabase, user.id);

    return Response.json(profile);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = createServerClient(req);
    const user = await requireUser(supabase);

    const body = parseBody(updateProfileSchema, await readJson(req));

    const profile = await updateProfile(supabase, user.id, body.full_name);

    return Response.json(profile);
  } catch (err) {
    return handleError(err);
  }
}
