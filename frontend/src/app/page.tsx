"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/AuthContext";
import { getMarketData, getPortfolioHistory } from "@/lib/api";
import PortfolioChart from "@/components/PortfolioChart";

/* ──────────────────────────────────────────────────────────────
   Overview page — new layout
   Structure (matches design mock):
     ┌──────────────────────────┬────────────────────────────┐
     │ Daily Narrative          │ Portfolio Performance      │
     │                          ├──────────────┬─────────────┤
     │ Waterfall Contribution   │ News Feed    │ Top Movers  │
     │                          ├──────────────┴─────────────┤
     │                          │ Daily Sector Breakdown     │
     └──────────────────────────┴────────────────────────────┘
   ────────────────────────────────────────────────────────── */

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

  const handleRangeChange = useCallback((days: number) => setRange(days), []);

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
    <div className="space-y-5">
      {/* Page header — tabs */}
      <OverviewTabs />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ───────── Left column ───────── */}
        <div className="space-y-5">
          <DailyNarrativeCard />
          <WaterfallContributionCard />
        </div>

        {/* ───────── Right column ───────── */}
        <div className="space-y-5">
          <PortfolioPerformanceCard
            history={historyData?.history ?? []}
            range={range}
            onRangeChange={handleRangeChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <NewsFeedCard />
            <TopMoversCard />
          </div>

          <SectorBreakdownCard />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Sub-components (layout placeholders — wire up data later)
   ────────────────────────────────────────────────────────── */

function OverviewTabs() {
  const tabs = ["Overview", "Portfolio", "Analytics"];
  const [active, setActive] = useState("Overview");
  return (
    <div className="flex items-center justify-center gap-8 border-b border-border pb-3">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setActive(t)}
          className={`text-sm font-medium transition-colors relative pb-2 ${
            active === t ? "text-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          {t}
          {active === t && (
            <span className="absolute left-0 right-0 -bottom-[13px] h-[2px] bg-accent rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function DailyNarrativeCard() {
  return (
    <Card className="border-accent/30">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-muted mb-3">
        Daily Narrative
      </p>
      <p className="text-sm text-foreground/80 mb-2">
        Your portfolio rose <span className="text-accent">1.28%</span> Today
      </p>
      <h2 className="text-2xl font-bold leading-tight mb-3">
        Driven by Tech Sector Earnings and{" "}
        <span className="text-accent">[NVDA]</span> Surge.
      </h2>
      <p className="text-sm text-muted leading-relaxed mb-4">
        The highlight includes robust Q1 earnings from NVDA, offsetting minor
        losses in transportation. Significant momentum was also seen in AAPL
        and TSLA.
      </p>
      <button className="text-xs text-accent hover:underline">
        Learn More ›
      </button>
    </Card>
  );
}

function WaterfallContributionCard() {
  // Placeholder bars — replace with real contribution data
  const bars = [
    { label: "Open", value: 200, type: "base" },
    { label: "", value: 360, type: "pos" },
    { label: "[NVDA]", value: 520, delta: "+$620", type: "pos" },
    { label: "[AAPL]", value: 110, delta: "+$110", type: "pos" },
    { label: "[AAPL]", value: 40, delta: "", type: "pos" },
    { label: "", value: 30, delta: "-$10", type: "neg" },
    { label: "[TSLA]", value: 88, delta: "-$88", type: "neg" },
    { label: "Close", value: 640, type: "base" },
  ];
  const max = Math.max(...bars.map((b) => b.value));

  return (
    <Card>
      <p className="text-[11px] font-semibold tracking-widest uppercase text-muted mb-5">
        Waterfall Contribution Chart
      </p>
      <div className="h-56 flex items-end gap-3 px-2">
        {bars.map((b, i) => {
          const h = (b.value / max) * 100;
          const color =
            b.type === "pos"
              ? "bg-accent/70"
              : b.type === "neg"
              ? "bg-negative/70"
              : "bg-muted/40";
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              {b.delta && (
                <span
                  className={`text-[10px] font-mono ${
                    b.type === "pos" ? "text-accent" : "text-negative"
                  }`}
                >
                  {b.delta}
                </span>
              )}
              <div
                className={`w-full rounded-t-md ${color}`}
                style={{ height: `${h}%` }}
              />
              <span className="text-[10px] text-muted truncate w-full text-center">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function PortfolioPerformanceCard({
  history,
  range,
  onRangeChange,
}: {
  history: { date: string; value: number }[];
  range: number;
  onRangeChange: (days: number) => void;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted">
          Portfolio Performance
        </p>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-muted">
            <span className="h-2 w-2 rounded-full bg-accent" /> NEXUS
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <span className="h-2 w-2 rounded-full bg-negative" /> S&P 500
            BENCHMARK
          </span>
        </div>
      </div>

      {history.length > 0 ? (
        <PortfolioChart
          history={history}
          range={range}
          onRangeChange={onRangeChange}
        />
      ) : (
        <div className="h-48 flex items-center justify-center text-sm text-muted">
          No history yet
        </div>
      )}
    </Card>
  );
}

function NewsFeedCard() {
  const items = [
    {
      tag: "↗",
      title: "NVDA: Blowout Q1 Earnings",
      source: "FINNHUB",
      blurb: "NVDA Blowout Q1 earnings /NVDA.",
    },
    {
      tag: "▤",
      title: "Fed Minutes: Cautious stance",
      source: "BLOOMBERG",
      blurb: "Fed Minutes cautious stance it stance.",
    },
    {
      tag: "◉",
      title: "Crude Oil prices soften",
      source: "REUTERS",
      blurb: "Crude Oil prices soften soften.",
    },
  ];
  return (
    <Card>
      <p className="text-[11px] font-semibold tracking-widest uppercase text-muted mb-4">
        Contextual News Feed
      </p>
      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-surface-light border border-border flex items-center justify-center text-accent text-sm">
              {it.tag}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground leading-tight">
                {it.title}
              </p>
              <p className="text-[10px] text-muted mt-0.5">[{it.source}]</p>
              <p className="text-[11px] text-muted mt-1 truncate">
                {it.blurb}
              </p>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-4 text-[11px] text-accent hover:underline">
        See All News ›
      </button>
    </Card>
  );
}

function TopMoversCard() {
  const rows = [
    { ticker: "NVDA", pct: "+3.35%", impact: "+$620", up: true },
    { ticker: "AAPL", pct: "+0.06%", impact: "+$630", up: true },
    { ticker: "AAPL", pct: "-0.39%", impact: "-$110", up: false },
    { ticker: "TLLA", pct: "-0.22%", impact: "-$388", up: false },
  ];
  return (
    <Card>
      <p className="text-[11px] font-semibold tracking-widest uppercase text-muted mb-4">
        Top Movers
      </p>
      <div className="grid grid-cols-3 text-[10px] text-muted pb-2 border-b border-border">
        <span>Ticker</span>
        <span className="text-right">Change%</span>
        <span className="text-right">Impact$</span>
      </div>
      <div className="divide-y divide-border">
        {rows.map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-3 py-2 text-xs font-mono items-center"
          >
            <span className="text-foreground">[{r.ticker}]</span>
            <span
              className={`text-right ${
                r.up ? "text-accent" : "text-negative"
              }`}
            >
              {r.pct}
            </span>
            <span
              className={`text-right ${
                r.up ? "text-accent" : "text-negative"
              }`}
            >
              {r.impact}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SectorBreakdownCard() {
  // Placeholder conic-gradient donut
  const donut =
    "conic-gradient(#22c55e 0 30%, #3b82f6 30% 50%, #a855f7 50% 65%, #f59e0b 65% 80%, #ef4444 80% 92%, #14b8a6 92% 100%)";
  return (
    <Card>
      <p className="text-[11px] font-semibold tracking-widest uppercase text-muted mb-4">
        Daily Sector Breakdown
      </p>
      <div className="flex items-center justify-center py-2">
        <div
          className="h-40 w-40 rounded-full flex items-center justify-center"
          style={{ background: donut }}
        >
          <div className="h-24 w-24 rounded-full bg-surface flex flex-col items-center justify-center">
            <span className="text-[10px] text-muted">Performance</span>
            <span className="text-sm font-bold text-foreground">85.6%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
