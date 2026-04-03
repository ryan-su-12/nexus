const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface Holding {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  quantity: number;
  currency: string;
  account_id: string | null;
  account_name: string | null;
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

export function getBrokerageConnectUrl(userId: string) {
  return apiFetch<{ connect_url: string }>(`/users/${userId}/brokerage/connect`, {
    method: "POST",
  });
}

export function getBrokerageAccounts(userId: string) {
  return apiFetch<{ accounts: BrokerageAccount[] }>(`/users/${userId}/brokerage/accounts`);
}

export function syncBrokerageHoldings(userId: string) {
  return apiFetch<{ holdings_count: number; holdings: Holding[] }>(
    `/users/${userId}/brokerage/holdings`
  );
}

export interface BrokerageAccount {
  id: string;
  name: string;
  number: string;
  institution_name: string;
}
