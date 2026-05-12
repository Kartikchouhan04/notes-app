import { InternalServerError } from "../errors";


export async function createTopic(
    supabase : any,
    userId : string,
    name : string
) {
    const { data, error } = await supabase
        .from("topics")
        .insert({
            name : name.trim(),
            user_id : userId,
        })
        .select();

    if(error){
        console.error("Supabase createTopic error :", error)
        throw new InternalServerError("Failed to create topic")
    }
    if(!data || data.length === 0){
        throw new InternalServerError("Topic not created")
    }
    return data[0];    
}



export async function getTopic(
    supabase : any,
    userId : string
) {
    const { data, error } = await supabase
        .from("topics")
        .select("id, name, created_at")
        .eq("user_id", userId)
        .order("created_at", {ascending : false})
    
    if(error){
        console.error("Supabase getTopic error :", error)
        throw new InternalServerError("failed to fetch topics")
    }
    
    
    return data ?? [];
}



export async function updateTopic(
    supabase : any,
    topicId : string,
    userId : string,
    name : string
) {
    const { data, error } = await supabase
        .from("topics")
        .update({ name : name.trim() })
        .eq("id", topicId)
        .eq("user_id", userId)
        .select("id, name")
        .single()

    if(error){
        console.error("supabase update topic error:", error)
        throw new InternalServerError("failed to update topic name")
    }
    if(!data){
        throw new InternalServerError("topic not found");
    }
    return data;


}