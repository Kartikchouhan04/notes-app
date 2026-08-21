"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MIN_PASSWORD_LENGTH } from "@/lib/constants";
import { AuthLayout, PasswordField } from "@/components/AuthLayout";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { AlertIcon, ArrowLeftIcon } from "@/components/ui/Icons";

type Status = "checking" | "ready" | "invalid";

/** How long to wait for supabase-js to turn the URL hash into a session. */
const SESSION_GRACE_MS = 4000;

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();

  const [status, setStatus] = useState<Status>("checking");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const settled = useRef(false);

  useEffect(() => {
    // Supabase redirects failures back with the reason in the URL hash.
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const hashError = hash.get("error_code") ?? hash.get("error");
    const hashErrorText = hash
      .get("error_description")
      ?.replace(/\+/g, " ");

    const settle = (next: Status, message?: string) => {
      if (settled.current) return;
      settled.current = true;
      if (message) setLinkError(message);
      setStatus(next);
    };

    // The client parses the hash on init and emits PASSWORD_RECOVERY, but that
    // can land before or after this effect runs — so watch both paths.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        settle("ready");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        settle("ready");
      } else if (hashError) {
        // No session and an explicit failure in the URL: don't wait it out.
        settle(
          "invalid",
          hashErrorText ?? "This reset link is no longer valid."
        );
      }
    });

    const timer = setTimeout(() => settle("invalid"), SESSION_GRACE_MS);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function handleSubmit() {
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.warning(
        "Password too short",
        `Use at least ${MIN_PASSWORD_LENGTH} characters.`
      );
      return;
    }
    if (password !== confirm) {
      toast.warning("Passwords don't match", "Both fields must be identical.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      toast.error("Couldn't update password", error.message);
      return;
    }

    // Clear the recovery token out of the address bar before moving on.
    window.history.replaceState(null, "", window.location.pathname);
    toast.success("Password updated", "You're signed in with your new password.");
    router.push("/");
  }

  if (status === "checking") {
    return (
      <AuthLayout
        title="Checking your link"
        subtitle="One moment…"
        footer={null}
      >
        <div className="space-y-3">
          <div className="skeleton h-11 w-full rounded-xl" />
          <div className="skeleton h-11 w-full rounded-xl" />
          <div className="skeleton h-11 w-full rounded-xl" />
        </div>
      </AuthLayout>
    );
  }

  if (status === "invalid") {
    return (
      <AuthLayout
        title="This link doesn't work"
        subtitle="Reset links are single-use and expire after an hour."
        footer={
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="inline-flex items-center gap-1.5 font-medium text-[var(--primary)] underline-offset-4 hover:underline"
          >
            <ArrowLeftIcon size={14} />
            Back to sign in
          </button>
        }
      >
        <div className="surface-card flex gap-3.5 p-4">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--danger-soft)] text-[var(--danger)]">
            <AlertIcon size={17} />
          </span>
          <p className="min-w-0 text-sm leading-relaxed text-muted">
            {linkError ??
              "Open the most recent email we sent, or request a fresh link below."}
          </p>
        </div>

        <Button
          className="mt-4 w-full"
          onClick={() => router.push("/forgot-password")}
        >
          Request a new link
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Pick something you haven't used here before."
      footer={null}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <PasswordField
          id="new-password"
          label="New password"
          value={password}
          onChange={setPassword}
          visible={showPassword}
          onToggleVisible={() => setShowPassword((v) => !v)}
          autoComplete="new-password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        />

        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          visible={showPassword}
          onToggleVisible={() => setShowPassword((v) => !v)}
          autoComplete="new-password"
        />

        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
