"use client";

import { useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { TOPIC_MAX_LENGTH } from "@/lib/constants";
import { useTopics } from "./TopicsProvider";
import { useConfirm } from "./ui/ConfirmDialog";
import { Menu } from "./ui/Menu";
import {
  ArchiveIcon,
  ChevronDownIcon,
  FolderIcon,
  LayersIcon,
  MoreIcon,
  PencilIcon,
  PinIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "./ui/Icons";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const confirm = useConfirm();
  const { topics, loading, create, rename, remove } = useTopics();

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [topicsOpen, setTopicsOpen] = useState(true);
  const addInput = useRef<HTMLInputElement>(null);

  const totalNotes = useMemo(
    () => topics.reduce((sum, t) => sum + (t.note_count ?? 0), 0),
    [topics]
  );

  function go(href: string) {
    router.push(href);
    onNavigate?.();
  }

  async function submitNew() {
    const name = draft.trim();
    if (!name) {
      setAdding(false);
      return;
    }
    const created = await create(name);
    setDraft("");
    setAdding(false);
    if (created) go(`/topics/${created.id}`);
  }

  async function submitRename(id: string) {
    const name = editingName.trim();
    if (name) await rename(id, name);
    setEditingId(null);
    setEditingName("");
  }

  async function confirmRemove(id: string, name: string) {
    const ok = await confirm({
      title: `Delete “${name}”?`,
      description:
        "This removes the topic and every note filed under it. This can't be undone.",
      confirmLabel: "Delete topic",
    });
    if (!ok) return;
    const removed = await remove(id);
    if (removed && pathname === `/topics/${id}`) go("/");
  }

  return (
    <nav
      aria-label="Workspace"
      className="flex h-full flex-col gap-1 overflow-y-auto px-3 py-4"
    >
      {/* Primary views */}
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => go("/")}
          data-active={pathname === "/"}
          className="nav-row"
        >
          <LayersIcon size={16} />
          <span className="flex-1">All notes</span>
          {totalNotes > 0 && (
            <span className="text-xs tabular-nums text-faint">{totalNotes}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => go("/pinned")}
          data-active={pathname === "/pinned"}
          className="nav-row"
        >
          <PinIcon size={16} />
          <span className="flex-1">Pinned</span>
        </button>

        <button
          type="button"
          onClick={() => go("/archive")}
          data-active={pathname === "/archive"}
          className="nav-row"
        >
          <ArchiveIcon size={16} />
          <span className="flex-1">Archive</span>
        </button>
      </div>

      <hr className="my-3 border-t border-[var(--border)]" />

      {/* Topics */}
      <div className="flex items-center gap-1 px-1.5 pb-1">
        <button
          type="button"
          onClick={() => setTopicsOpen((v) => !v)}
          className="flex flex-1 items-center gap-1 rounded text-[0.6875rem] font-semibold uppercase tracking-wider text-faint transition-colors hover:text-muted"
          aria-expanded={topicsOpen}
        >
          <motion.span
            animate={{ rotate: topicsOpen ? 0 : -90 }}
            transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
            className="inline-flex"
          >
            <ChevronDownIcon size={12} />
          </motion.span>
          Topics
        </button>
        <button
          type="button"
          onClick={() => {
            setTopicsOpen(true);
            setAdding(true);
            setTimeout(() => addInput.current?.focus(), 30);
          }}
          aria-label="New topic"
          title="New topic"
          className="grid h-6 w-6 place-items-center rounded text-faint transition-colors hover:bg-[var(--surface-hover)] hover:text-ink"
        >
          <PlusIcon size={14} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {topicsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5">
              {adding && (
                <div className="px-1 py-1">
                  <input
                    ref={addInput}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={submitNew}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitNew();
                      if (e.key === "Escape") {
                        setDraft("");
                        setAdding(false);
                      }
                    }}
                    maxLength={TOPIC_MAX_LENGTH}
                    placeholder="Topic name…"
                    aria-label="New topic name"
                    className="field !py-1.5 !text-[0.8125rem]"
                  />
                </div>
              )}

              {loading && topics.length === 0
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="px-1.5 py-1.5">
                      <div
                        className="skeleton h-4"
                        style={{ width: `${70 - i * 12}%` }}
                      />
                    </div>
                  ))
                : topics.map((topic) => {
                    const active = pathname === `/topics/${topic.id}`;
                    const isEditing = editingId === topic.id;

                    return (
                      <div key={topic.id} className="group/row relative">
                        {isEditing ? (
                          <div className="px-1 py-1">
                            <input
                              value={editingName}
                              autoFocus
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={() => submitRename(topic.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") submitRename(topic.id);
                                if (e.key === "Escape") {
                                  setEditingId(null);
                                  setEditingName("");
                                }
                              }}
                              maxLength={TOPIC_MAX_LENGTH}
                              aria-label="Topic name"
                              className="field !py-1.5 !text-[0.8125rem]"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => go(`/topics/${topic.id}`)}
                            data-active={active}
                            className="nav-row pr-8"
                          >
                            <FolderIcon size={16} className="shrink-0" />
                            <span className="flex-1 truncate">{topic.name}</span>
                            {typeof topic.note_count === "number" && (
                              <span className="text-xs tabular-nums text-faint opacity-100 transition-opacity group-hover/row:opacity-0">
                                {topic.note_count}
                              </span>
                            )}
                          </button>
                        )}

                        {!isEditing && (
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 transition-opacity focus-within:opacity-100 group-hover/row:opacity-100">
                            <Menu
                              label={`Actions for ${topic.name}`}
                              items={[
                                {
                                  label: "Rename",
                                  icon: <PencilIcon size={14} />,
                                  onSelect: () => {
                                    setEditingId(topic.id);
                                    setEditingName(topic.name);
                                  },
                                },
                                {
                                  label: "Delete",
                                  icon: <TrashIcon size={14} />,
                                  tone: "danger",
                                  onSelect: () =>
                                    confirmRemove(topic.id, topic.name),
                                },
                              ]}
                              trigger={({ toggle }) => (
                                <button
                                  type="button"
                                  onClick={toggle}
                                  aria-label={`Actions for ${topic.name}`}
                                  className="grid h-6 w-6 place-items-center rounded text-faint transition-colors hover:bg-[var(--surface-hover)] hover:text-ink"
                                >
                                  <MoreIcon size={14} />
                                </button>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

              {!loading && topics.length === 0 && !adding && (
                <button
                  type="button"
                  onClick={() => {
                    setAdding(true);
                    setTimeout(() => addInput.current?.focus(), 30);
                  }}
                  className="nav-row text-faint"
                >
                  <PlusIcon size={15} />
                  Create your first topic
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/** Slide-over sidebar for small screens. */
export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="absolute inset-y-0 left-0 w-[17rem] border-r border-[var(--border)] bg-[var(--bg-elev)]"
          >
            <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
              <span className="text-sm font-semibold text-ink">Thought Vault</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--surface-hover)] hover:text-ink"
              >
                <XIcon size={16} />
              </button>
            </div>
            <div className="h-[calc(100%-3.5rem)]">
              <Sidebar onNavigate={onClose} />
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
