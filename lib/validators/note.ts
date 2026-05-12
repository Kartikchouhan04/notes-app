import { z } from "zod";

export const CreateNoteSchema = z.object({
    text : z.string().min(1).max(500),
    topicId : z.string().uuid()
})

export const updateNoteSchema = z.object({
    id : z.string().uuid(),
    text : z.string().min(1)
})

export const deleteNoteSchema = z.object({
    id : z.string().uuid()
});