"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { getMarketData, NewsItem } from "@/lib/api";
import NewsFeed from "@/components/NewsFeed";

export default function NewsPage() {
  const { userId } = useUser();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    getMarketData(userId)
      .then((m) => setNews(m.news))
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
      <h1 className="text-2xl font-bold tracking-tight">News</h1>
      {news.length > 0 ? (
        <NewsFeed news={news} />
      ) : (
        <p className="text-sm text-zinc-500">No recent news for your holdings.</p>
      )}
    </div>
  );
}
