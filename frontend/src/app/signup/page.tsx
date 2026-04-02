"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await getSupabase().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: undefined },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If email confirmation is disabled, the user is auto-confirmed
    // and we get a session back — go straight to dashboard
    if (data.session) {
      router.push("/");
      return;
    }

    // If no session, user needs to confirm email — sign in manually
    const { error: signInError } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Account created but could not sign in: " + signInError.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-accent">Nexus</h1>
          <p className="mt-2 text-sm text-muted">
            Create your account
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
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

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-muted"
              placeholder="Minimum 6 characters"
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
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-accent hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
