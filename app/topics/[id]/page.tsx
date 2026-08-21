"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { NOTE_MAX_LENGTH } from "@/lib/constants";
import type { Note, Topic } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState, SkeletonGrid } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import {
  ArrowLeftIcon,
  NoteIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  TrashIcon,
  XIcon,
} from "@/components/ui/Icons";

export default function TopicNotesPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const topicId = typeof params.id === "string" ? params.id : params.id?.[0];

  const [notes, setNotes] = useState<Note[]>([]);
  const [topicName, setTopicName] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const composer = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const { data } = await supabase.auth.getUser();
      if (!active) return;

      if (!data.user) {
        router.replace("/login");
        return;
      }
      setEmail(data.user.email ?? null);

      if (!topicId) {
        setLoading(false);
        return;
      }

      const [topicResult, notesResult] = await Promise.allSettled([
        apiFetch<Topic>(`/api/topics/${topicId}`),
        apiFetch<Note[]>(`/api/notes?topicId=${topicId}`),
      ]);

      if (!active) return;

      if (topicResult.status === "fulfilled") {
        setTopicName(topicResult.value?.name ?? "Untitled topic");
      } else {
        toast.error("Couldn't load topic", getErrorMessage(topicResult.reason));
      }

      if (notesResult.status === "fulfilled") {
        setNotes(
          Array.isArray(notesResult.value)
            ? notesResult.value.filter((n) => n && n.id)
            : []
        );
      } else {
        toast.error("Couldn't load notes", getErrorMessage(notesResult.reason));
      }

      setLoading(false);
    }

    bootstrap();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  const { pinned, rest, matched } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const visible = q
      ? notes.filter((n) => n.text?.toLowerCase().includes(q))
      : notes;

    const byNewest = (a: Note, b: Note) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

    return {
      matched: visible.length,
      pinned: visible.filter((n) => n.pinned).sort(byNewest),
      rest: visible.filter((n) => !n.pinned).sort(byNewest),
    };
  }, [notes, search]);

  async function addNote() {
    const text = draft.trim();
    if (!text) {
      toast.warning("Nothing to save", "Write something first.");
      composer.current?.focus();
      return;
    }
    if (!topicId) return;

    setCreating(true);
    try {
      const created = await apiFetch<Note>("/api/notes", {
        method: "POST",
        body: JSON.stringify({ text, topicId }),
      });
      setNotes((prev) => [created, ...prev]);
      setDraft("");
      toast.success("Note saved");
      composer.current?.focus();
    } catch (err) {
      toast.error("Couldn't save note", getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function saveEdit(note: Note) {
    const text = editingText.trim();
    if (!text) {
      toast.warning("Note can't be empty");
      return;
    }
    if (text === note.text) {
      setEditingId(null);
      setEditingText("");
      return;
    }

    setSavingId(note.id);
    try {
      const updated = await apiFetch<Note>(`/api/notes/${note.id}`, {
        method: "PUT",
        body: JSON.stringify({ text }),
      });
      const next = Array.isArray(updated) ? updated[0] : updated;
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, ...next, text } : n))
      );
      setEditingId(null);
      setEditingText("");
      toast.success("Note updated");
    } catch (err) {
      toast.error("Couldn't update note", getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  }

  async function togglePin(note: Note) {
    const nextPinned = !note.pinned;
    setBusyId(note.id);

    // Flip locally first so the card moves the instant it is clicked.
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, pinned: nextPinned } : n))
    );

    try {
      await apiFetch(`/api/notes/${note.id}`, {
        method: "PUT",
        body: JSON.stringify({ text: note.text, pinned: nextPinned }),
      });
      toast.info(nextPinned ? "Pinned to top" : "Unpinned");
    } catch (err) {
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, pinned: note.pinned } : n))
      );
      toast.error("Couldn't update pin", getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteNote(note: Note) {
    const ok = await confirm({
      title: "Delete this note?",
      description: "Once it's gone, there's no way to bring it back.",
      confirmLabel: "Delete note",
    });
    if (!ok) return;

    setBusyId(note.id);
    const snapshot = notes;
    setNotes((prev) => prev.filter((n) => n.id !== note.id));

    try {
      await apiFetch(`/api/notes/${note.id}`, { method: "DELETE" });
      toast.success("Note deleted");
    } catch (err) {
      setNotes(snapshot);
      toast.error("Couldn't delete note", getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const noteCardProps = (note: Note) => ({
    note,
    isEditing: editingId === note.id,
    editingText,
    saving: savingId === note.id,
    busy: busyId === note.id,
    onEditStart: () => {
      setEditingId(note.id);
      setEditingText(note.text);
    },
    onEditChange: setEditingText,
    onEditCancel: () => {
      setEditingId(null);
      setEditingText("");
    },
    onEditSave: () => saveEdit(note),
    onTogglePin: () => togglePin(note),
    onDelete: () => deleteNote(note),
  });

  return (
    <div className="min-h-screen">
      <AppHeader email={email} />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1.5 rounded-lg py-1 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeftIcon size={15} />
          All topics
        </button>

        {/* Topic heading */}
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {loading ? (
                <span className="skeleton block h-9 w-56 rounded-lg" />
              ) : (
                topicName || "Untitled topic"
              )}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {loading
                ? "Fetching notes…"
                : notes.length === 0
                  ? "No notes yet — the page below is yours to fill."
                  : `${notes.length} ${notes.length === 1 ? "note" : "notes"}${
                      pinned.length ? ` · ${pinned.length} pinned` : ""
                    }`}
            </p>
          </div>

          {notes.length > 0 && (
            <div className="relative w-full sm:w-72">
              <SearchIcon
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes"
                aria-label="Search notes"
                className="field !pl-10 !pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-faint hover:bg-[var(--surface-hover)] hover:text-ink"
                >
                  <XIcon size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="surface-card mt-7 p-4">
          <textarea
            ref={composer}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                addNote();
              }
            }}
            rows={3}
            placeholder="Capture a thought…"
            aria-label="New note"
            maxLength={NOTE_MAX_LENGTH}
            className="field !resize-none !border-transparent !bg-transparent !px-1 !text-base sm:!px-2"
          />
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
            <span className="text-[0.6875rem] text-faint">
              {draft.length > NOTE_MAX_LENGTH * 0.8 ? (
                <span className="text-[var(--warning)]">
                  {draft.length.toLocaleString()} / {NOTE_MAX_LENGTH.toLocaleString()}
                </span>
              ) : (
                <>
                  <kbd className="rounded border border-[var(--border)] bg-[var(--surface-sunken)] px-1.5 py-0.5 font-sans">
                    Ctrl
                  </kbd>
                  {" + "}
                  <kbd className="rounded border border-[var(--border)] bg-[var(--surface-sunken)] px-1.5 py-0.5 font-sans">
                    Enter
                  </kbd>{" "}
                  to save
                </>
              )}
            </span>
            <Button
              onClick={addNote}
              loading={creating}
              disabled={!draft.trim()}
              size="sm"
            >
              <PlusIcon size={15} />
              Add note
            </Button>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-8">
          {loading ? (
            <SkeletonGrid count={6} />
          ) : notes.length === 0 ? (
            <EmptyState
              icon={<NoteIcon size={22} />}
              title="No notes in this topic"
              description="Everything you write here stays filed under this topic. Start with a single line."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => composer.current?.focus()}
                >
                  <PlusIcon size={15} />
                  Write a note
                </Button>
              }
            />
          ) : matched === 0 ? (
            <EmptyState
              icon={<SearchIcon size={22} />}
              title="No matching notes"
              description={`Nothing in this topic mentions “${search}”.`}
              action={
                <Button variant="secondary" size="sm" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <div className="space-y-10">
              {pinned.length > 0 && (
                <section>
                  <SectionLabel
                    icon={<StarIcon size={13} filled />}
                    label="Pinned"
                    count={pinned.length}
                  />
                  <NoteGrid>
                    <AnimatePresence mode="popLayout">
                      {pinned.map((note) => (
                        <NoteCard key={note.id} {...noteCardProps(note)} />
                      ))}
                    </AnimatePresence>
                  </NoteGrid>
                </section>
              )}

              {rest.length > 0 && (
                <section>
                  {pinned.length > 0 && (
                    <SectionLabel
                      icon={<NoteIcon size={13} />}
                      label="All notes"
                      count={rest.length}
                    />
                  )}
                  <NoteGrid>
                    <AnimatePresence mode="popLayout">
                      {rest.map((note) => (
                        <NoteCard key={note.id} {...noteCardProps(note)} />
                      ))}
                    </AnimatePresence>
                  </NoteGrid>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SectionLabel({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
      <span className="text-[var(--primary)]">{icon}</span>
      {label}
      <span className="rounded-full bg-[var(--surface-sunken)] px-2 py-0.5 text-[0.6875rem] normal-case tracking-normal text-faint">
        {count}
      </span>
      <span className="ml-1 h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}

function NoteGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function NoteCard({
  note,
  isEditing,
  editingText,
  saving,
  busy,
  onEditStart,
  onEditChange,
  onEditCancel,
  onEditSave,
  onTogglePin,
  onDelete,
}: {
  note: Note;
  isEditing: boolean;
  editingText: string;
  saving: boolean;
  busy: boolean;
  onEditStart: () => void;
  onEditChange: (value: string) => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  const timestamp = note.created_at
    ? new Date(note.created_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Just now";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={`group surface-card relative flex flex-col p-5 transition-[box-shadow,border-color,transform] duration-200 ${
        isEditing
          ? "border-[var(--primary)] shadow-[var(--shadow-lift)]"
          : "hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lift)]"
      } ${note.pinned && !isEditing ? "border-[var(--warning)]/45" : ""} ${
        busy ? "pointer-events-none opacity-60" : ""
      }`}
    >
      {!isEditing && (
        <div className="absolute right-3 top-3 flex gap-0.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
          <IconButton
            label={note.pinned ? "Unpin note" : "Pin note"}
            tone="warning"
            onClick={onTogglePin}
            className={note.pinned ? "text-[var(--warning)] opacity-100" : ""}
          >
            <StarIcon size={15} filled={note.pinned} />
          </IconButton>
          <IconButton label="Edit note" tone="primary" onClick={onEditStart}>
            <PencilIcon size={15} />
          </IconButton>
          <IconButton label="Delete note" tone="danger" onClick={onDelete}>
            <TrashIcon size={15} />
          </IconButton>
        </div>
      )}

      {/* A pinned note keeps its star visible even when not hovered. */}
      {note.pinned && !isEditing && (
        <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center text-[var(--warning)] transition-opacity duration-150 group-hover:opacity-0">
          <StarIcon size={15} filled />
        </span>
      )}

      {isEditing ? (
        <>
          <textarea
            value={editingText}
            onChange={(e) => onEditChange(e.target.value)}
            autoFocus
            disabled={saving}
            rows={4}
            onKeyDown={(e) => {
              if (e.key === "Escape") onEditCancel();
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onEditSave();
            }}
            aria-label="Edit note"
            maxLength={NOTE_MAX_LENGTH}
            className="field !resize-y !px-2.5 !py-2 text-sm leading-relaxed"
          />
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={onEditSave} loading={saving}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={onEditCancel} disabled={saving}>
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={onEditStart}
          className="flex flex-1 cursor-text flex-col items-start text-left"
        >
          <p className="w-full whitespace-pre-wrap break-words pr-20 text-sm leading-relaxed text-ink">
            {note.text}
          </p>
          <span className="mt-auto pt-4 text-xs text-faint">{timestamp}</span>
        </button>
      )}
    </motion.article>
  );
}
