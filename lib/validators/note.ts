import { z } from "zod";
import { NOTE_MAX_LENGTH, NOTES_PAGE_SIZE } from "../constants";

const noteText = z
  .string()
  .trim()
  .min(1, "Note cannot be empty")
  .max(NOTE_MAX_LENGTH, `Note cannot exceed ${NOTE_MAX_LENGTH} characters`);

export const createNoteSchema = z.object({
  text: noteText,
  topicId: z.uuid("Invalid topic id"),
});

/**
 * Both fields are optional so a request can change the text, the pin, or both —
 * but sending neither is a bad request rather than a silent no-op.
 */
export const updateNoteSchema = z
  .object({
    text: noteText.optional(),
    pinned: z.boolean().optional(),
  })
  .refine((body) => body.text !== undefined || body.pinned !== undefined, {
    message: "Provide text or pinned to update",
  });

export const listNotesQuerySchema = z.object({
  topicId: z.uuid("Invalid topic id").optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(NOTES_PAGE_SIZE)
    .default(NOTES_PAGE_SIZE),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
