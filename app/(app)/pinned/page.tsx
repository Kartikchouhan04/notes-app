"use client";

import { NotesWorkspace } from "@/components/NotesWorkspace";

export default function PinnedNotesPage() {
  return <NotesWorkspace scope={{ kind: "pinned" }} title="Pinned" />;
}
