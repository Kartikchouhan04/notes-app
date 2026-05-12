import { BadRequestError } from "@/lib/errors";
import { handleError } from "@/lib/errors/handleError";
import { requireUser } from "@/lib/middleware/auth";
import { createTopic, getTopic } from "@/lib/services/topicsService";
import { createServerClient } from "@/lib/supabase/server";
import { createTopicSchema } from "@/lib/validators/topic";




export async function GET(req : Request) {
    try {
        const supabase = createServerClient(req);

        const user = await requireUser(supabase);

        const topics = await getTopic(supabase, user.id);

        return Response.json(topics);
        
    } catch (err) {
        return handleError(err);
    }
}

export async function POST(req : Request) {
    try {
        const supabase = createServerClient(req);

        const user = await requireUser(supabase);

        const body = await req.json();
        
        const parsed = createTopicSchema.safeParse(body);

        if(!parsed.success){
            throw new BadRequestError(
                parsed.error.issues[0]?.message || "Invalid topic name"
            )
        }
        const topic = await createTopic(
            supabase,
            user.id,
            parsed.data.name
        );
        
        return Response.json(topic);
        
    } catch (err) {
        return handleError(err);
    }
   
}


