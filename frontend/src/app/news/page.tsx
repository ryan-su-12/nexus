"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/AuthContext";
import { getMarketData } from "@/lib/api";

/* ──────────────────────────────────────────────────────────────
   News — Recent News with sentiment gauges
   ────────────────────────────────────────── */

type Tab = "portfolio" | "market";

export default function NewsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("portfolio");

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
    return (
      <p className="text-negative text-sm py-12 text-center">{error.message}</p>
    );
  }

  // Placeholder data shaped to match the mock
  const items: NewsItem[] = [
    {
      ticker: "BTC",
      source: "BENZINGA",
      tone: "green",
      title: "Bitcoin Reclaims $71,000 as Ethereum, XRP, Dogecoin Rise...",
      bullets: [
        "Bitcoin is up 5% to reclaim the $71,000 level after President Trump overnight",
        "announced a two-week ceasefire from $64.7 million in net outflows.",
      ],
      sentiment: "POSITIVE",
      score: 7,
      relevance: {
        symbol: "COIN",
        holding: "BTC | Benzinga",
        changePct: "+2.1%",
        up: true,
      },
    },
    {
      ticker: "BTC",
      source: "BENZINGA",
      tone: "red",
      title: "Bitcoin, Ethereum, XRP, Dogecoin Falter...",
      bullets: [
        "Bitcoin is down on Tuesday as geopolitical tensions Trump Trump Ultimatum",
        "in transportation momentum rise following Donald Trump@#39;s ultimatum to Iran.",
      ],
      sentiment: "NEGATIVE",
      score: -5,
      relevance: {
        symbol: "ETH",
        holding: "Relevant to your ETH",
        changePct: "-1.8%",
        up: false,
      },
    },
    {
      ticker: "COIN",
      source: "COIN",
      tone: "blue",
      title: "Why is Coinbase Going Up Monday?",
      bullets: [
        "Coinbase Global Inc is trending up Monday?",
        "A broad rallys cryptocurrency sector is driving the upward momentum.",
      ],
      sentiment: "POSITIVE",
      score: 9,
      relevance: {
        symbol: "COIN",
        holding: "Your COIN holding is",
        changePct: "+2.1%",
        up: true,
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header + tab pills */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-4">RECENT NEWS</h1>
        <div className="flex items-center gap-3">
          <TabPill
            active={tab === "portfolio"}
            onClick={() => setTab("portfolio")}
          >
            PORTFOLIO NEWS {tab === "portfolio" && "(ACTIVE)"}
          </TabPill>
          <TabPill active={tab === "market"} onClick={() => setTab("market")}>
            MARKET FEED
          </TabPill>
        </div>
      </div>

      {/* News cards */}
      <div className="space-y-4">
        {items.map((it, i) => (
          <NewsCard key={i} item={it} />
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────── */

type NewsItem = {
  ticker: string;
  source: string;
  tone: "green" | "red" | "blue";
  title: string;
  bullets: string[];
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  score: number;
  relevance: {
    symbol: string;
    holding: string;
    changePct: string;
    up: boolean;
  };
};

function TabPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-wider transition-colors border ${
        active
          ? "bg-accent-dim text-accent border-accent/40"
          : "bg-transparent text-muted border-border hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const tickerBg =
    item.tone === "green"
      ? "bg-accent-dim border-accent/40 text-accent"
      : item.tone === "red"
      ? "bg-negative/20 border-negative/40 text-negative"
      : "bg-blue-500/20 border-blue-500/40 text-blue-400";

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex gap-5">
        {/* Left: ticker badge */}
        <div className="flex flex-col items-center shrink-0 w-16">
          <div
            className={`h-14 w-14 rounded-full border-2 flex items-center justify-center font-bold text-sm ${tickerBg}`}
          >
            {item.ticker}
          </div>
          <span className="text-[10px] text-muted mt-2">{item.ticker}</span>
        </div>

        {/* Middle: content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground leading-snug mb-2">
            {item.title}
          </h3>
          <ul className="space-y-1 mb-3">
            {item.bullets.map((b, i) => (
              <li
                key={i}
                className="text-xs text-muted leading-relaxed flex gap-2"
              >
                <span className="text-muted">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button className="rounded-full border border-accent/40 bg-accent-dim px-4 py-1 text-[10px] font-semibold text-accent tracking-wider hover:bg-accent/20 transition-colors">
              WATCH TICKER
            </button>
            <button className="rounded-full border border-border px-4 py-1 text-[10px] font-semibold text-muted tracking-wider hover:text-foreground hover:border-accent/30 transition-colors">
              DEEP DIVE
            </button>
          </div>
        </div>

        {/* Right: sentiment gauge + relevance */}
        <div className="flex flex-col items-center shrink-0 w-40">
          <SentimentGauge score={item.score} sentiment={item.sentiment} />
          <p className="text-[10px] text-muted text-center mt-2 leading-snug">
            {item.relevance.holding}
            <br />
            holding{" "}
            <span
              className={
                item.relevance.up ? "text-accent" : "text-negative"
              }
            >
              ({item.relevance.changePct} today)
            </span>
          </p>
        </div>

        <button className="text-muted hover:text-foreground text-sm self-start">
          ⋮
        </button>
      </div>
    </div>
  );
}

function SentimentGauge({
  score,
  sentiment,
}: {
  score: number;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
}) {
  const color =
    sentiment === "POSITIVE"
      ? "#22c55e"
      : sentiment === "NEGATIVE"
      ? "#ef4444"
      : "#a1a1aa";

  // clamp score to -10..10 for arc
  const clamped = Math.max(-10, Math.min(10, score));
  const pct = (Math.abs(clamped) / 10) * 50; // half-circle, max 50% of circumference
  const r = 32;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="relative h-16 w-24">
      <svg viewBox="0 0 100 60" className="w-full h-full">
        <path
          d="M10,55 A40,40 0 0,1 90,55"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle
          cx="50"
          cy="55"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-180 50 55)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <span className="text-[8px] tracking-wider" style={{ color }}>
          {sentiment}
        </span>
        <span
          className="text-base font-bold font-mono leading-none"
          style={{ color }}
        >
          {score > 0 ? `+${score}` : score}
        </span>
      </div>
    </div>
  );
}
