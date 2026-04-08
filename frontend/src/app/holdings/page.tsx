"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/AuthContext";
import { getHoldings, getMarketData } from "@/lib/api";

/* ──────────────────────────────────────────────────────────────
   Portfolio (Attribution Matrix) — new layout
   ┌──────────────────────────────────────────┐
   │ ATTRIBUTION MATRIX    [Deep Dive analysis ▾]
   ├──────────────────────────┬───────────────┤
   │ Heatmap Treemap          │ Correlation   │
   │                          │ Explorer      │
   ├──────────────────────────┴───────────────┤
   │ Attribution Factors table                │
   └──────────────────────────────────────────┘
   ────────────────────────────────────────── */

export default function PortfolioPage() {
  const { user } = useAuth();

  const { data: holdingsData, error: holdingsError } = useSWR(
    user ? `holdings-${user.id}` : null,
    () => getHoldings(user!.id)
  );

  useSWR(user ? `market-${user.id}` : null, () => getMarketData(user!.id));

  const loading = !holdingsData && !holdingsError;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (holdingsError) {
    return (
      <p className="text-negative text-sm py-12 text-center">
        {holdingsError.message}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">ATTRIBUTION MATRIX</h1>
        <button className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs text-foreground hover:border-accent/40 transition-colors">
          Deep Dive analysis
          <span className="text-muted">▾</span>
        </button>
      </div>

      {/* Top row: Treemap + Correlation Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <HeatmapTreemapCard />
        </div>
        <CorrelationExplorerCard />
      </div>

      {/* Attribution factors table */}
      <AttributionFactorsCard />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────── */

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

function CardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle && (
          <p className="text-[11px] text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      <button className="text-muted hover:text-foreground text-sm">⋮</button>
    </div>
  );
}

/* ── Heatmap Treemap ──
   Placeholder treemap using CSS grid. Each tile sizes by weight,
   color = daily % change (green pos / red neg).  */
function HeatmapTreemapCard() {
  type Tile = {
    label: string;
    pct: string;
    col: number; // grid column span
    row: number; // grid row span
    tone: "pos-strong" | "pos" | "neg" | "neg-strong";
  };

  const tiles: Tile[] = [
    { label: "NVDA", pct: "18%", col: 4, row: 3, tone: "pos-strong" },
    { label: "AAPL", pct: "12%", col: 3, row: 2, tone: "pos" },
    { label: "AAPL", pct: "12%", col: 2, row: 2, tone: "pos" },
    { label: "NVDA", pct: "18%", col: 2, row: 2, tone: "neg-strong" },
    { label: "AAPL", pct: "6%", col: 2, row: 2, tone: "neg" },
    { label: "TSLA", pct: "7%", col: 1, row: 2, tone: "neg" },
    { label: "NVAA", pct: "3%", col: 2, row: 1, tone: "pos" },
    { label: "TLA", pct: "2%", col: 1, row: 1, tone: "neg" },
    { label: "AAPL", pct: "12%", col: 4, row: 2, tone: "pos" },
    { label: "AAPL", pct: "6%", col: 2, row: 2, tone: "pos" },
    { label: "TLA", pct: "2%", col: 1, row: 1, tone: "neg" },
    { label: "TSLA", pct: "2%", col: 2, row: 1, tone: "neg-strong" },
    { label: "TSLA", pct: "2%", col: 1, row: 1, tone: "neg" },
  ];

  const toneClass = (t: Tile["tone"]) =>
    ({
      "pos-strong": "bg-accent/70 text-black",
      pos: "bg-accent/40 text-foreground",
      neg: "bg-negative/50 text-foreground",
      "neg-strong": "bg-negative/70 text-foreground",
    }[t]);

  return (
    <Card>
      <CardHeader
        title="Heatmap Treemap"
        subtitle="Size corresponds to position weight. Color % daily % change."
      />
      <div
        className="grid gap-1 h-[460px]"
        style={{
          gridTemplateColumns: "repeat(8, 1fr)",
          gridAutoRows: "1fr",
          gridAutoFlow: "dense",
        }}
      >
        {tiles.map((t, i) => (
          <div
            key={i}
            className={`rounded-md flex flex-col items-center justify-center ${toneClass(
              t.tone
            )}`}
            style={{
              gridColumn: `span ${t.col}`,
              gridRow: `span ${t.row}`,
            }}
          >
            <span className="text-xs font-semibold">[{t.label}]</span>
            <span className="text-[11px] font-mono opacity-90">{t.pct}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Correlation Explorer ── */
function CorrelationExplorerCard() {
  const rows = [
    { label: "Custom Timeline", value: "0.09" },
    { label: "NEXUS PORTFOLIO", value: "0.59" },
    { label: "NEXUS PORTFOLIO", value: "0.99" },
    { label: "S&P 500 BENCHMARK", value: "0.89" },
    { label: "S&P 500 BENCHMARK", value: "0.65" },
    { label: "NYFAFIIANNAX", value: "0.09" },
  ];
  return (
    <Card>
      <CardHeader
        title="Correlation Explorer"
        subtitle="Correlation coefficient + custom timeline"
      />
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold">NEXUS PORTFOLIO</p>
        <p className="text-xs font-mono text-foreground">0.89</p>
      </div>
      <MiniLineChart tone="accent" />

      <div className="flex items-center justify-between mt-4 mb-2">
        <p className="text-xs font-semibold text-muted">~ S&P 500 BENCHMARK</p>
      </div>
      <MiniLineChart tone="negative" />

      <div className="mt-4 divide-y divide-border">
        {rows.map((r, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 text-xs"
          >
            <span className="text-muted">{r.label}</span>
            <span className="font-mono text-foreground">{r.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MiniLineChart({ tone }: { tone: "accent" | "negative" }) {
  // simple stepped path placeholder
  const color = tone === "accent" ? "#22c55e" : "#ef4444";
  const fill =
    tone === "accent" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)";
  const points =
    tone === "accent"
      ? "0,60 15,50 30,55 45,40 60,45 75,30 90,35 105,20 120,25 135,10 150,15"
      : "0,30 15,40 30,35 45,50 60,45 75,55 90,50 105,60 120,55 135,65 150,55";
  return (
    <div className="rounded-lg bg-surface-light border border-border p-2">
      <svg viewBox="0 0 150 70" className="w-full h-20">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
        />
        <polygon points={`${points} 150,70 0,70`} fill={fill} />
      </svg>
    </div>
  );
}

/* ── Attribution Factors table ── */
function AttributionFactorsCard() {
  const rows = [
    { t: "NVDA", w1: "12%", w2: "0.2%", mom: "-0.22%", chg: "0.99%", imp: "0.99%" },
    { t: "AAPL", w1: "12%", w2: "0.2%", mom: "-0.22%", chg: "0.96%", imp: "0.96%" },
    { t: "NVLA", w1: "3.2%", w2: "0.2%", mom: "-0.22%", chg: "0.99%", imp: "0.99%" },
    { t: "NVOA", w1: "2.5%", w2: "0.7%", mom: "-0.22%", chg: "0.99%", imp: "0.56%" },
    { t: "TLA", w1: "2.3%", w2: "0.2%", mom: "-0.22%", chg: "0.99%", imp: "0.50%" },
    { t: "TSLA", w1: "2.9%", w2: "0.2%", mom: "-0.22%", chg: "0.05%", imp: "0.50%" },
  ];
  return (
    <Card>
      <CardHeader
        title="Attribution Factors (e.g., Value, Growth, Momentum)"
        subtitle="Size corresponds to position weight. Color % daily % change."
      />
      <div className="grid grid-cols-6 text-[11px] text-muted pb-2 border-b border-border">
        <span>Ticker</span>
        <span className="text-right">Weight</span>
        <span className="text-right">Weight</span>
        <span className="text-right">Momentum</span>
        <span className="text-right">Change</span>
        <span className="text-right">Impact</span>
      </div>
      <div className="divide-y divide-border">
        {rows.map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-6 py-2.5 text-xs font-mono items-center"
          >
            <span className="text-foreground">[{r.t}]</span>
            <span className="text-right text-foreground">{r.w1}</span>
            <span className="text-right text-negative">{r.w2}</span>
            <span className="text-right text-negative">{r.mom}</span>
            <span className="text-right text-accent">{r.chg}</span>
            <span className="text-right text-accent">{r.imp}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
