/**
 * Field limits shared by the Zod schemas and the UI, so the form can stop the
 * user at the same point the API would reject them.
 */
export const NOTE_MAX_LENGTH = 5000;
export const TOPIC_MAX_LENGTH = 50;
export const FULL_NAME_MAX_LENGTH = 80;

/**
 * Client-side floor only — the enforceable policy lives in Supabase
 * Auth settings, since anyone can call the auth API directly.
 */
export const MIN_PASSWORD_LENGTH = 8;

/** Max notes returned by GET /api/notes in one request. */
export const NOTES_PAGE_SIZE = 200;
