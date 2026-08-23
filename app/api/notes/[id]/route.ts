import { handleError } from "@/lib/errors/handleError";
import { requireUser } from "@/lib/middleware/auth";
import { deleteNote, updateNote } from "@/lib/services/noteService";
import { createServerClient } from "@/lib/supabase/server";
import { parseBody, parseId, readJson } from "@/lib/validators/params";
import { updateNoteSchema } from "@/lib/validators/note";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: Request, context: RouteContext) {
  try {
    const supabase = createServerClient(req);
    const user = await requireUser(supabase);

    const { id } = await context.params;
    const noteId = parseId(id, "note id");

    const body = parseBody(updateNoteSchema, await readJson(req));

    const updated = await updateNote(supabase, user.id, noteId, body);

    return Response.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const supabase = createServerClient(req);
    const user = await requireUser(supabase);

    const { id } = await context.params;
    const noteId = parseId(id, "note id");

    await deleteNote(supabase, user.id, noteId);

    return Response.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
