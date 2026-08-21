"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertIcon } from "./Icons";
import { Button } from "./Button";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    setPending(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setPending(null);
  }, []);

  // Escape to cancel, and move focus into the dialog when it opens.
  useEffect(() => {
    if (!pending) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        settle(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);

    const focusTimer = setTimeout(() => confirmButton.current?.focus(), 40);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [pending, settle]);

  const tone = pending?.tone ?? "danger";
  const accent = tone === "danger" ? "var(--danger)" : "var(--primary)";
  const accentSoft =
    tone === "danger" ? "var(--danger-soft)" : "var(--primary-soft)";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {pending && (
          <motion.div
            className="fixed inset-0 z-[110] grid place-items-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
              onClick={() => settle(false)}
            />

            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-6 shadow-[var(--shadow-pop)]"
            >
              <div className="flex gap-4">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                  style={{ background: accentSoft, color: accent }}
                >
                  <AlertIcon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2
                    id="confirm-title"
                    className="text-base font-semibold text-ink"
                  >
                    {pending.title}
                  </h2>
                  {pending.description && (
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      {pending.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => settle(false)}
                >
                  {pending.cancelLabel ?? "Cancel"}
                </Button>
                <Button
                  ref={confirmButton}
                  size="sm"
                  onClick={() => settle(true)}
                  className={
                    tone === "danger"
                      ? "!bg-[var(--danger-strong)] !text-[var(--danger-fg)]"
                      : undefined
                  }
                >
                  {pending.confirmLabel ?? "Confirm"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}
