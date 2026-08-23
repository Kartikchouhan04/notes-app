"use client";

import { NotesWorkspace } from "@/components/NotesWorkspace";

export default function ArchivePage() {
  return <NotesWorkspace scope={{ kind: "archive" }} title="Archive" />;
}
