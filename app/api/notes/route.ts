import { handleError } from "@/lib/errors/handleError";
import { requireUser } from "@/lib/middleware/auth";
import { createNote, getNotes } from "@/lib/services/noteService";
import { createServerClient } from "@/lib/supabase/server";
import { parseBody, readJson } from "@/lib/validators/params";
import { createNoteSchema, listNotesQuerySchema } from "@/lib/validators/note";

export async function GET(req: Request) {
  try {
    const supabase = createServerClient(req);
    const user = await requireUser(supabase);

    const { searchParams } = new URL(req.url);

    // An invalid topicId used to be dropped silently, which returned every note
    // the user owns instead of the ones in that topic. Now it's a 400.
    const query = parseBody(listNotesQuerySchema, {
      topicId: searchParams.get("topicId") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    const notes = await getNotes(
      supabase,
      user.id,
      query.topicId,
      query.limit,
      query.offset
    );

    return Response.json(notes);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createServerClient(req);
    const user = await requireUser(supabase);

    const body = parseBody(createNoteSchema, await readJson(req));

    const note = await createNote(supabase, user.id, body.text, body.topicId);

    return Response.json(note, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
