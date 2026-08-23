"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  tone?: "default" | "danger";
  /** Shown right-aligned, e.g. a checkmark or shortcut. */
  trailing?: ReactNode;
  disabled?: boolean;
}

/**
 * Small dropdown used for note actions and sort/view pickers.
 * Closes on outside click, Escape, or selection; supports arrow-key roving.
 */
export function Menu({
  trigger,
  items,
  align = "end",
  label,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!container.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setActive((prev) => {
          const step = e.key === "ArrowDown" ? 1 : -1;
          const next = (prev + step + items.length) % items.length;
          return next;
        });
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = items[active];
        if (item && !item.disabled) {
          item.onSelect();
          setOpen(false);
        }
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, items, active]);

  return (
    <div ref={container} className="relative">
      {trigger({
        open,
        toggle: () => {
          setActive(0);
          setOpen((v) => !v);
        },
      })}

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            id={menuId}
            aria-label={label}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.13, ease: [0.2, 0, 0, 1] }}
            className={`absolute z-50 mt-1.5 min-w-[11rem] origin-top overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-1 shadow-[var(--shadow-pop)] ${
              align === "end" ? "right-0" : "left-0"
            }`}
          >
            {items.map((item, i) => (
              <button
                key={item.label}
                role="menuitem"
                type="button"
                disabled={item.disabled}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  item.onSelect();
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[0.8125rem] transition-colors disabled:opacity-40 ${
                  item.tone === "danger"
                    ? "text-[var(--danger)]"
                    : "text-ink"
                } ${
                  active === i && !item.disabled
                    ? item.tone === "danger"
                      ? "bg-[var(--danger-soft)]"
                      : "bg-[var(--surface-hover)]"
                    : ""
                }`}
              >
                {item.icon && (
                  <span className="shrink-0 text-faint">{item.icon}</span>
                )}
                <span className="flex-1 truncate">{item.label}</span>
                {item.trailing && (
                  <span className="shrink-0 text-faint">{item.trailing}</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
