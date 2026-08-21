"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeftIcon, CheckCircleIcon } from "@/components/ui/Icons";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    const address = email.trim();
    if (!address) {
      toast.warning("Email required", "Enter the address on your account.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);

    // A real error (network, rate limit) is worth surfacing. A non-existent
    // address is not — reporting it would let anyone test which emails have
    // accounts, so that case falls through to the same confirmation below.
    if (error) {
      toast.error("Couldn't send the link", error.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle="If that address has an account, a reset link is on its way."
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
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--success-soft)] text-[var(--success)]">
            <CheckCircleIcon size={17} />
          </span>
          <div className="min-w-0 text-sm">
            <p className="font-medium text-ink">Sent to {email.trim()}</p>
            <p className="mt-1 leading-relaxed text-muted">
              The link expires in one hour. If it doesn&apos;t arrive, check
              your spam folder before requesting another.
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          className="mt-4 w-full"
          onClick={() => setSent(false)}
        >
          Use a different email
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            className="field"
          />
        </div>

        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}
