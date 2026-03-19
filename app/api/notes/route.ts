import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { error, log } from "console";
import { sup } from "framer-motion/client";


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
    
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers:{
                    Authorization: req.headers.get("Authorization")!,
                },
            },
        },
    );
    const { data : userData, error : userError } = await supabase.auth.getUser()

    if(!userData.user || userError){
        return Response.json([], {status:401})
    }
    const {data, error} = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", {ascending : false})

    if(error){
        return Response.json({error : error.message}, {status : 500})
    }
    return Response.json(data)
}


export async function POST(req : Request) {
    try {
        const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers:{
                    Authorization: req.headers.get("Authorization")!,
                },
            },
        },
    );
        const body = await req.json()

        if(!body.text || typeof body.text !== "string"){
            return Response.json(
                {error : "Text is req and must be a string"},
                {status : 400}
            )
        }
        if(body.text.length < 3){
            return Response.json(
                {error : "Text must be atleast 3 characters"},
                {status : 400}
            )
        }
        const { data : userData} = await supabase.auth.getUser()

        if(!userData.user){
            return Response.json(
                {error : "unauthorized"},
                {status : 401}
            )
        }
        const { data, error} = await supabase.from("notes").insert([
            {
                text : body.text,
                user_id : userData.user.id,
            },
        ]).select()

        if(error){
            return Response.json(
                {error : error.message},
                {status : 400}
            )
        }
        return Response.json(data[0])
   
    } catch (error) {
        return Response.json(
            {error : "invalid req body"},
            {status : 400}
        )
    }
}


export async function DELETE(req : Request) {
    try {
        const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers:{
                    Authorization: req.headers.get("Authorization")!,
                },
            },
        },
    );
        const body = await req.json()
        if(!body.id){
            return Response.json(
                {error : "note ID is req"},
                {status : 400}
            )
        }
        const{ data : userData} = await supabase.auth.getUser()
        if(!userData.user){
            return Response.json(
                {error : "unauthorize"},
                {status : 401}
            )
        }
        const { error } = await supabase
            .from("notes")
            .delete()
            .eq("id", body.id)
            .eq("user_id", userData.user.id)

        if(error){
            return Response.json(
                {error : error.message},
                {status : 400}
            )
        }
        return Response.json({success : true})

    } catch (err) {
        return Response.json(
            {error : "invalid req"},
            {status : 400}
        )
        
    }
}

export async function PUT(req : Request) {
    
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global : {
                    headers : {
                        Authorization : req.headers.get("Authorization")!,
                    }
                }
            }
        )
        const { data : userData, error : userError } = await supabase.auth.getUser();
        if(!userData.user || userError){
            return Response.json(
                {error : "unauthorized" },
                {status : 401}
            )
        }
        const body = await req.json();
        const{ data, error} = await supabase
            .from("notes")
            .update({ text : body.text })
            .eq("id", body.id)
            .eq("user_id", userData.user.id)
            .select();

        if(error){
            return Response.json(
                {error : error.message},
                {status : 400}
            )
        }
        return Response.json(data)
        
    } catch (err) {
        console.log("PUT error :", err);
        return Response.json(
            {error : "something went wrong"},
            {status : 500}
        );
    }
}