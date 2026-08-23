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
 * Every field is optional so a request can change the text, the pin, the
 * archive state, or move the note to another topic — but sending nothing at
 * all is a bad request rather than a silent no-op.
 */
export const updateNoteSchema = z
  .object({
    text: noteText.optional(),
    pinned: z.boolean().optional(),
    archived: z.boolean().optional(),
    topicId: z.uuid("Invalid topic id").optional(),
  })
  .refine(
    (body) =>
      body.text !== undefined ||
      body.pinned !== undefined ||
      body.archived !== undefined ||
      body.topicId !== undefined,
    { message: "Provide a field to update" }
  );

export const listNotesQuerySchema = z.object({
  topicId: z.uuid("Invalid topic id").optional(),
  /** Free-text filter applied server-side so it spans every page. */
  search: z.string().trim().max(200).optional(),
  /** "true" returns archived notes instead of active ones. */
  archived: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
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
