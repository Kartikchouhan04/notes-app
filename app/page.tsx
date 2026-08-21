"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { TOPIC_MAX_LENGTH } from "@/lib/constants";
import type { Topic } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState, SkeletonGrid } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import {
  FolderIcon,
  NoteIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
} from "@/components/ui/Icons";

export default function TopicsPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  const [topicName, setTopicName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const newTopicInput = useRef<HTMLInputElement>(null);

  // Auth gate + initial load.
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

      try {
        const result = await apiFetch<Topic[]>("/api/topics");
        if (active) setTopics(Array.isArray(result) ? result : []);
      } catch (err) {
        if (active) toast.error("Couldn't load topics", getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter((t) => t.name.toLowerCase().includes(q));
  }, [topics, search]);

  async function addTopic() {
    const name = topicName.trim();
    if (!name) {
      toast.warning("Give the topic a name", "An empty topic can't be saved.");
      newTopicInput.current?.focus();
      return;
    }

    setCreating(true);
    try {
      const created = await apiFetch<Topic>("/api/topics", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setTopics((prev) => [{ ...created, note_count: 0 }, ...prev]);
      setTopicName("");
      toast.success("Topic created", `“${created.name}” is ready for notes.`);
    } catch (err) {
      toast.error("Couldn't create topic", getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function renameTopic(id: string) {
    const name = editingName.trim();
    const original = topics.find((t) => t.id === id);

    if (!name) {
      toast.warning("Name can't be empty");
      return;
    }
    if (name === original?.name) {
      setEditingId(null);
      return;
    }

    setSavingId(id);
    try {
      await apiFetch(`/api/topics/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
      setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
      setEditingId(null);
      setEditingName("");
      toast.success("Topic renamed");
    } catch (err) {
      toast.error("Couldn't rename topic", getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  }

  async function deleteTopic(topic: Topic) {
    const ok = await confirm({
      title: `Delete “${topic.name}”?`,
      description:
        "This removes the topic and every note filed under it. This can't be undone.",
      confirmLabel: "Delete topic",
    });
    if (!ok) return;

    setDeletingId(topic.id);
    const snapshot = topics;
    setTopics((prev) => prev.filter((t) => t.id !== topic.id));

    try {
      await apiFetch(`/api/topics/${topic.id}`, { method: "DELETE" });
      toast.success("Topic deleted", `“${topic.name}” is gone.`);
    } catch (err) {
      setTopics(snapshot); // Roll the optimistic removal back.
      toast.error("Couldn't delete topic", getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader email={email} />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        {/* Page heading */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Topics
            </h1>
            <p className="mt-2 text-sm text-muted">
              {loading
                ? "Loading your workspace…"
                : topics.length === 0
                  ? "Create your first topic to start capturing notes."
                  : `${topics.length} ${topics.length === 1 ? "topic" : "topics"} in your vault.`}
            </p>
          </div>

          {topics.length > 0 && (
            <div className="relative w-full sm:w-72">
              <SearchIcon
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics"
                aria-label="Search topics"
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
        <div className="surface-card mt-7 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <input
            ref={newTopicInput}
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTopic();
            }}
            placeholder="Name a new topic — “Reading list”, “Q3 planning”…"
            aria-label="New topic name"
            maxLength={TOPIC_MAX_LENGTH}
            className="field !border-transparent !bg-transparent !px-1 !text-base sm:!px-2"
          />
          <Button
            onClick={addTopic}
            loading={creating}
            disabled={!topicName.trim()}
            className="shrink-0"
          >
            <PlusIcon size={16} />
            Add topic
          </Button>
        </div>

        {/* Grid */}
        <div className="mt-8">
          {loading ? (
            <SkeletonGrid count={6} />
          ) : topics.length === 0 ? (
            <EmptyState
              icon={<FolderIcon size={22} />}
              title="Your vault is empty"
              description="Topics are folders for your thinking. Add one above and notes will live inside it."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => newTopicInput.current?.focus()}
                >
                  <PlusIcon size={15} />
                  Create a topic
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<SearchIcon size={22} />}
              title="No matches"
              description={`Nothing here is called “${search}”. Try a different word.`}
              action={
                <Button variant="secondary" size="sm" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    isEditing={editingId === topic.id}
                    editingName={editingName}
                    saving={savingId === topic.id}
                    deleting={deletingId === topic.id}
                    onOpen={() => router.push(`/topics/${topic.id}`)}
                    onEditStart={() => {
                      setEditingId(topic.id);
                      setEditingName(topic.name);
                    }}
                    onEditChange={setEditingName}
                    onEditCancel={() => {
                      setEditingId(null);
                      setEditingName("");
                    }}
                    onEditSave={() => renameTopic(topic.id)}
                    onDelete={() => deleteTopic(topic)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function TopicCard({
  topic,
  isEditing,
  editingName,
  saving,
  deleting,
  onOpen,
  onEditStart,
  onEditChange,
  onEditCancel,
  onEditSave,
  onDelete,
}: {
  topic: Topic;
  isEditing: boolean;
  editingName: string;
  saving: boolean;
  deleting: boolean;
  onOpen: () => void;
  onEditStart: () => void;
  onEditChange: (value: string) => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  onDelete: () => void;
}) {
  const created = topic.created_at
    ? new Date(topic.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={`group surface-card relative flex flex-col p-5 transition-[box-shadow,border-color,transform] duration-200 ${
        isEditing
          ? "border-[var(--primary)] shadow-[var(--shadow-lift)]"
          : "hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lift)]"
      } ${deleting ? "pointer-events-none opacity-50" : ""}`}
    >
      {/* Accent rule */}
      <span
        className="h-1.5 w-8 rounded-full transition-all duration-300 group-hover:w-14"
        style={{
          background:
            "linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)",
        }}
      />

      {/* Hover actions */}
      {!isEditing && (
        <div className="absolute right-3 top-3 flex gap-0.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
          <IconButton label="Rename topic" tone="primary" onClick={onEditStart}>
            <PencilIcon size={15} />
          </IconButton>
          <IconButton
            label="Delete topic"
            tone="danger"
            onClick={onDelete}
            disabled={deleting}
          >
            <TrashIcon size={15} />
          </IconButton>
        </div>
      )}

      {isEditing ? (
        <div className="mt-4">
          <input
            value={editingName}
            onChange={(e) => onEditChange(e.target.value)}
            autoFocus
            disabled={saving}
            onKeyDown={(e) => {
              if (e.key === "Enter") onEditSave();
              if (e.key === "Escape") onEditCancel();
            }}
            aria-label="Topic name"
            maxLength={TOPIC_MAX_LENGTH}
            className="field !px-2.5 !py-2 text-base font-medium"
          />
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={onEditSave} loading={saving}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onEditCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <span className="ml-auto hidden text-[0.6875rem] text-faint sm:block">
              Enter to save · Esc to cancel
            </span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="mt-4 flex flex-1 flex-col items-start text-left"
        >
          <h2 className="line-clamp-2 pr-16 text-lg font-semibold leading-snug tracking-tight text-ink">
            {topic.name}
          </h2>
          <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-muted">
            {typeof topic.note_count === "number" && (
              <span className="inline-flex items-center gap-1.5">
                <NoteIcon size={13} />
                {topic.note_count} {topic.note_count === 1 ? "note" : "notes"}
              </span>
            )}
            {created && <span className="text-faint">{created}</span>}
          </div>
        </button>
      )}
    </motion.div>
  );
}
