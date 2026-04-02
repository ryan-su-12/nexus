"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/lib/UserContext";
import { getMarketData, getDailySummary, MarketData } from "@/lib/api";
import MarketCards from "@/components/MarketCards";
import SummaryPanel from "@/components/SummaryPanel";

export default function OverviewPage() {
  const { userId, setUserId } = useUser();
  const [idInput, setIdInput] = useState("");
  const [market, setMarket] = useState<MarketData | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    getMarketData(userId)
      .then(setMarket)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleGenerateSummary = useCallback(async () => {
    if (!userId) return;
    setSummaryLoading(true);
    try {
      const res = await getDailySummary(userId);
      setSummary(res.summary);
    } catch (err) {
      setSummary(`Error: ${err instanceof Error ? err.message : "Failed to generate summary"}`);
    } finally {
      setSummaryLoading(false);
    }
  }, [userId]);

  if (!userId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nexus</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Know why your portfolio moved.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (idInput.trim()) setUserId(idInput.trim());
            }}
            className="space-y-3"
          >
            <input
              type="text"
              value={idInput}
              onChange={(e) => setIdInput(e.target.value)}
              placeholder="Enter your User ID"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center space-y-3 py-12">
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={() => setUserId(null)}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
        >
          Try a different user ID
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {market && <MarketCards performances={market.performances} />}
      <SummaryPanel
        summary={summary}
        loading={summaryLoading}
        onGenerate={handleGenerateSummary}
      />
    </div>
  );
}
