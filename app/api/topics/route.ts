import { handleError } from "@/lib/errors/handleError";
import { requireUser } from "@/lib/middleware/auth";
import { createTopic, getTopics } from "@/lib/services/topicsService";
import { createServerClient } from "@/lib/supabase/server";
import { parseBody, readJson } from "@/lib/validators/params";
import { createTopicSchema } from "@/lib/validators/topic";

export async function GET(req: Request) {
  try {
    const supabase = createServerClient(req);
    const user = await requireUser(supabase);

    const topics = await getTopics(supabase, user.id);

    return Response.json(topics);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createServerClient(req);
    const user = await requireUser(supabase);

    const body = parseBody(createTopicSchema, await readJson(req));

    const topic = await createTopic(supabase, user.id, body.name);

    return Response.json(topic, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
