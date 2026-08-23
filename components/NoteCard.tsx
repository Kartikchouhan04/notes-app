"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Note, Topic } from "@/lib/types";
import { NOTE_MAX_LENGTH } from "@/lib/constants";
import { Button } from "./ui/Button";
import { Menu, type MenuItem } from "./ui/Menu";
import {
  ArchiveIcon,
  ClockIcon,
  CopyIcon,
  MoreIcon,
  MoveIcon,
  PencilIcon,
  PinIcon,
  RestoreIcon,
  TrashIcon,
} from "./ui/Icons";

/** Same curve as the CSS tokens, so JS and CSS motion agree. */
const EASE = [0.2, 0, 0, 1] as const;

function formatStamp(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

export interface NoteCardProps {
  note: Note;
  topic?: Topic;
  /** Topics offered in the "Move to" submenu; omit to hide the action. */
  moveTargets?: Topic[];
  listView?: boolean;
  showTopic?: boolean;
  archived?: boolean;
  busy?: boolean;
  isEditing: boolean;
  editingText: string;
  saving: boolean;
  onEditStart: () => void;
  onEditChange: (value: string) => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  onTogglePin: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onMove: (topicId: string) => void;
}

export function NoteCard({
  note,
  topic,
  moveTargets = [],
  listView = false,
  showTopic = false,
  archived = false,
  busy = false,
  isEditing,
  editingText,
  saving,
  onEditStart,
  onEditChange,
  onEditCancel,
  onEditSave,
  onTogglePin,
  onArchive,
  onRestore,
  onDelete,
  onCopy,
  onMove,
}: NoteCardProps) {
  const [hovered, setHovered] = useState(false);

  const created = formatStamp(note.created_at);
  const edited =
    note.updated_at && note.updated_at !== note.created_at
      ? formatStamp(note.updated_at)
      : null;

  const actions: MenuItem[] = archived
    ? [
        {
          label: "Restore",
          icon: <RestoreIcon size={14} />,
          onSelect: onRestore,
        },
        {
          label: "Delete forever",
          icon: <TrashIcon size={14} />,
          tone: "danger",
          onSelect: onDelete,
        },
      ]
    : [
        {
          label: note.pinned ? "Unpin" : "Pin to top",
          icon: <PinIcon size={14} filled={note.pinned} />,
          onSelect: onTogglePin,
        },
        { label: "Edit", icon: <PencilIcon size={14} />, onSelect: onEditStart },
        { label: "Copy text", icon: <CopyIcon size={14} />, onSelect: onCopy },
        ...moveTargets
          .filter((t) => t.id !== note.topic_id)
          .slice(0, 6)
          .map((t) => ({
            label: `Move to ${t.name}`,
            icon: <MoveIcon size={14} />,
            onSelect: () => onMove(t.id),
          })),
        {
          label: "Archive",
          icon: <ArchiveIcon size={14} />,
          onSelect: onArchive,
        },
        {
          label: "Delete",
          icon: <TrashIcon size={14} />,
          tone: "danger",
          onSelect: onDelete,
        },
      ];

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.14 } }}
      transition={{ duration: 0.22, ease: EASE }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`surface-card group relative flex flex-col transition-[border-color,box-shadow] duration-150 ${
        listView ? "p-4" : "p-4"
      } ${
        isEditing
          ? "border-[var(--primary)] shadow-[var(--shadow-lift)]"
          : "hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lift)]"
      } ${busy ? "pointer-events-none opacity-55" : ""}`}
    >
      {/* Meta row */}
      <div className="mb-2 flex items-center gap-2">
        {note.pinned && !archived && (
          <span className="text-[var(--primary)]" title="Pinned">
            <PinIcon size={13} filled />
          </span>
        )}
        {showTopic && topic && (
          <span className="truncate rounded border border-[var(--border)] bg-[var(--surface-sunken)] px-1.5 py-0.5 text-[0.6875rem] text-muted">
            {topic.name}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1 text-[0.6875rem] text-faint">
          {edited ? (
            <>
              <ClockIcon size={11} />
              Edited {edited}
            </>
          ) : (
            created
          )}
        </span>

        {!isEditing && (
          <div
            className={`transition-opacity duration-150 ${
              hovered ? "opacity-100" : "opacity-0 focus-within:opacity-100"
            }`}
          >
            <Menu
              label="Note actions"
              items={actions}
              trigger={({ toggle }) => (
                <button
                  type="button"
                  onClick={toggle}
                  aria-label="Note actions"
                  className="grid h-6 w-6 place-items-center rounded text-faint transition-colors hover:bg-[var(--surface-hover)] hover:text-ink"
                >
                  <MoreIcon size={14} />
                </button>
              )}
            />
          </div>
        )}
      </div>

      {isEditing ? (
        <>
          <textarea
            value={editingText}
            onChange={(e) => onEditChange(e.target.value)}
            autoFocus
            disabled={saving}
            rows={listView ? 3 : 5}
            maxLength={NOTE_MAX_LENGTH}
            onKeyDown={(e) => {
              if (e.key === "Escape") onEditCancel();
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onEditSave();
            }}
            aria-label="Edit note"
            className="field !resize-y text-sm leading-relaxed"
          />
          <div className="mt-2.5 flex items-center gap-2">
            <Button size="sm" onClick={onEditSave} loading={saving}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={onEditCancel} disabled={saving}>
              Cancel
            </Button>
            <span className="ml-auto hidden text-[0.6875rem] text-faint sm:block">
              <kbd className="kbd">Ctrl</kbd> <kbd className="kbd">↵</kbd> to save
            </span>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={archived ? undefined : onEditStart}
          disabled={archived}
          className={`flex flex-1 flex-col items-start text-left ${
            archived ? "cursor-default" : "cursor-text"
          }`}
        >
          <p
            className={`w-full whitespace-pre-wrap break-words text-sm leading-relaxed text-ink ${
              listView ? "line-clamp-3" : "line-clamp-[10]"
            }`}
          >
            {note.text}
          </p>
        </button>
      )}
    </motion.article>
  );
}
