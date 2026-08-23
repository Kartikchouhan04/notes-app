export interface Topic {
  id: string;
  name: string;
  created_at: string;
  /** Present when the API can resolve the related notes count. */
  note_count?: number;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  text: string;
  created_at: string;
  updated_at?: string;
  topic_id: string;
  pinned?: boolean;
  archived?: boolean;
}

/** Which set of notes a workspace view is showing. */
export type NoteScope =
  | { kind: "all" }
  | { kind: "pinned" }
  | { kind: "topic"; topicId: string }
  | { kind: "archive" };
