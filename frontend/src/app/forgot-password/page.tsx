"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-accent">Nexus</h1>
          <p className="mt-2 text-sm text-muted">Reset your password</p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-accent-dim border border-accent/20 px-4 py-4 text-sm text-accent text-center">
              Check your email for a password reset link.
            </div>
            <p className="text-center text-sm text-muted">
              <Link href="/login" className="font-medium text-accent hover:underline">
                Back to sign in
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-muted"
                placeholder="you@email.com"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-negative-dim border border-negative/20 px-4 py-3">
                <p className="text-sm text-negative">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-black hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>

            <p className="text-center text-sm text-muted">
              <Link href="/login" className="font-medium text-accent hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
