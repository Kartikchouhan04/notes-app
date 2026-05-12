import { AppError } from ".";

export function handleError(err : any) {
    console.log("Error : ", err);

    if(err instanceof AppError && err.isOperational){           //known errors
        return Response.json(
            {error : err.message},
            {status : err.statusCode}
        )
    }    
    return Response.json(                                       //unknown errors
        {error : "Internal server error"},
        {status : 500}
    )

    
}