import { UnauthorizedError } from "../errors";

export async function requireUser(supabase : any) {
    const { data : userData, error : userError } = 
        await supabase.auth.getUser();

    if(!userData || userError){
        throw new UnauthorizedError();
    }
    return userData.user;

    
}