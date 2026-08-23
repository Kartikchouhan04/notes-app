"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import type { Profile } from "@/lib/types";
import { ThemeToggle } from "./ThemeToggle";
import { CommandTrigger } from "./CommandPalette";
import { Menu } from "./ui/Menu";
import { LogOutIcon, MenuIcon, UserIcon } from "./ui/Icons";
import { useConfirm } from "./ui/ConfirmDialog";
import { useToast } from "./ui/Toast";

export function AppHeader({
  email,
  onOpenNav,
  onOpenPalette,
}: {
  email?: string | null;
  onOpenNav: () => void;
  onOpenPalette: () => void;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
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

  const label = profile?.full_name || profile?.email || email || "Account";

  async function handleLogout() {
    const ok = await confirm({
      title: "Log out of Thought Vault?",
      description: "Your notes stay safe — you'll just need to sign in again.",
      confirmLabel: "Log out",
      tone: "primary",
    });
    if (!ok) return;

    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Couldn't log out", error.message);
      return;
    }
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-[var(--surface-hover)] hover:text-ink lg:hidden"
        >
          <MenuIcon size={18} />
        </button>

        <span className="text-sm font-semibold text-ink lg:hidden">
          Thought Vault
        </span>

        <div className="ml-auto flex items-center gap-2">
          <CommandTrigger onOpen={onOpenPalette} />
          <ThemeToggle />

          <Menu
            label="Account menu"
            items={[
              {
                label: "Log out",
                icon: <LogOutIcon size={14} />,
                tone: "danger",
                onSelect: handleLogout,
              },
            ]}
            trigger={({ toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-label={`Account: ${label}`}
                title={profile?.email ?? email ?? undefined}
                className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-muted transition-colors hover:border-[var(--border-strong)] hover:text-ink"
              >
                <UserIcon size={16} />
              </button>
            )}
          />
        </div>
      </div>
    </header>
  );
}
