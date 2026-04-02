"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getMarketData, getDailySummary, MarketData } from "@/lib/api";
import MarketCards from "@/components/MarketCards";
import SummaryPanel from "@/components/SummaryPanel";

export default function OverviewPage() {
  const { user } = useAuth();
  const [market, setMarket] = useState<MarketData | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    getMarketData(user.id)
      .then(setMarket)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const handleGenerateSummary = useCallback(async () => {
    if (!user) return;
    setSummaryLoading(true);
    try {
      const res = await getDailySummary(user.id);
      setSummary(res.summary);
    } catch (err) {
      setSummary(`Error: ${err instanceof Error ? err.message : "Failed to generate summary"}`);
    } finally {
      setSummaryLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center space-y-3 py-12">
        <p className="text-negative text-sm">{error}</p>
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
