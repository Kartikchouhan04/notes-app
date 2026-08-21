"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AuthLayout, PasswordField } from "@/components/AuthLayout";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const MIN_PASSWORD_LENGTH = 6;

export default function SignupPage() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active && data.user) router.replace("/");
    });
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSignup() {
    if (!email.trim()) {
      toast.warning("Email required", "We need an address to create the account.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.warning(
        "Password too short",
        `Use at least ${MIN_PASSWORD_LENGTH} characters.`
      );
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Sign up failed", error.message);
      return;
    }

    // With email confirmation on, there is no session until the link is clicked.
    if (data.session) {
      toast.success("Account created", "Taking you to your vault…");
      router.push("/");
      return;
    }

    toast.success("Check your inbox", `We sent a confirmation link to ${email.trim()}.`);
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes about ten seconds."
      footer={
        <>
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="font-medium text-[var(--primary)] underline-offset-4 hover:underline"
          >
            Sign in
          </button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSignup();
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
            className="field"
          />
        </div>

        <PasswordField
          value={password}
          onChange={setPassword}
          visible={showPassword}
          onToggleVisible={() => setShowPassword((v) => !v)}
          autoComplete="new-password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        />

        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
