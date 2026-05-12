console.log("🔥 [ID ROUTE HIT]");

import { BadRequestError } from "@/lib/errors";
import { handleError } from "@/lib/errors/handleError";
import { requireUser } from "@/lib/middleware/auth";
import { updateNote } from "@/lib/services/noteService";
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";




export async function PUT(
    req : Request,
    context : any
) {
    try {
        const { id } = await context.params ;

        console.log("PARAM id :", id);
        
        const body = await req.json();
        
        console.log("BODY RECEIVED:", body);

        if(!id){
            return NextResponse.json(
                {error : "ID is missing"},
                {status : 400}
            )
        }
        const supabase = createServerClient(req);
        const user = await requireUser(supabase);

        const updated = await updateNote(
            supabase,
            user.id,
            id,
            body.text,
            body.pinned 
        );

      
        return Response.json(updated);
    } catch (err) {
        console.error("PUT Error :",err);

        return NextResponse.json(
            {error : "something went wrong"},
            {status : 500}
        )
        
    }
    
}




export async function DELETE(
    req : Request,
    context : any
) {
    try {
        const resolvedParams = await context.params;
        const id = resolvedParams.id;

        console.log("DELETE ID :", id);
        

        if(!id){
            throw new BadRequestError("invalid note id");
        }

        const supabase = createServerClient(req)
        const user = await requireUser(supabase);


        const result = await supabase
            .from("notes")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id)
    
        console.log("DELETE result", result);
        if(result.error){
            throw new BadRequestError(result.error.message);
        }
        

        // await deleteNote(
        //     supabase,
        //     user.id,
        //     id
        // )
        return NextResponse.json({success : true})

    } catch (err : any) {

        return handleError(err);
    }
}
