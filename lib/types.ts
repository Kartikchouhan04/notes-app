export interface Topic {
  id: string;
  name: string;
  created_at: string;
  /** Present when the API can resolve the related notes count. */
  note_count?: number;
}

export interface Note {
  id: string;
  text: string;
  created_at: string;
  topic_id: string;
  pinned?: boolean;
}
