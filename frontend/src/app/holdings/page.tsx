"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/AuthContext";
import { getHoldings, getMarketData } from "@/lib/api";
import HoldingsTable from "@/components/HoldingsTable";
import AllocationChart from "@/components/AllocationChart";

export default function HoldingsPage() {
  const { user } = useAuth();

  const { data: holdingsData, error: holdingsError } = useSWR(
    user ? `holdings-${user.id}` : null,
    () => getHoldings(user!.id)
  );

  const { data: market } = useSWR(
    user ? `market-${user.id}` : null,
    () => getMarketData(user!.id)
  );

  const loading = !holdingsData && !holdingsError;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (holdingsError) {
    return <p className="text-negative text-sm py-12 text-center">{holdingsError.message}</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Holdings</h1>
      <AllocationChart holdings={holdingsData?.holdings ?? []} performances={market?.performances ?? []} />
      <HoldingsTable holdings={holdingsData?.holdings ?? []} performances={market?.performances ?? []} />
    </div>
  );
}
