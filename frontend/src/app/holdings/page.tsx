"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getHoldings, getMarketData, Holding, MarketData } from "@/lib/api";
import HoldingsTable from "@/components/HoldingsTable";

export default function HoldingsPage() {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    Promise.all([getHoldings(user.id), getMarketData(user.id)])
      .then(([h, m]) => {
        setHoldings(h.holdings);
        setMarket(m);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (error) {
    return <p className="text-negative text-sm py-12 text-center">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Holdings</h1>
      <HoldingsTable holdings={holdings} performances={market?.performances ?? []} />
    </div>
  );
}
