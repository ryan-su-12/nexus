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
      // No accounts yet — that's fine
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
      // Open SnapTrade Connect in a new window
      const popup = window.open(res.connect_url, "_blank", "width=500,height=700");

      // Poll for when user finishes connecting
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Connect Brokerage</h1>
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

      {/* Connected accounts */}
      {accounts.length > 0 && (
        <div className="rounded-2xl bg-surface border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Connected Accounts</h2>
          <div className="space-y-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="rounded-xl bg-surface-light border border-border p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {acc.institution_name || acc.name}
                  </p>
                  <p className="text-xs text-muted">
                    {acc.name} {acc.number ? `· ${acc.number}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-accent-dim px-3 py-1 text-xs font-medium text-accent">
                  Connected
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-black hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {syncing ? "Syncing..." : "Sync Holdings"}
          </button>
        </div>
      )}

      {/* Connect new account */}
      <div className="rounded-2xl bg-surface border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">
          {accounts.length > 0 ? "Add Another Account" : "Get Started"}
        </h2>
        <p className="text-sm text-muted">
          Connect your Wealthsimple, Questrade, or other brokerage account
          securely through SnapTrade.
        </p>
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-black hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {connecting ? "Opening connection..." : "Connect Brokerage"}
        </button>
      </div>
    </div>
  );
}
