"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/AuthContext";
import { getMarketData } from "@/lib/api";
import NewsFeed from "@/components/NewsFeed";

export default function NewsPage() {
  const { user } = useAuth();

  const { data: market, error } = useSWR(
    user ? `market-${user.id}` : null,
    () => getMarketData(user!.id)
  );

  const loading = !market && !error;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (error) {
    return <p className="text-negative text-sm py-12 text-center">{error.message}</p>;
  }

  const news = market?.news ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">News</h1>
      {news.length > 0 ? (
        <NewsFeed news={news} />
      ) : (
        <p className="text-sm text-muted">No recent news for your holdings.</p>
      )}
    </div>
  );
}
