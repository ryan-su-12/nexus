"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function VerifyMFAPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: factors, error: factorsError } = await getSupabase().auth.mfa.listFactors();
    if (factorsError || !factors?.totp?.length) {
      setError("No MFA factor found.");
      setLoading(false);
      return;
    }

    const factorId = factors.totp[0].id;
    const { error: verifyError } = await getSupabase().auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (verifyError) {
      setError(verifyError.message);
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
          <p className="mt-2 text-sm text-muted">Enter your authenticator code</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">6-digit code</label>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-muted tracking-widest text-center font-mono text-lg"
              placeholder="000000"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-negative-dim border border-negative/20 px-4 py-3">
              <p className="text-sm text-negative">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-black hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
