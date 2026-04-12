"use client";

import { useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import ReactMarkdown from "react-markdown";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/lib/AuthContext";
import {
  getMarketData,
  getPortfolioHistory,
  getBenchmarkHistory,
  getDailySummary,
  getHoldings,
  type MarketData,
  type HistoryPoint,
  type Holding,
} from "@/lib/api";
import PortfolioChart from "@/components/PortfolioChart";
import HeatmapTreemapCard from "@/components/HeatmapTreemapCard";

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

  const { data: benchmarkData } = useSWR(
    `benchmark-${range}`,
    () => getBenchmarkHistory(range)
  );

  const { data: holdingsData } = useSWR(
    user ? `holdings-${user.id}` : null,
    () => getHoldings(user!.id)
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
     

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* ───────── Left column: Portfolio Performance + Carousel ───────── */}
        <div className="flex flex-col gap-5">
          <PortfolioPerformanceCard
            history={historyData?.history ?? []}
            benchmark={benchmarkData?.history ?? []}
            range={range}
            onRangeChange={handleRangeChange}
          />
          <div className="flex-1 min-h-0">
            <InsightCarousel
              holdings={holdingsData?.holdings ?? []}
              market={market}
              history={historyData?.history ?? []}
            />
          </div>
        </div>

        {/* ───────── Right column: Daily Narrative (AI summary) ───────── */}
        <div className="flex flex-col gap-5 min-h-0 overflow-hidden">
          <DailyNarrativeCard
            userId={user?.id ?? null}
            market={market}
            history={historyData?.history ?? []}
          />
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

function DailyNarrativeCard({
  userId,
  market,
  history,
}: {
  userId: string | null;
  market: MarketData | undefined;
  history: HistoryPoint[];
}) {
  // ── AI summary state: auto-generate on mount / when user changes ──
  const { data: summary, mutate: mutateSummary } = useSWR<string | null>(
    userId ? `summary-${userId}` : null,
    null,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  const [summaryLoading, setSummaryLoading] = useState(false);

  const generate = useCallback(async () => {
    if (!userId) return;
    setSummaryLoading(true);
    try {
      const res = await getDailySummary(userId);
      mutateSummary(res.summary, { revalidate: false });
    } finally {
      setSummaryLoading(false);
    }
  }, [userId, mutateSummary]);

  useEffect(() => {
    if (userId && !summary && !summaryLoading) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── Today's portfolio % change (from latest history point) ──
  const todayPct =
    history.length > 0 ? history[history.length - 1].change_pct : null;
  const up = (todayPct ?? 0) >= 0;
  const moveVerb = up ? "rose" : "fell";
  const pctDisplay =
    todayPct !== null ? `${Math.abs(todayPct).toFixed(2)}%` : "—";

  // ── Top mover by absolute daily change % ──
  const performances = market?.performances ?? [];
  const topMover = [...performances].sort(
    (a, b) => Math.abs(b.daily_change_pct) - Math.abs(a.daily_change_pct)
  )[0];

  // ── Secondary movers for the teaser ──
  const otherMovers = performances
    .filter((p) => p.symbol !== topMover?.symbol)
    .sort(
      (a, b) => Math.abs(b.daily_change_pct) - Math.abs(a.daily_change_pct)
    )
    .slice(0, 2)
    .map((p) => p.symbol);

  // ── Related news headline for the top mover ──
  const relatedNews = topMover
    ? market?.news?.find((n) => n.symbol === topMover.symbol)
    : undefined;

  // ── Build dynamic headline ──
  let headline: React.ReactNode = "Markets held steady today.";
  if (topMover) {
    const moverUp = topMover.daily_change_pct >= 0;
    headline = (
      <>
        {moverUp ? "Lifted" : "Dragged"} by{" "}
        <span className="text-accent">[{topMover.symbol}]</span>{" "}
        {moverUp ? "Surge" : "Slide"}.
      </>
    );
  }

  // ── Build teaser ──
  let teaser: string;
  if (relatedNews?.headline) {
    teaser = relatedNews.headline;
  } else if (topMover && otherMovers.length > 0) {
    const dir = topMover.daily_change_pct >= 0 ? "climbed" : "slipped";
    teaser = `${topMover.symbol} ${dir} ${Math.abs(
      topMover.daily_change_pct
    ).toFixed(2)}% today. Notable moves also came from ${otherMovers
      .map((s) => `${s}`)
      .join(" and ")}.`;
  } else {
    teaser =
      "Connect a brokerage and ingest today's news to see what drove your portfolio.";
  }

  return (
    <Card className="border-accent/30 h-full flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted">
          Daily Narrative
        </p>
        <button
          onClick={generate}
          disabled={summaryLoading}
          className="text-[10px] text-muted hover:text-foreground disabled:opacity-50"
        >
          {summaryLoading ? "Generating..." : "Regenerate"}
        </button>
      </div>
      <p className="text-sm text-foreground/80 mb-2">
        Your portfolio {moveVerb}{" "}
        <span className={up ? "text-accent" : "text-negative"}>
          {pctDisplay}
        </span>{" "}
        Today
      </p>
      <h2 className="text-2xl font-bold leading-tight mb-3">{headline}</h2>
      <p className="text-sm text-muted leading-relaxed mb-5">{teaser}</p>

      <div className="border-t border-border pt-4 flex-1 min-h-0 overflow-y-auto">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-muted mb-3">
          AI Daily Summary · Powered by Claude
        </p>
        {summaryLoading && !summary ? (
          <div className="flex items-center gap-3 text-muted py-6">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
            <span className="text-sm">Analyzing your portfolio...</span>
          </div>
        ) : summary ? (
          <div className="text-sm leading-relaxed text-foreground/90">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold mb-3 text-foreground">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold mb-2 mt-4 text-foreground">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold mb-1.5 mt-3 text-foreground">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-accent">
                    {children}
                  </strong>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-3 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-3 space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-foreground/90">{children}</li>
                ),
              }}
            >
              {summary}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted py-6">No summary yet.</p>
        )}
      </div>
    </Card>
  );
}

function extractNarrative(summary: string | null): {
  headline: string;
  teaser: string;
} {
  if (!summary) return { headline: "", teaser: "" };

  // Strip markdown headers/formatting for plain text extraction
  const lines = summary
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Prefer first heading as the headline, else first sentence
  const headingLine = lines.find((l) => l.startsWith("#"));
  let headline = headingLine
    ? headingLine.replace(/^#+\s*/, "")
    : lines[0] ?? "";

  // Teaser = first paragraph that isn't the headline
  const teaserLine =
    lines.find((l) => !l.startsWith("#") && l !== headline) ?? "";

  // Cap headline length
  if (headline.length > 120) headline = headline.slice(0, 120) + "…";

  return { headline, teaser: teaserLine };
}


function InsightCarousel({
  holdings,
  market,
  history,
}: {
  holdings: Holding[];
  market: MarketData | undefined;
  history: HistoryPoint[];
}) {
  const [page, setPage] = useState(0);
  const labels = ["Waterfall", "Heatmap"];
  const total = labels.length;

  return (
    <div className="flex flex-col h-full">
      {/* Carousel header with dots + arrows */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {labels.map((label, i) => (
            <button
              key={label}
              onClick={() => setPage(i)}
              className={`text-[11px] font-semibold tracking-wider uppercase transition-colors ${
                page === i ? "text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => (p - 1 + total) % total)}
            className="h-6 w-6 rounded-full border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-accent/40 transition-colors text-xs"
          >
            ‹
          </button>
          <button
            onClick={() => setPage((p) => (p + 1) % total)}
            className="h-6 w-6 rounded-full border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-accent/40 transition-colors text-xs"
          >
            ›
          </button>
        </div>
      </div>

      {/* Pages */}
      <div className="flex-1 min-h-0">
        {page === 0 && (
          <WaterfallContributionCard
            holdings={holdings}
            market={market}
            history={history}
          />
        )}
        {page === 1 && (
          <HeatmapTreemapCard
            holdings={holdings}
            performances={market?.performances ?? []}
          />
        )}
      </div>
    </div>
  );
}

function WaterfallContributionCard({
  holdings,
  market,
  history,
}: {
  holdings: Holding[];
  market: MarketData | undefined;
  history: HistoryPoint[];
}) {
  // ── Compute per-holding $ contribution to today's P&L ──
  const perfMap = new Map(
    (market?.performances ?? []).map((p) => [p.symbol, p] as const)
  );

  // Aggregate by symbol (same symbol in multiple accounts → sum)
  const qtyBySymbol = new Map<string, number>();
  for (const h of holdings) {
    qtyBySymbol.set(h.symbol, (qtyBySymbol.get(h.symbol) ?? 0) + h.quantity);
  }

  type Contribution = { symbol: string; delta: number };
  const contributions: Contribution[] = [];
  for (const [symbol, qty] of qtyBySymbol) {
    const perf = perfMap.get(symbol);
    if (!perf) continue;
    contributions.push({ symbol, delta: qty * perf.daily_change });
  }

  // Sort by absolute impact, take top 6
  contributions.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const top = contributions.slice(0, 6);

  // ── Derive Open / Close from history ──
  const last = history[history.length - 1]?.value ?? 0;
  const todayNet = top.reduce((s, c) => s + c.delta, 0);
  const open = last - todayNet;

  // ── Delta-only rows: each bar is the $ contribution of one
  //    holding, drawn from the 0 baseline so the Y-axis auto-scales
  //    to just the range of today's moves. Open/Close are shown as
  //    numeric annotations above the chart. ──
  type Row = {
    name: string;
    delta: number;
  };

  const rows: Row[] = top.map((c) => ({ name: c.symbol, delta: c.delta }));

  const fmtDelta = (v: number) => {
    const sign = v >= 0 ? "+" : "-";
    const abs = Math.abs(v);
    if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
    return `${sign}$${abs.toFixed(0)}`;
  };
  const fmtTotal = (v: number) =>
    `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  const colorFor = (delta: number) => (delta >= 0 ? "#00d632" : "#ff5252");

  const hasData = holdings.length > 0 && top.length > 0;

  const net = last - open;

  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted">
          Waterfall Contribution Chart
        </p>
        {hasData && (
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-muted">
              Open{" "}
              <span className="text-foreground">{fmtTotal(open)}</span>
            </span>
            <span className="text-muted">
              Close{" "}
              <span className="text-foreground">{fmtTotal(last)}</span>
            </span>
            <span
              className={`font-semibold ${
                net >= 0 ? "text-accent" : "text-negative"
              }`}
            >
              {fmtDelta(net)}
            </span>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="flex-1 min-h-[224px] flex items-center justify-center text-sm text-muted">
          No contribution data yet
        </div>
      ) : (
        <div className="flex-1 min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              margin={{ top: 16, right: 8, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#242424"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#a3a3a3", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#737373", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(0)}`
                }
                width={64}
                domain={["auto", "auto"]}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  backgroundColor: "#141414",
                  border: "1px solid #242424",
                  borderRadius: "12px",
                  fontSize: 12,
                }}
                formatter={((_v: unknown, _n: unknown, entry: { payload?: Row }) => {
                  const r = entry.payload;
                  if (!r) return ["", ""];
                  return [fmtDelta(r.delta), r.name];
                }) as never}
                labelStyle={{ display: "none" }}
              />
              <Bar dataKey="delta" radius={[4, 4, 4, 4]}>
                {rows.map((r, i) => (
                  <Cell key={i} fill={colorFor(r.delta)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function PortfolioPerformanceCard({
  history,
  benchmark,
  range,
  onRangeChange,
}: {
  history: HistoryPoint[];
  benchmark: HistoryPoint[];
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
          benchmark={benchmark}
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

