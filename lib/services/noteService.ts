import { InternalServerError, NotFoundError } from "../errors";


export async function getNote(
    supabase : any,
    userId : string,
    topicId? : string,
    from = 0,
    to = 9
){
    let query = supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", {ascending : false})
        .range(from, to);                       //pagination

    if(topicId){
        query = query.eq("topic_id", topicId);
    }
    const{ data, error } = await query;

   
    if(error){
        console.error("getNotes error : ", error)
        throw new InternalServerError("Database Error");
    }
    return data ?? [];
}


export async function createNote(
    supabse : any,
    userId : string,
    text : string,
    topicId : string
) {
    const{ data, error } = await supabse
        .from("notes")
        .insert({
            text,
            user_id : userId,
            topic_id : topicId,
        })
        .select();

    // if(error){
    //     console.error("createNote error : ", error);
    //     throw new Error("Database error");        
    // }
    // if(!data || data.length === 0){
    //     throw new Error("Failed to create note");
    // }
    if(error){
        console.error("createNote error : ", error);
        throw new InternalServerError("Database Error");
    }
    if(!data || data.length === 0){
        throw new InternalServerError("Failed to create note");
    }
    return data[0];
}


export async function deleteNote(
    supabase : any,
    userId : string,
    noteId : string
){
    const { data, error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId)
        .eq("user_id", userId)
        .select()
 
    // if(error){
    //     console.error("deleteNote error : ", error)
    //     throw new Error("Database error")
    // }
    // if(!data || data.length === 0){
    //     throw new Error("note not found")
    // }
    if(error){
        console.error("deleteNote error : ", error)
        throw new InternalServerError("Database error");
    }
    if(!data || data.length ===0){
        throw new NotFoundError("Note not found")
    }
    return true;
}


export async function updateNote(
    supabase : any,
    userId : string,
    noteId : string,
    text? : string,
    pinned? : boolean
) {
    console.log("UPDATE DEBUG:", {
        noteId,
        userId
    });

    const { data : existing, error : fetchError } = await supabase              
        .from("notes")                                   
        .select("*")                        
        .eq("id", noteId)  
        .eq("user_id", userId)
        .maybeSingle();

    if(fetchError){
        throw new InternalServerError("fetch failed");
    }

    if(!existing){
        throw new NotFoundError("note not found");
    }
    if(
        (text === undefined || text === existing.text ) &&
        (pinned === undefined || pinned === existing.pinned) 
    ){
        return existing;
    }
    
    const updatePayload:any  = {};

    if(text !== undefined) updatePayload.text = text;
    if(pinned !== undefined) updatePayload.pinned = pinned;


    const { error : updateError} = await supabase 
        .from("notes")
        .update(updatePayload)
        .eq("id", noteId)
        .eq("user_id", userId)
    
    if(updateError){
        console.error("updateNote error : ", updateError)
        throw new InternalServerError("update failed");
    }
    const { data: updatedNote, error : finalError} = await supabase
        .from("notes")
        .select("*")
        .eq("id", noteId)
        .eq("user_id", userId)
        .single()

    console.log("UPDATE RESULT:", updatedNote);

    if (finalError || !updatedNote) {
        throw new InternalServerError("Failed to fetch updated note");
    }

    return updatedNote;
    // return data?.[0] ?? { id : noteId, text };
}