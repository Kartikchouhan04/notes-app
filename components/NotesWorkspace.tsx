"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { apiFetch, getErrorMessage } from "@/lib/api";
import {
  NOTE_MAX_LENGTH,
  SORT_OPTIONS,
  STORAGE_KEYS,
  type SortKey,
  type ViewMode,
} from "@/lib/constants";
import type { Note, NoteScope } from "@/lib/types";
import { useTopics } from "./TopicsProvider";
import { NoteCard } from "./NoteCard";
import { Button } from "./ui/Button";
import { Menu } from "./ui/Menu";
import { EmptyState } from "./ui/States";
import { useToast } from "./ui/Toast";
import { useConfirm } from "./ui/ConfirmDialog";
import {
  ArchiveIcon,
  CheckIcon,
  GridIcon,
  LayersIcon,
  ListIcon,
  NoteIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  SortIcon,
  TrashIcon,
  XIcon,
} from "./ui/Icons";

const EASE = [0.2, 0, 0, 1] as const;
const SEARCH_DEBOUNCE_MS = 250;

function readStored<T extends string>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return (localStorage.getItem(key) as T) || fallback;
  } catch {
    return fallback;
  }
}

export function NotesWorkspace({
  scope,
  title,
  subtitle,
}: {
  scope: NoteScope;
  title: string;
  subtitle?: string;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const { topics, adjustCount, refresh: refreshTopics } = useTopics();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<ViewMode>("grid");

  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const composer = useRef<HTMLTextAreaElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  const isArchive = scope.kind === "archive";
  const topicId = scope.kind === "topic" ? scope.topicId : undefined;

  // Restore saved view preferences once, on the client.
  useEffect(() => {
    setSort(readStored<SortKey>(STORAGE_KEYS.sort, "newest"));
    setView(readStored<ViewMode>(STORAGE_KEYS.view, "grid"));
  }, []);

  function persist(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage may be unavailable */
    }
  }

  // Debounce search so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (topicId) params.set("topicId", topicId);
    if (isArchive) params.set("archived", "true");
    if (debounced) params.set("search", debounced);

    try {
      const result = await apiFetch<Note[]>(`/api/notes?${params.toString()}`);
      setNotes(Array.isArray(result) ? result.filter((n) => n && n.id) : []);
    } catch (err) {
      toast.error("Couldn't load notes", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [topicId, isArchive, debounced, toast]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // "/" focuses search, the way most list UIs behave.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchInput.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const topicById = useMemo(
    () => new Map(topics.map((t) => [t.id, t])),
    [topics]
  );

  const visible = useMemo(() => {
    let list = notes;
    if (scope.kind === "pinned") list = list.filter((n) => n.pinned);

    const sorted = [...list].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "edited":
          return (
            new Date(b.updated_at ?? b.created_at).getTime() -
            new Date(a.updated_at ?? a.created_at).getTime()
          );
        case "alpha":
          return a.text.localeCompare(b.text, undefined, { sensitivity: "base" });
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    // Pinned notes float to the top everywhere except the archive.
    if (isArchive || scope.kind === "pinned") return sorted;
    return [
      ...sorted.filter((n) => n.pinned),
      ...sorted.filter((n) => !n.pinned),
    ];
  }, [notes, sort, scope.kind, isArchive]);

  async function addNote() {
    const text = draft.trim();
    if (!text || !topicId) return;

    setCreating(true);
    try {
      const created = await apiFetch<Note>("/api/notes", {
        method: "POST",
        body: JSON.stringify({ text, topicId }),
      });
      setNotes((prev) => [created, ...prev]);
      adjustCount(topicId, 1);
      setDraft("");
      toast.success("Note saved");
      composer.current?.focus();
    } catch (err) {
      toast.error("Couldn't save note", getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  /** Optimistically patch a note, rolling back if the request fails. */
  async function patch(
    note: Note,
    changes: Record<string, unknown>,
    optimistic: Partial<Note>,
    messages: { ok?: string; fail: string },
    removeFromList = false
  ) {
    const snapshot = notes;
    setBusyId(note.id);

    if (removeFromList) {
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
    } else {
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, ...optimistic } : n))
      );
    }

    try {
      await apiFetch(`/api/notes/${note.id}`, {
        method: "PUT",
        body: JSON.stringify(changes),
      });
      if (messages.ok) toast.success(messages.ok);
      return true;
    } catch (err) {
      setNotes(snapshot);
      toast.error(messages.fail, getErrorMessage(err));
      return false;
    } finally {
      setBusyId(null);
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
      await apiFetch(`/api/notes/${note.id}`, {
        method: "PUT",
        body: JSON.stringify({ text }),
      });
      setNotes((prev) =>
        prev.map((n) =>
          n.id === note.id
            ? { ...n, text, updated_at: new Date().toISOString() }
            : n
        )
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

  async function deleteNote(note: Note) {
    const ok = await confirm({
      title: isArchive ? "Delete this note forever?" : "Delete this note?",
      description: "Once it's gone, there's no way to bring it back.",
      confirmLabel: "Delete",
    });
    if (!ok) return;

    const snapshot = notes;
    setBusyId(note.id);
    setNotes((prev) => prev.filter((n) => n.id !== note.id));

    try {
      await apiFetch(`/api/notes/${note.id}`, { method: "DELETE" });
      if (!note.archived) adjustCount(note.topic_id, -1);
      toast.success("Note deleted");
    } catch (err) {
      setNotes(snapshot);
      toast.error("Couldn't delete note", getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function emptyArchive() {
    const ok = await confirm({
      title: `Permanently delete ${notes.length} archived ${
        notes.length === 1 ? "note" : "notes"
      }?`,
      description: "This empties the archive completely and cannot be undone.",
      confirmLabel: "Delete all",
    });
    if (!ok) return;

    const snapshot = notes;
    setNotes([]);
    try {
      const result = await apiFetch<{ deleted: number }>(
        "/api/notes?archived=true",
        { method: "DELETE" }
      );
      toast.success(`Archive emptied`, `${result.deleted} notes removed.`);
    } catch (err) {
      setNotes(snapshot);
      toast.error("Couldn't empty archive", getErrorMessage(err));
    }
  }

  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Newest first";

  const showComposer = scope.kind === "topic";
  const emptyIcon =
    scope.kind === "archive" ? (
      <ArchiveIcon size={20} />
    ) : scope.kind === "pinned" ? (
      <PinIcon size={20} />
    ) : (
      <NoteIcon size={20} />
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Title row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {loading
              ? "Loading…"
              : subtitle ??
                `${visible.length} ${visible.length === 1 ? "note" : "notes"}`}
          </p>
        </div>

        {isArchive && notes.length > 0 && (
          <Button variant="secondary" size="sm" onClick={emptyArchive}>
            <TrashIcon size={14} />
            Empty archive
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <SearchIcon
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            ref={searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes"
            aria-label="Search notes"
            className="field !py-2 !pl-9 !pr-16 !text-[0.8125rem]"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-faint hover:bg-[var(--surface-hover)] hover:text-ink"
            >
              <XIcon size={13} />
            </button>
          ) : (
            <kbd className="kbd pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
              /
            </kbd>
          )}
        </div>

        <Menu
          label="Sort notes"
          items={SORT_OPTIONS.map((option) => ({
            label: option.label,
            trailing:
              sort === option.value ? <CheckIcon size={13} /> : undefined,
            onSelect: () => {
              setSort(option.value);
              persist(STORAGE_KEYS.sort, option.value);
            },
          }))}
          trigger={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              className="flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[0.8125rem] text-muted transition-colors hover:border-[var(--border-strong)] hover:text-ink"
            >
              <SortIcon size={14} />
              <span className="hidden sm:inline">{sortLabel}</span>
            </button>
          )}
        />

        <div className="flex h-9 items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
          {(["grid", "list"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setView(mode);
                persist(STORAGE_KEYS.view, mode);
              }}
              aria-label={`${mode} view`}
              aria-pressed={view === mode}
              className={`grid h-8 w-8 place-items-center rounded-md transition-colors ${
                view === mode
                  ? "bg-[var(--surface-hover)] text-ink"
                  : "text-faint hover:text-muted"
              }`}
            >
              {mode === "grid" ? <GridIcon size={14} /> : <ListIcon size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      {showComposer && (
        <div className="surface-card mt-5 p-3">
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
            rows={2}
            maxLength={NOTE_MAX_LENGTH}
            placeholder="Write a note…"
            aria-label="New note"
            className="field !resize-none !border-transparent !bg-transparent !px-1 !py-1"
          />
          <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-2.5">
            <span className="text-[0.6875rem] text-faint">
              {draft.length > NOTE_MAX_LENGTH * 0.8 ? (
                <span className="text-[var(--warning)]">
                  {draft.length.toLocaleString()} /{" "}
                  {NOTE_MAX_LENGTH.toLocaleString()}
                </span>
              ) : (
                <>
                  <kbd className="kbd">Ctrl</kbd>{" "}
                  <kbd className="kbd">↵</kbd> to save
                </>
              )}
            </span>
            <Button
              size="sm"
              onClick={addNote}
              loading={creating}
              disabled={!draft.trim()}
            >
              <PlusIcon size={14} />
              Add note
            </Button>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="mt-6">
        {loading ? (
          <div
            className={
              view === "grid"
                ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-3"
            }
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="surface-card p-4">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton mt-3 h-3.5 w-full" />
                <div className="skeleton mt-2 h-3.5 w-4/5" />
                <div className="skeleton mt-2 h-3.5 w-2/3" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={debounced ? <SearchIcon size={20} /> : emptyIcon}
            title={
              debounced
                ? "No matching notes"
                : scope.kind === "archive"
                  ? "Archive is empty"
                  : scope.kind === "pinned"
                    ? "Nothing pinned yet"
                    : scope.kind === "topic"
                      ? "No notes in this topic"
                      : "No notes yet"
            }
            description={
              debounced
                ? `Nothing here mentions “${debounced}”.`
                : scope.kind === "archive"
                  ? "Notes you archive land here. They stay until you delete them."
                  : scope.kind === "pinned"
                    ? "Pin a note from its menu to keep it at the top of every list."
                    : scope.kind === "topic"
                      ? "Everything you write here stays filed under this topic."
                      : "Pick a topic in the sidebar and write your first note."
            }
            action={
              debounced ? (
                <Button variant="secondary" size="sm" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              ) : showComposer ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => composer.current?.focus()}
                >
                  <PlusIcon size={14} />
                  Write a note
                </Button>
              ) : undefined
            }
          />
        ) : (
          <motion.div
            layout
            transition={{ duration: 0.22, ease: EASE }}
            className={
              view === "grid"
                ? "grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-3"
            }
          >
            <AnimatePresence mode="popLayout">
              {visible.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  topic={topicById.get(note.topic_id)}
                  moveTargets={topics}
                  listView={view === "list"}
                  showTopic={scope.kind !== "topic"}
                  archived={isArchive}
                  busy={busyId === note.id}
                  isEditing={editingId === note.id}
                  editingText={editingText}
                  saving={savingId === note.id}
                  onEditStart={() => {
                    setEditingId(note.id);
                    setEditingText(note.text);
                  }}
                  onEditChange={setEditingText}
                  onEditCancel={() => {
                    setEditingId(null);
                    setEditingText("");
                  }}
                  onEditSave={() => saveEdit(note)}
                  onTogglePin={() =>
                    patch(
                      note,
                      { pinned: !note.pinned },
                      { pinned: !note.pinned },
                      {
                        ok: note.pinned ? "Unpinned" : "Pinned to top",
                        fail: "Couldn't update pin",
                      },
                      scope.kind === "pinned" && note.pinned
                    )
                  }
                  onArchive={() =>
                    patch(
                      note,
                      { archived: true },
                      { archived: true },
                      { ok: "Moved to archive", fail: "Couldn't archive note" },
                      true
                    ).then((ok) => {
                      if (ok) adjustCount(note.topic_id, -1);
                    })
                  }
                  onRestore={() =>
                    patch(
                      note,
                      { archived: false },
                      { archived: false },
                      { ok: "Restored", fail: "Couldn't restore note" },
                      true
                    ).then((ok) => {
                      if (ok) {
                        adjustCount(note.topic_id, 1);
                        refreshTopics();
                      }
                    })
                  }
                  onDelete={() => deleteNote(note)}
                  onCopy={async () => {
                    try {
                      await navigator.clipboard.writeText(note.text);
                      toast.success("Copied to clipboard");
                    } catch {
                      toast.error("Couldn't copy", "Your browser blocked clipboard access.");
                    }
                  }}
                  onMove={(target) =>
                    patch(
                      note,
                      { topicId: target },
                      { topic_id: target },
                      {
                        ok: `Moved to ${topicById.get(target)?.name ?? "topic"}`,
                        fail: "Couldn't move note",
                      },
                      scope.kind === "topic"
                    ).then((ok) => {
                      if (ok) {
                        adjustCount(note.topic_id, -1);
                        adjustCount(target, 1);
                      }
                    })
                  }
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Hint for the all-notes view, which has no composer */}
      {scope.kind === "all" && !loading && visible.length > 0 && (
        <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-faint">
          <LayersIcon size={13} />
          Open a topic from the sidebar to add notes to it.
        </p>
      )}
    </div>
  );
}
