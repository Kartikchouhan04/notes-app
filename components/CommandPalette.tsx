"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useTopics } from "./TopicsProvider";
import {
  ArchiveIcon,
  FolderIcon,
  LayersIcon,
  MoonIcon,
  PinIcon,
  SearchIcon,
} from "./ui/Icons";
import { THEME_STORAGE_KEY } from "@/lib/theme";

const EASE = [0.2, 0, 0, 1] as const;

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Global shortcut: Cmd/Ctrl+K toggles.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {/* Mounted only while open, so query and selection reset for free. */}
      {open && <PaletteDialog onClose={() => onOpenChange(false)} />}
    </AnimatePresence>
  );
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { topics } = useTopics();

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => input.current?.focus(), 40);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previous;
    };
  }, []);

  function toggleTheme() {
    const next =
      document.documentElement.getAttribute("data-theme") === "light"
        ? "dark"
        : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage may be unavailable */
    }
  }

  const commands = useMemo<Command[]>(() => {
    const navigate = (href: string) => () => {
      router.push(href);
      onClose();
    };

    const base: Command[] = [
      {
        id: "all",
        label: "All notes",
        hint: "Go to",
        icon: <LayersIcon size={16} />,
        run: navigate("/"),
      },
      {
        id: "pinned",
        label: "Pinned notes",
        hint: "Go to",
        icon: <PinIcon size={16} />,
        run: navigate("/pinned"),
      },
      {
        id: "archive",
        label: "Archive",
        hint: "Go to",
        icon: <ArchiveIcon size={16} />,
        run: navigate("/archive"),
      },
      {
        id: "theme",
        label: "Toggle light / dark theme",
        hint: "Action",
        icon: <MoonIcon size={16} />,
        run: () => {
          toggleTheme();
          onClose();
        },
      },
    ];

    const topicCommands: Command[] = topics.map((topic) => ({
      id: `topic-${topic.id}`,
      label: topic.name,
      hint: "Topic",
      icon: <FolderIcon size={16} />,
      run: navigate(`/topics/${topic.id}`),
    }));

    return [...base, ...topicCommands];
  }, [topics, router, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  // Derived, so a shrinking result set can't leave the highlight out of range.
  const activeIndex =
    results.length === 0 ? 0 : Math.min(active, results.length - 1);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((activeIndex + step + results.length) % results.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      results[activeIndex]?.run();
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-start justify-center p-4 pt-[12vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.13 }}
    >
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.16, ease: EASE }}
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] shadow-[var(--shadow-pop)]"
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
          <SearchIcon size={16} className="shrink-0 text-faint" />
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a topic or run a command…"
            aria-label="Search commands"
            className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
          <kbd className="kbd shrink-0">Esc</kbd>
        </div>

        <div className="max-h-[min(24rem,50vh)] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-faint">
              Nothing matches “{query}”
            </p>
          ) : (
            results.map((command, i) => (
              <button
                key={command.id}
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={command.run}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  activeIndex === i
                    ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "text-ink"
                }`}
              >
                <span className={activeIndex === i ? "" : "text-faint"}>
                  {command.icon}
                </span>
                <span className="flex-1 truncate">{command.label}</span>
                {command.hint && (
                  <span className="shrink-0 text-[0.6875rem] uppercase tracking-wide text-faint">
                    {command.hint}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Button that opens the palette, for people who don't know the shortcut. */
export function CommandTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-faint transition-colors hover:border-[var(--border-strong)] hover:text-muted sm:flex"
    >
      <SearchIcon size={13} />
      <span>Search</span>
      <kbd className="kbd ml-1.5">Ctrl K</kbd>
    </button>
  );
}
