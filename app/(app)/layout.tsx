"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TopicsProvider } from "@/components/TopicsProvider";
import { Sidebar, MobileSidebar } from "@/components/Sidebar";
import { AppHeader } from "@/components/AppHeader";
import { CommandPalette } from "@/components/CommandPalette";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // One auth gate for every app page, instead of one per page.
  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setEmail(data.user.email ?? null);
      setChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/login");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (!checked) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="w-full max-w-sm space-y-3 px-6">
          <div className="skeleton h-9 w-40" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-4/5" />
        </div>
      </div>
    );
  }

  return (
    <TopicsProvider>
      <div className="flex min-h-screen">
        {/* Persistent sidebar on large screens */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-[var(--border)] bg-[var(--bg-elev)] lg:block">
          <div className="flex h-14 items-center px-4">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-2.5 text-left"
            >
              <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--primary)] text-[var(--primary-fg)]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 4.5h9L18.5 8v11.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path d="M9 12h6M9 15.5h3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <span className="text-sm font-semibold tracking-tight text-ink">
                Thought Vault
              </span>
            </button>
          </div>
          <div className="h-[calc(100vh-3.5rem)]">
            <Sidebar />
          </div>
        </aside>

        <MobileSidebar open={mobileNav} onClose={() => setMobileNav(false)} />

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader
            email={email}
            onOpenNav={() => setMobileNav(true)}
            onOpenPalette={() => setPaletteOpen(true)}
          />
          <main className="flex-1">{children}</main>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </TopicsProvider>
  );
}
