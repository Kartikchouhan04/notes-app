"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertIcon,
  CheckCircleIcon,
  InfoIcon,
  XCircleIcon,
  XIcon,
} from "./Icons";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** ms before auto-dismiss; 0 keeps it until dismissed manually. */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastRecord extends Required<Omit<ToastOptions, "action">> {
  id: string;
  action?: ToastOptions["action"];
}

interface ToastApi {
  show: (options: ToastOptions) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const MAX_VISIBLE = 4;

const styles: Record<
  ToastVariant,
  { icon: typeof InfoIcon; color: string; soft: string }
> = {
  success: {
    icon: CheckCircleIcon,
    color: "var(--success)",
    soft: "var(--success-soft)",
  },
  error: { icon: XCircleIcon, color: "var(--danger)", soft: "var(--danger-soft)" },
  warning: { icon: AlertIcon, color: "var(--warning)", soft: "var(--warning-soft)" },
  info: { icon: InfoIcon, color: "var(--primary)", soft: "var(--primary-soft)" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const toast: ToastRecord = {
        id,
        title: options.title,
        description: options.description ?? "",
        variant: options.variant ?? "info",
        duration: options.duration ?? 4000,
        action: options.action,
      };

      setToasts((prev) => {
        const next = [...prev, toast];
        // Drop the oldest once the stack overflows so it stays readable.
        return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
      });

      if (toast.duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), toast.duration)
        );
      }
      return id;
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      dismiss,
      success: (title, description) =>
        show({ title, description, variant: "success" }),
      error: (title, description) =>
        show({ title, description, variant: "error", duration: 6000 }),
      warning: (title, description) =>
        show({ title, description, variant: "warning" }),
      info: (title, description) => show({ title, description, variant: "info" }),
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end sm:p-6"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
}) {
  const { icon: Icon, color, soft } = styles[toast.variant];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      role={toast.variant === "error" ? "alert" : "status"}
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
      className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] shadow-[var(--shadow-pop)] backdrop-blur"
    >
      <div className="flex items-start gap-3 p-3.5">
        <span
          className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg"
          style={{ background: soft, color }}
        >
          <Icon size={16} />
        </span>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium leading-snug text-ink">
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-0.5 text-[0.8125rem] leading-snug text-muted break-words">
              {toast.description}
            </p>
          )}
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                onDismiss(toast.id);
              }}
              className="mt-2 text-[0.8125rem] font-medium underline underline-offset-4 hover:opacity-80"
              style={{ color }}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
          className="-mr-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-faint transition-colors hover:bg-[var(--surface-hover)] hover:text-ink"
        >
          <XIcon size={14} />
        </button>
      </div>

      {toast.duration > 0 && (
        <motion.div
          className="h-0.5 origin-left"
          style={{ background: color, opacity: 0.5 }}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: toast.duration / 1000, ease: "linear" }}
        />
      )}
    </motion.div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
