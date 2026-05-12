import { createClient } from "@supabase/supabase-js";

export function createServerClient(req : any){
    const authHeader = req.headers.get("authorization");


    if(!authHeader){
        throw new Error("missing authorization header"); 
    }
    const token = authHeader.replace("Bearer ","");

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global : {
                headers : {
                    Authorization : `Bearer ${token}`
                }
            }
        }
    )
}