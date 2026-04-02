"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { getHoldings, getMarketData, Holding, MarketData } from "@/lib/api";
import HoldingsTable from "@/components/HoldingsTable";

export default function HoldingsPage() {
  const { userId } = useUser();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    Promise.all([getHoldings(userId), getMarketData(userId)])
      .then(([h, m]) => {
        setHoldings(h.holdings);
        setMarket(m);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <p className="text-sm text-zinc-500">Please enter a user ID on the Overview page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-sm py-12 text-center">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Holdings</h1>
      <HoldingsTable holdings={holdings} performances={market?.performances ?? []} />
    </div>
  );
}
