console.log("🔥 ROOT ROUTE HIT");

import { BadRequestError } from "@/lib/errors";
import { handleError } from "@/lib/errors/handleError";
import { requireUser } from "@/lib/middleware/auth";
import { createNote, deleteNote, getNote, updateNote } from "@/lib/services/noteService";
import { createServerClient } from "@/lib/supabase/server";
import { deleteNoteSchema, CreateNoteSchema, updateNoteSchema } from "@/lib/validators/note";


// const supabase = createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//         global : {
//             headers : {
//                 Authorization : req.headers.get("Authorization")!,
//             },
//         },
//     }
// )

export async function GET(req : Request) {

    try {
        
    const supabase = createServerClient(req);

    const user = await requireUser(supabase);
   
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId");

    const isValidUUID = (id : string) =>
        /^[0-9a-fA-F-]{36}$/.test(id);

    let safeTopicId: string | undefined = undefined;
    
    if (topicId && isValidUUID(topicId)) {
        safeTopicId = topicId;
    }

    const notes = await getNote(
        supabase, 
        user.id,
        safeTopicId,
    );

    return Response.json(notes);
        
    } catch (err : any) {

        return handleError(err);
    }
}


export async function POST(req : Request) {
    try {
        const supabase = createServerClient(req);
        const body = await req.json()
        const parsed = CreateNoteSchema.safeParse(body);

        if(!parsed.success){
           
            throw new BadRequestError("Invalid note input")
        }

       

        const user = await requireUser(supabase);
        const note = await createNote(
            supabase,
            user.id,
            parsed.data.text,
            parsed.data.topicId,
        )
        return Response.json(note)
   
    } catch (err : any) {

        return handleError(err);
     
    }
}


// export async function DELETE(req : Request) {
//     try {
//         const supabase = createServerClient(req)
//         const body = await req.json()
//         const parsed = deleteNoteSchema.safeParse(body);

//         if(!parsed.success){
            
//             throw new BadRequestError("Invalid note id")
//         }
        

//         const user = await requireUser(supabase);

//         await deleteNote(
//             supabase,
//             user.id,
//             parsed.data.id
//         )
//         return Response.json({success : true})

//     } catch (err : any) {

//         return handleError(err);
//     }
// }




// export async function PUT(req : Request) {
    
//     try {
//         const supabase = createServerClient(req);
//         const body = await req.json()
//         const parsed = updateNoteSchema.safeParse(body);

//         if(!parsed.success){
           
//             throw new BadRequestError("Invalid update data");
//         }

        

//         const user = await requireUser(supabase);

//         const updatedNote = await updateNote(
//             supabase,
//             user.id,
//             parsed.data.id,
//             parsed.data.text
//         );
//         console.log("BODY RECEIVED:", body);
//         console.log("PARSED:", parsed);
        
//         return Response.json(updatedNote);
        
//     } catch (err : any) {
        
//         return handleError(err);
//     }
// }