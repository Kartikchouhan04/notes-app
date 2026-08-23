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

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "edited", label: "Recently edited" },
  { value: "alpha", label: "Alphabetical" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];
export type ViewMode = "grid" | "list";

export const STORAGE_KEYS = {
  sort: "thought-vault-sort",
  view: "thought-vault-view",
} as const;
