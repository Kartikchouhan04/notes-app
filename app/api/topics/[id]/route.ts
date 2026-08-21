import { handleError } from "@/lib/errors/handleError";
import { requireUser } from "@/lib/middleware/auth";
import {
  deleteTopic,
  getTopicById,
  updateTopic,
} from "@/lib/services/topicsService";
import { createServerClient } from "@/lib/supabase/server";
import { parseBody, parseId, readJson } from "@/lib/validators/params";
import { updateTopicSchema } from "@/lib/validators/topic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: RouteContext) {
  try {
    const supabase = createServerClient(req);
    const user = await requireUser(supabase);

    const { id } = await context.params;
    const topicId = parseId(id, "topic id");

    const topic = await getTopicById(supabase, user.id, topicId);

    return Response.json(topic);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const supabase = createServerClient(req);
    const user = await requireUser(supabase);

    const { id } = await context.params;
    const topicId = parseId(id, "topic id");

    const body = parseBody(updateTopicSchema, await readJson(req));

    const updated = await updateTopic(supabase, user.id, topicId, body.name);

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
    const topicId = parseId(id, "topic id");

    await deleteTopic(supabase, user.id, topicId);

    return Response.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
