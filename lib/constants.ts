/**
 * Field limits shared by the Zod schemas and the UI, so the form can stop the
 * user at the same point the API would reject them.
 */
export const NOTE_MAX_LENGTH = 5000;
export const TOPIC_MAX_LENGTH = 50;

/** Max notes returned by GET /api/notes in one request. */
export const NOTES_PAGE_SIZE = 200;
