"use client";

import useSWR from "swr";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "@/lib/AuthContext";
import {
  getHoldings,
  getMarketData,
  type Holding,
  type Performance,
} from "@/lib/api";

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

  const { data: marketData } = useSWR(
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
          <HeatmapTreemapCard
            holdings={holdingsData?.holdings ?? []}
            performances={marketData?.performances ?? []}
          />
        </div>
        <CorrelationExplorerCard />
      </div>

      {/* Attribution factors table */}
      <AttributionFactorsCard
        holdings={holdingsData?.holdings ?? []}
        performances={marketData?.performances ?? []}
      />
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
   Dynamic Recharts treemap. Each tile's size = position weight
   (market value as % of portfolio). Color = daily % change
   (green positive / red negative, intensity scales with magnitude). */
function HeatmapTreemapCard({
  holdings,
  performances,
}: {
  holdings: Holding[];
  performances: Performance[];
}) {
  const perfMap = new Map(performances.map((p) => [p.symbol, p] as const));

  // Aggregate across accounts (sum quantities per symbol)
  const qtyBySymbol = new Map<string, number>();
  for (const h of holdings) {
    qtyBySymbol.set(h.symbol, (qtyBySymbol.get(h.symbol) ?? 0) + h.quantity);
  }

  type Node = {
    name: string;
    size: number;
    changePct: number;
    weightPct: number;
  };

  const nodes: Node[] = [];
  let total = 0;
  for (const [symbol, qty] of qtyBySymbol) {
    const perf = perfMap.get(symbol);
    if (!perf) continue;
    const value = qty * perf.current_price;
    total += value;
    nodes.push({ name: symbol, size: value, changePct: perf.daily_change_pct, weightPct: 0 });
  }
  for (const n of nodes) n.weightPct = total ? (n.size / total) * 100 : 0;
  nodes.sort((a, b) => b.size - a.size);

  const hasData = nodes.length > 0;

  // Map daily % change → heat color (clamped at ±5%)
  const colorFor = (pct: number) => {
    const clamped = Math.max(-5, Math.min(5, pct));
    const intensity = Math.abs(clamped) / 5;
    const alpha = 0.25 + intensity * 0.65;
    return pct >= 0
      ? `rgba(0, 214, 50, ${alpha})`
      : `rgba(255, 82, 82, ${alpha})`;
  };

  return (
    <Card>
      <CardHeader
        title="Heatmap Treemap"
        subtitle="Size corresponds to position weight. Color = daily % change."
      />
      {!hasData ? (
        <div className="h-[460px] flex items-center justify-center text-sm text-muted">
          No holdings data yet
        </div>
      ) : (
        <div className="h-[460px]">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={nodes}
              dataKey="size"
              nameKey="name"
              stroke="#0a0a0a"
              isAnimationActive={false}
              content={<TreemapTile colorFor={colorFor} />}
            >
              <Tooltip
                contentStyle={{
                  backgroundColor: "#141414",
                  border: "1px solid #242424",
                  borderRadius: "12px",
                  fontSize: 12,
                }}
                formatter={((_v: unknown, _n: unknown, entry: { payload?: Partial<Node> & { root?: Node } }) => {
                  // In Treemap, the leaf data is under payload.root
                  const n = entry.payload?.root ?? entry.payload;
                  if (!n || typeof n.changePct !== "number") return ["", ""];
                  return [
                    `${(n.weightPct ?? 0).toFixed(1)}% weight · ${
                      n.changePct >= 0 ? "+" : ""
                    }${n.changePct.toFixed(2)}%`,
                    n.name ?? "",
                  ];
                }) as never}
                labelStyle={{ display: "none" }}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

/* Custom tile renderer for the treemap.
   Recharts Treemap spreads the node's data fields as top-level
   props (changePct, weightPct), not under `payload`. */
function TreemapTile(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  changePct?: number;
  weightPct?: number;
  depth?: number;
  colorFor?: (pct: number) => string;
}) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    name = "",
    changePct,
    weightPct,
    depth = 0,
    colorFor,
  } = props;

  // Recharts renders a root tile at depth 0 that covers the whole
  // chart — skip drawing it so tiles don't stack on top of each other.
  if (depth === 0) return null;

  const hasPct = typeof changePct === "number";
  const fill = hasPct && colorFor ? colorFor(changePct!) : "rgba(82,82,82,0.5)";
  // Inset each tile slightly so they look separated rather than
  // filling the whole bounding box uniformly.
  const pad = 3;
  const rx = 6;
  const showLabel = width > 54 && height > 32;
  const showPct = width > 70 && height > 52;

  return (
    <g>
      <rect
        x={x + pad}
        y={y + pad}
        width={Math.max(0, width - pad * 2)}
        height={Math.max(0, height - pad * 2)}
        fill={fill}
        stroke="#0a0a0a"
        strokeWidth={1}
        rx={rx}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showPct ? 6 : 0)}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={Math.min(15, Math.max(10, Math.sqrt(width * height) / 9))}
          fontWeight={600}
        >
          [{name}]
        </text>
      )}
      {showPct && typeof weightPct === "number" && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 12}
          textAnchor="middle"
          fill="rgba(255,255,255,0.9)"
          fontSize={11}
          fontFamily="ui-monospace, monospace"
        >
          {weightPct.toFixed(0)}%
        </text>
      )}
    </g>
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
function AttributionFactorsCard({
  holdings,
  performances,
}: {
  holdings: Holding[];
  performances: Performance[];
}) {
  const perfMap = new Map(performances.map((p) => [p.symbol, p] as const));

  // Aggregate across accounts
  const qtyBySymbol = new Map<string, number>();
  for (const h of holdings) {
    qtyBySymbol.set(h.symbol, (qtyBySymbol.get(h.symbol) ?? 0) + h.quantity);
  }

  type Row = {
    t: string;
    weight: number; // portfolio weight %
    value: number; // market value $
    chgPct: number; // daily %
    impact: number; // daily $ contribution
  };

  const raw: Row[] = [];
  let total = 0;
  for (const [symbol, qty] of qtyBySymbol) {
    const perf = perfMap.get(symbol);
    if (!perf) continue;
    const value = qty * perf.current_price;
    const impact = qty * perf.daily_change;
    total += value;
    raw.push({
      t: symbol,
      weight: 0,
      value,
      chgPct: perf.daily_change_pct,
      impact,
    });
  }
  for (const r of raw) r.weight = total ? (r.value / total) * 100 : 0;
  raw.sort((a, b) => b.weight - a.weight);

  const fmtMoney = (v: number) => {
    const sign = v >= 0 ? "" : "-";
    const abs = Math.abs(v);
    if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
    return `${sign}$${abs.toFixed(0)}`;
  };
  const fmtPct = (v: number) =>
    `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
  return (
    <Card>
      <CardHeader
        title="Attribution Factors (e.g., Value, Growth, Momentum)"
        subtitle="Size corresponds to position weight. Color % daily % change."
      />
      <div className="grid grid-cols-5 text-[11px] text-muted pb-2 border-b border-border">
        <span>Ticker</span>
        <span className="text-right">Weight</span>
        <span className="text-right">Value</span>
        <span className="text-right">Change</span>
        <span className="text-right">Impact</span>
      </div>
      {raw.length === 0 ? (
        <p className="text-xs text-muted py-6 text-center">
          No holdings data yet
        </p>
      ) : (
        <div className="divide-y divide-border">
          {raw.map((r, i) => {
            const up = r.chgPct >= 0;
            const color = up ? "text-accent" : "text-negative";
            return (
              <div
                key={i}
                className="grid grid-cols-5 py-2.5 text-xs font-mono items-center"
              >
                <span className="text-foreground">[{r.t}]</span>
                <span className="text-right text-foreground">
                  {r.weight.toFixed(1)}%
                </span>
                <span className="text-right text-muted">
                  {fmtMoney(r.value)}
                </span>
                <span className={`text-right ${color}`}>
                  {fmtPct(r.chgPct)}
                </span>
                <span className={`text-right ${color}`}>
                  {fmtMoney(r.impact)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
