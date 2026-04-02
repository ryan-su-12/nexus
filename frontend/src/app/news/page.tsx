"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getMarketData, NewsItem } from "@/lib/api";
import NewsFeed from "@/components/NewsFeed";

export default function NewsPage() {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    getMarketData(user.id)
      .then((m) => setNews(m.news))
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
      <h1 className="text-2xl font-bold tracking-tight">News</h1>
      {news.length > 0 ? (
        <NewsFeed news={news} />
      ) : (
        <p className="text-sm text-muted">No recent news for your holdings.</p>
      )}
    </div>
  );
}
