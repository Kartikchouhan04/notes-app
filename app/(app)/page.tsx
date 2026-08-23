"use client";

import { NotesWorkspace } from "@/components/NotesWorkspace";

export default function AllNotesPage() {
  return <NotesWorkspace scope={{ kind: "all" }} title="All notes" />;
}
