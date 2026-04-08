"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  getBrokerageConnectUrl,
  getBrokerageAccounts,
  syncBrokerageHoldings,
  BrokerageAccount,
} from "@/lib/api";

export default function ConnectPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BrokerageAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadAccounts();
  }, [user]);

  async function loadAccounts() {
    setLoading(true);
    setError(null);
    try {
      const res = await getBrokerageAccounts(user!.id);
      setAccounts(res.accounts);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    if (!user) return;
    setConnecting(true);
    setError(null);
    try {
      const res = await getBrokerageConnectUrl(user.id);
      const popup = window.open(
        res.connect_url,
        "_blank",
        "width=500,height=700"
      );
      const interval = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(interval);
          await loadAccounts();
          setConnecting(false);
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get connect URL");
      setConnecting(false);
    }
  }

  async function handleSync() {
    if (!user) return;
    setSyncing(true);
    setSyncResult(null);
    setError(null);
    try {
      const res = await syncBrokerageHoldings(user.id);
      setSyncResult(`Synced ${res.holdings_count} holdings to your portfolio.`);
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync holdings");
    } finally {
      setSyncing(false);
    }
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CONNECT BROKERAGE</h1>
        <p className="text-sm text-muted mt-1">
          Link your brokerage account to import your real holdings.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-negative-dim border border-negative/20 px-4 py-3">
          <p className="text-sm text-negative">{error}</p>
        </div>
      )}

      {syncResult && (
        <div className="rounded-xl bg-accent-dim border border-accent/20 px-4 py-3">
          <p className="text-sm text-accent">{syncResult}</p>
        </div>
      )}

      {/* Add another account */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">
          {accounts.length > 0 ? "Add Another Account" : "Get Started"}
        </h2>
        <p className="text-sm text-muted mt-1 mb-4">
          Connect your Wealthsimple, Questrade, or other brokerage account
          securely through SnapTrade.
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-black hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {connecting ? "Opening connection..." : "Connect Brokerage"}
          </button>
          {accounts.length > 0 && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="rounded-full border border-border px-5 py-2 text-xs font-semibold text-muted hover:text-foreground hover:border-accent/30 transition-colors"
            >
              {syncing ? "Syncing..." : "Sync Holdings"}
            </button>
          )}
          <span className="text-[11px] text-muted flex items-center gap-1.5">
            <span className="text-accent">✓</span>
            Read-Only Access · 256-bit Encryption
          </span>
        </div>
      </div>

      {/* Connected accounts — grouped by institution */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted mb-4">
          Connected Accounts
        </p>

        {accounts.length === 0 ? (
          <p className="text-xs text-muted py-6 text-center">
            No connected accounts yet.
          </p>
        ) : (
          <InstitutionGroup accounts={accounts} />
        )}
      </div>
    </div>
  );
}

function InstitutionGroup({ accounts }: { accounts: BrokerageAccount[] }) {
  const institution = accounts[0]?.institution_name || "Wealthsimple Trade";
  const initial = institution.charAt(0).toUpperCase();

  return (
    <div className="flex gap-5">
      {/* Single institution logo */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        <div className="h-14 w-14 rounded-full border-2 border-accent/40 bg-accent-dim flex items-center justify-center text-accent font-bold text-lg">
          {initial}
        </div>
        <p className="text-[10px] text-muted mt-2 text-center max-w-[80px] leading-tight">
          {institution}
        </p>
      </div>

      {/* Account list */}
      <div className="flex-1 min-w-0 divide-y divide-border">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {acc.name}
              </p>
              <p className="text-[11px] text-muted truncate">
                {acc.number ? `${acc.number}` : ""}
              </p>
              <p className="text-[10px] text-muted mt-0.5">
                Last synced: 2 minutes ago
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-accent/40 bg-accent-dim px-3 py-1 text-[10px] font-semibold text-accent">
              Connected
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

