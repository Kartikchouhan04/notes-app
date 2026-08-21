"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import type { Profile } from "@/lib/types";
import { ThemeToggle } from "./ThemeToggle";
import { IconButton } from "./ui/Button";
import { LogOutIcon, VaultIcon } from "./ui/Icons";
import { useConfirm } from "./ui/ConfirmDialog";
import { useToast } from "./ui/Toast";

export function AppHeader({ email }: { email?: string | null }) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [loggingOut, setLoggingOut] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Prefer the profiles row, but fall back to the auth email so the header
  // still renders if the profiles migration hasn't been applied yet.
  useEffect(() => {
    let active = true;
    apiFetch<Profile>("/api/profile")
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch(() => {
        /* falls back to the email prop */
      });
    return () => {
      active = false;
    };
  }, []);

  const label = profile?.full_name || profile?.email || email;

  async function handleLogout() {
    const ok = await confirm({
      title: "Log out of Thought Vault?",
      description: "Your notes stay safe — you'll just need to sign in again.",
      confirmLabel: "Log out",
      tone: "primary",
    });
    if (!ok) return;

    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    setLoggingOut(false);

    if (error) {
      toast.error("Couldn't log out", error.message);
      return;
    }
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="group flex items-center gap-2.5 rounded-lg text-left"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] transition-transform duration-200 group-hover:-rotate-6">
            <VaultIcon size={19} />
          </span>
          <span className="text-[0.9375rem] font-semibold tracking-tight brand-text">
            Thought Vault
          </span>
        </button>

        <div className="flex items-center gap-2">
          {label && (
            <span
              title={profile?.email ?? email ?? undefined}
              className="hidden max-w-[16rem] truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-muted sm:block"
            >
              {label}
            </span>
          )}
          <ThemeToggle />
          <IconButton
            label="Log out"
            tone="danger"
            onClick={handleLogout}
            disabled={loggingOut}
            className="h-9 w-9 border-[var(--border)] bg-[var(--surface)]"
          >
            <LogOutIcon size={16} />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
