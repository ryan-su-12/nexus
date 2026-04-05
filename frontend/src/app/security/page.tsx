"use client";

import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";

type Step = "idle" | "enrolling" | "enrolled";

export default function SecurityPage() {
  const [step, setStep] = useState<Step>("idle");
  const [hasMFA, setHasMFA] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkMFAStatus();
  }, []);

  async function checkMFAStatus() {
    setChecking(true);
    const { data } = await getSupabase().auth.mfa.listFactors();
    const verified = data?.totp?.filter((f) => f.status === "verified") ?? [];
    setHasMFA(verified.length > 0);
    if (verified.length > 0) setFactorId(verified[0].id);
    setChecking(false);
  }

  async function handleEnroll() {
    setLoading(true);
    setError(null);

    const { data, error } = await getSupabase().auth.mfa.enroll({ factorType: "totp" });
    if (error || !data) {
      setError(error?.message ?? "Failed to start enrollment");
      setLoading(false);
      return;
    }

    setFactorId(data.id);
    setQrSvg(data.totp.qr_code);
    setSecret(data.totp.secret);
    setStep("enrolling");
    setLoading(false);
  }

  async function handleVerifyEnrollment(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setLoading(true);
    setError(null);

    const { error } = await getSupabase().auth.mfa.challengeAndVerify({ factorId, code });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setStep("enrolled");
      setHasMFA(true);
      setSuccess("Two-factor authentication enabled.");
      setLoading(false);
    }
  }

  async function handleUnenroll() {
    if (!factorId) return;
    setLoading(true);
    setError(null);

    const { error } = await getSupabase().auth.mfa.unenroll({ factorId });
    if (error) {
      setError(error.message);
    } else {
      setHasMFA(false);
      setFactorId(null);
      setStep("idle");
      setSuccess("Two-factor authentication removed.");
    }
    setLoading(false);
  }

  if (checking) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security</h1>
        <p className="text-sm text-muted mt-1">Manage your account security settings.</p>
      </div>

      {error && (
        <div className="rounded-xl bg-negative-dim border border-negative/20 px-4 py-3">
          <p className="text-sm text-negative">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-accent-dim border border-accent/20 px-4 py-3">
          <p className="text-sm text-accent">{success}</p>
        </div>
      )}

      {/* 2FA Section */}
      <div className="rounded-2xl bg-surface border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Two-factor authentication</h2>
            <p className="text-xs text-muted mt-0.5">
              Use an authenticator app to generate one-time codes.
            </p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${hasMFA ? "bg-accent-dim text-accent" : "bg-surface-light text-muted"}`}>
            {hasMFA ? "Enabled" : "Disabled"}
          </span>
        </div>

        {/* Not enrolled */}
        {!hasMFA && step === "idle" && (
          <button
            onClick={handleEnroll}
            disabled={loading}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-black hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Starting..." : "Set up 2FA"}
          </button>
        )}

        {/* QR code step */}
        {step === "enrolling" && qrSvg && (
          <div className="space-y-5">
            <p className="text-sm text-muted">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code to confirm.
            </p>
            <div
              className="w-48 h-48 rounded-xl overflow-hidden bg-white p-2 mx-auto"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            {secret && (
              <div className="text-center">
                <p className="text-xs text-muted mb-1">Can&apos;t scan? Enter this key manually:</p>
                <p className="text-xs font-mono bg-surface-light border border-border rounded-lg px-3 py-2 tracking-widest break-all">
                  {secret}
                </p>
              </div>
            )}
            <form onSubmit={handleVerifyEnrollment} className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-muted tracking-widest text-center font-mono text-lg"
                placeholder="000000"
              />
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-black hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                {loading ? "Verifying..." : "Confirm & enable"}
              </button>
            </form>
          </div>
        )}

        {/* Already enrolled */}
        {hasMFA && step !== "enrolling" && (
          <button
            onClick={handleUnenroll}
            disabled={loading}
            className="rounded-xl border border-negative/30 px-5 py-2.5 text-sm font-semibold text-negative hover:bg-negative-dim disabled:opacity-50 transition-colors"
          >
            {loading ? "Removing..." : "Remove 2FA"}
          </button>
        )}
      </div>
    </div>
  );
}
