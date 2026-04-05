"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/AuthContext";
import { getMarketData, getDailySummary, getPortfolioHistory } from "@/lib/api";
import SummaryPanel from "@/components/SummaryPanel";
import PortfolioChart from "@/components/PortfolioChart";

export default function OverviewPage() {
  const { user } = useAuth();
  const [range, setRange] = useState(30);

  const { data: market, error: marketError } = useSWR(
    user ? `market-${user.id}` : null,
    () => getMarketData(user!.id)
  );

  const { data: historyData } = useSWR(
    user ? `history-${user.id}-${range}` : null,
    () => getPortfolioHistory(user!.id, range)
  );

  const { data: summaryData, mutate: mutateSummary } = useSWR(
    user ? `summary-${user.id}` : null,
    null,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const [summaryLoading, setSummaryLoading] = useState(false);

  const handleRangeChange = useCallback(async (days: number) => {
    setRange(days);
  }, []);

  const handleGenerateSummary = useCallback(async () => {
    if (!user) return;
    setSummaryLoading(true);
    try {
      const res = await getDailySummary(user.id);
      mutateSummary(res.summary, { revalidate: false });
    } finally {
      setSummaryLoading(false);
    }
  }, [user, mutateSummary]);

  const loading = !market && !marketError;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (marketError) {
    return (
      <div className="text-center space-y-3 py-12">
        <p className="text-negative text-sm">{marketError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {historyData && historyData.history.length > 0 && (
        <PortfolioChart history={historyData.history} range={range} onRangeChange={handleRangeChange} />
      )}
      <SummaryPanel
        summary={summaryData ?? null}
        loading={summaryLoading}
        onGenerate={handleGenerateSummary}
      />
    </div>
  );
}
