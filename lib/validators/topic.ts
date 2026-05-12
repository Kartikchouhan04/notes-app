import z from "zod";

export const createTopicSchema = z.object({
    name : z.string().min(1).max(50)
})

export const updateTopicSchema = z.object({
    name : z.string().min(1).max(50)
})