"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "icon";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-xl font-medium " +
  "transition-[background-color,border-color,color,transform,box-shadow] duration-150 " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--primary-strong)] text-[var(--primary-fg)] shadow-[var(--shadow-card)] " +
    "hover:brightness-110 hover:shadow-[var(--shadow-lift)]",
  secondary:
    "bg-[var(--surface)] text-ink border border-[var(--border)] " +
    "hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]",
  ghost: "text-muted hover:bg-[var(--surface-hover)] hover:text-ink",
  danger:
    "bg-[var(--danger-soft)] text-[var(--danger)] border border-transparent " +
    "hover:border-[var(--danger)]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[0.8125rem]",
  md: "h-11 px-5 text-sm",
  icon: "h-9 w-9 shrink-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading && <Spinner />}
        <span
          className={
            loading ? "opacity-0" : "inline-flex items-center gap-2"
          }
        >
          {children}
        </span>
      </button>
    );
  }
);

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="absolute inset-0 grid place-items-center"
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{ animation: "spin 0.7s linear infinite" }}
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2.5"
          opacity="0.25"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Small square icon button used for row/card actions. */
export function IconButton({
  label,
  tone = "neutral",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: "neutral" | "danger" | "warning" | "primary";
}) {
  const tones = {
    neutral: "text-muted hover:text-ink hover:bg-[var(--surface-hover)]",
    primary: "text-muted hover:text-[var(--primary)] hover:bg-[var(--primary-soft)]",
    warning: "text-muted hover:text-[var(--warning)] hover:bg-[var(--warning-soft)]",
    danger: "text-muted hover:text-[var(--danger)] hover:bg-[var(--danger-soft)]",
  } as const;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-transparent transition-colors duration-150 active:scale-90 disabled:opacity-50 ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
