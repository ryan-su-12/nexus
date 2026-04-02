const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Holding {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  quantity: number;
  currency: string;
}

export interface Performance {
  symbol: string;
  current_price: number;
  previous_close: number;
  daily_change: number;
  daily_change_pct: number;
}

export interface NewsItem {
  headline: string;
  summary: string;
  source: string;
  url: string;
  symbol: string;
}

export interface MarketData {
  performances: Performance[];
  news: NewsItem[];
}

export interface DailySummary {
  date: string;
  summary: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }
  return res.json();
}

export function getHoldings(userId: string) {
  return apiFetch<{ holdings: Holding[] }>(`/users/${userId}/holdings`);
}

export function getMarketData(userId: string) {
  return apiFetch<MarketData>(`/users/${userId}/market`);
}

export function getDailySummary(userId: string) {
  return apiFetch<DailySummary>(`/users/${userId}/summary`);
}
