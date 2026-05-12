import { requireUser } from "@/lib/middleware/auth";
import { updateTopic } from "@/lib/services/topicsService";
import { supabase } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import { updateTopicSchema } from "@/lib/validators/topic";
import { error } from "console";
import { NextRequest, NextResponse } from "next/server";



export async function GET(
    req : NextRequest,
    context : { params : Promise<{ id : string }>}
) {
    try {
        const { id } = await context.params; 
        const supabase = createServerClient(req);

        const user = await requireUser(supabase);

        const{ data, error } = await supabase
            .from("topics")
            .select("id, name")
            .eq("id", id)
            .eq("user_id", user.id)
            .single()

        if(error || !data){
            return NextResponse.json(
                {error : "Topic not found"},
                {status : 404}
            )
        }
        return NextResponse.json(data)

    } catch (err) {
        console.error(err);
        return NextResponse.json(
            {error : "internal server error"},
            {status : 500}
        )
    }
}



export async function PUT(
    req : NextRequest,
    context : { params : Promise<{ id: string }>}
) {

    try {
        const { id } = await context.params;

        const supabase = createServerClient(req);
    
        const user = await requireUser(supabase);

        const body = await req.json();

        const parsed = updateTopicSchema.safeParse(body);

        if(!parsed.success){
            return NextResponse.json(
                {error : parsed.error.issues[0]?.message || "invalid topic name"},
                {status : 400}
            )
        }
        const updatedTopic = await updateTopic(
            supabase,
            id,
            user.id,
            parsed.data.name
        );

        return NextResponse.json(updatedTopic);
        
    } catch (err) {
        return NextResponse.json(
            {error : "internal server erro"},
            {status : 500}
        )
    }
}




export async function DELETE(
    req : NextRequest,
    context : {params : Promise<{ id : string }>}
) {
    try {
        const { id } = await context.params;

        const supabase = createServerClient(req);

        const user = await requireUser(supabase);

        const { error } = await supabase
            .from("topics")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id)

        if(error){
            return NextResponse.json(
                {error : "failed to delete topic"},
                {status : 500}
            )
        }

        return NextResponse.json({ message : "Deleted successfully"})

    } catch (err) {
        return NextResponse.json(
            {error : "internal server error"},
            {status : 500}
        )
    }
}