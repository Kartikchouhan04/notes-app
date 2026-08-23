"use client";

import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";
import {
  EyeIcon,
  EyeOffIcon,
  NoteIcon,
  SparkIcon,
  StarIcon,
  VaultIcon,
} from "./ui/Icons";

const highlights = [
  {
    icon: <NoteIcon size={15} />,
    title: "Organized by topic",
    body: "Every note lives in a folder you named, not a pile you scroll.",
  },
  {
    icon: <StarIcon size={15} />,
    title: "Pin what matters",
    body: "The notes you keep returning to stay at the top of the page.",
  },
  {
    icon: <SparkIcon size={15} />,
    title: "Instant search",
    body: "Find any thought by typing a word you remember from it.",
  },
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-[var(--border)] bg-[var(--bg-elev)] p-12 lg:flex">
        {/* Hairline grid instead of a colour wash — quieter, and it reads as
            structure rather than decoration. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(60% 55% at 30% 35%, #000 20%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(60% 55% at 30% 35%, #000 20%, transparent 100%)",
          }}
        />

        <div className="relative flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
            <VaultIcon size={21} />
          </span>
          <span className="text-base font-semibold tracking-tight text-ink">
            Thought Vault
          </span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-[1.15] tracking-tight text-ink">
            A quiet place for
            <br />
            <span className="text-[var(--primary)]">everything you think.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Capture notes fast, file them under topics that make sense to you,
            and find them again the moment you need them.
          </p>

          <ul className="mt-10 space-y-5">
            {highlights.map((item) => (
              <li key={item.title} className="flex gap-3.5">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--primary)]">
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-faint">
          Built by Kartik Chouhan · Next.js + Supabase
        </p>
      </aside>

      {/* Form panel */}
      <main className="relative flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <VaultIcon size={21} />
            </span>
            <span className="text-base font-semibold tracking-tight text-ink">
              Thought Vault
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>

          <div className="mt-7">{children}</div>

          <div className="mt-6 text-center text-sm text-muted">{footer}</div>
        </div>
      </main>
    </div>
  );
}

export function PasswordField({
  value,
  onChange,
  visible,
  onToggleVisible,
  placeholder = "••••••••",
  autoComplete,
  id = "password",
  label = "Password",
  hint,
}: {
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  placeholder?: string;
  autoComplete?: string;
  id?: string;
  label?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="field !pr-11"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-faint transition-colors hover:bg-[var(--surface-hover)] hover:text-ink"
        >
          {visible ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-faint">{hint}</p>}
    </div>
  );
}
