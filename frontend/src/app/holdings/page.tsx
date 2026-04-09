"use client";

import useSWR from "swr";
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
        <h1 className="text-2xl font-bold tracking-tight">DIVERSIFICATION INDEX</h1>
        <button className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs text-foreground hover:border-accent/40 transition-colors">
          Deep Dive analysis
          <span className="text-muted">▾</span>
        </button>
      </div>

      {/* Sector heatmap treemap */}
      <HeatmapTreemapCard
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
   Sector-grouped treemap. Holdings are bucketed into the 11 GICS
   sectors. Tile size = market-value weight, color = daily %
   change (green pos / red neg, alpha scales with magnitude).

   Index funds / ETFs: classified via SECTOR_OVERRIDES. Broad-market
   funds (VFV, VOO, SPY...) land in a "Diversified" bucket. Sector
   ETFs (ZEB → Financials) map to their dominant sector. */
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

  type Position = {
    symbol: string;
    value: number;
    changePct: number;
    sector: string;
  };

  const positions: Position[] = [];
  let total = 0;
  for (const [symbol, qty] of qtyBySymbol) {
    const perf = perfMap.get(symbol);
    if (!perf) continue;
    const value = qty * perf.current_price;
    total += value;
    positions.push({
      symbol,
      value,
      changePct: perf.daily_change_pct,
      sector: sectorFor(symbol),
    });
  }

  // Group into sector buckets
  type Bucket = {
    name: string; // sector name
    size: number; // total market value
    weightPct: number;
    weightedChangePct: number; // value-weighted daily %
    positions: Position[];
  };

  const bucketMap = new Map<string, Bucket>();
  for (const p of positions) {
    const b = bucketMap.get(p.sector) ?? {
      name: p.sector,
      size: 0,
      weightPct: 0,
      weightedChangePct: 0,
      positions: [],
    };
    b.size += p.value;
    b.weightedChangePct += p.value * p.changePct; // accumulate numerator
    b.positions.push(p);
    bucketMap.set(p.sector, b);
  }

  const buckets = Array.from(bucketMap.values()).map((b) => ({
    ...b,
    weightPct: total ? (b.size / total) * 100 : 0,
    weightedChangePct: b.size ? b.weightedChangePct / b.size : 0,
    positions: b.positions.sort((a, b) => b.value - a.value),
  }));
  buckets.sort((a, b) => b.size - a.size);

  const hasData = buckets.length > 0;

  // Diversification index: Herfindahl-based. Score = 100 means
  // perfectly even distribution across the 11 sectors; score → 0
  // as the portfolio concentrates in one sector.
  const N = 11;
  const hhi = buckets.reduce(
    (s, b) => s + Math.pow(b.weightPct / 100, 2),
    0
  );
  const minHHI = 1 / N;
  const diversification = hasData
    ? Math.max(0, Math.min(100, Math.round(((1 - hhi) / (1 - minHHI)) * 100)))
    : 0;
  const divLabel =
    diversification >= 80
      ? "HIGH"
      : diversification >= 50
      ? "MODERATE"
      : "LOW";
  const divColor =
    diversification >= 80
      ? "#22c55e"
      : diversification >= 50
      ? "#eab308"
      : "#ef4444";

  // Map daily % change → heat color (clamped at ±5%)
  const colorFor = (pct: number) => {
    const clamped = Math.max(-5, Math.min(5, pct));
    const intensity = Math.abs(clamped) / 5;
    const alpha = 0.25 + intensity * 0.65;
    return pct >= 0
      ? `rgba(0, 214, 50, ${alpha})`
      : `rgba(255, 82, 82, ${alpha})`;
  };

  // Show all 11 GICS sectors, even empty ones, so the user sees
  // full coverage of the market.
  type SectorTile = {
    name: string;
    weightPct: number;
    changePct: number;
    positions: Position[];
  };

  const CORE_SECTORS = GICS_SECTORS.filter(
    (s) => s !== "Other" && s !== "Diversified"
  );
  const tiles: SectorTile[] = CORE_SECTORS.map((name) => {
    const b = bucketMap.get(name);
    return {
      name,
      weightPct: b && total ? (b.size / total) * 100 : 0,
      changePct: b && b.size ? b.weightedChangePct : 0,
      positions: b ? b.positions.sort((x, y) => y.value - x.value) : [],
    };
  });

  return (
    <Card>
      {/* Header: title + diversification gauge */}
      <div className="flex items-start justify-between mb-5">
        <CardHeader
          title="Sector Heatmap Treemap"
          subtitle="Size = weight · Color = daily % change · Grouped by sector"
        />
        {hasData && (
          <div className="flex flex-col items-center">
            <DiversificationGauge
              value={diversification}
              color={divColor}
            />
            <p
              className="text-[10px] font-semibold tracking-widest mt-1"
              style={{ color: divColor }}
            >
              {divLabel}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 auto-rows-[120px]">
        {tiles.map((t) => {
          const hasPos = t.positions.length > 0;
          const fill = hasPos ? colorFor(t.changePct) : "rgba(82,82,82,0.18)";
          const border = hasPos
            ? "border-transparent"
            : "border-dashed border-border";
          const topHoldings = t.positions.slice(0, 2);
          return (
            <div
              key={t.name}
              className={`relative rounded-xl border ${border} p-3 flex flex-col justify-between overflow-hidden`}
              style={{ backgroundColor: fill }}
              title={`${t.name} · ${t.weightPct.toFixed(1)}% · ${
                t.changePct >= 0 ? "+" : ""
              }${t.changePct.toFixed(2)}%`}
            >
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-white/70 uppercase leading-tight">
                  {t.name}
                </p>
                {hasPos && (
                  <p
                    className={`text-[11px] font-mono mt-1 ${
                      t.changePct >= 0 ? "text-white" : "text-white"
                    }`}
                  >
                    {t.changePct >= 0 ? "+" : ""}
                    {t.changePct.toFixed(2)}%
                  </p>
                )}
              </div>
              <div>
                {hasPos ? (
                  <>
                    <p className="text-lg font-bold font-mono text-white leading-none">
                      {t.weightPct.toFixed(1)}%
                    </p>
                    <p className="text-[10px] font-mono text-white/70 mt-1 truncate">
                      {topHoldings.map((p) => p.symbol).join(" · ")}
                      {t.positions.length > 2 &&
                        ` +${t.positions.length - 2}`}
                    </p>
                  </>
                ) : (
                  <p className="text-[10px] text-muted font-mono">— no exposure</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!hasData && (
        <p className="text-xs text-muted text-center mt-4">
          No holdings data yet
        </p>
      )}
    </Card>
  );
}

/* ── Diversification gauge (half-circle SVG) ── */
function DiversificationGauge({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  const r = 34;
  const circ = Math.PI * r; // half circumference
  const dash = (value / 100) * circ;
  return (
    <div className="relative h-20 w-28">
      <svg viewBox="0 0 100 60" className="h-full w-full">
        <path
          d={`M 10 55 A ${r} ${r} 0 0 1 90 55`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={`M 10 55 A ${r} ${r} 0 0 1 90 55`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <span className="text-lg font-bold font-mono" style={{ color }}>
          {value}
          <span className="text-xs text-muted">/100</span>
        </span>
      </div>
    </div>
  );
}

/* ── Sector classification ──
   Maps tickers to one of the 11 GICS sectors. Unknown tickers fall
   through to "Other". Index/sector ETFs are overridden explicitly. */
const GICS_SECTORS = [
  "Information Technology",
  "Health Care",
  "Financials",
  "Consumer Discretionary",
  "Communication Services",
  "Industrials",
  "Consumer Staples",
  "Energy",
  "Utilities",
  "Real Estate",
  "Materials",
  "Diversified",
  "Other",
] as const;

const SECTOR_OVERRIDES: Record<string, (typeof GICS_SECTORS)[number]> = {
  // ── US mega-caps / common single-names ──
  AAPL: "Information Technology",
  MSFT: "Information Technology",
  NVDA: "Information Technology",
  GOOGL: "Communication Services",
  GOOG: "Communication Services",
  META: "Communication Services",
  NFLX: "Communication Services",
  AMZN: "Consumer Discretionary",
  TSLA: "Consumer Discretionary",
  HD: "Consumer Discretionary",
  SHOP: "Information Technology",
  "SHOP.TO": "Information Technology",
  PLTR: "Industrials",
  "PLTR.TO": "Industrials",
  AMD: "Information Technology",
  INTC: "Information Technology",
  CRM: "Information Technology",
  ORCL: "Information Technology",
  JPM: "Financials",
  BAC: "Financials",
  WFC: "Financials",
  GS: "Financials",
  V: "Financials",
  MA: "Financials",
  BRK: "Financials",
  "BRK.B": "Financials",
  JNJ: "Health Care",
  UNH: "Health Care",
  LLY: "Health Care",
  PFE: "Health Care",
  XOM: "Energy",
  CVX: "Energy",
  KO: "Consumer Staples",
  PEP: "Consumer Staples",
  WMT: "Consumer Staples",
  PG: "Consumer Staples",
  DIS: "Communication Services",
  BA: "Industrials",
  CAT: "Industrials",
  GE: "Industrials",
  T: "Communication Services",
  VZ: "Communication Services",

  // ── Broad-market ETFs → Diversified ──
  VOO: "Diversified",
  VTI: "Diversified",
  SPY: "Diversified",
  IVV: "Diversified",
  QQQ: "Information Technology", // Nasdaq-100 is tech-heavy
  "VFV.TO": "Diversified", // Vanguard S&P 500 (CAD)
  "VSP.TO": "Diversified",
  "XIC.TO": "Diversified",
  "VUN.TO": "Diversified",
  "XEQT.TO": "Diversified",
  "VEQT.TO": "Diversified",

  // ── Sector ETFs → their dominant sector ──
  "ZEB.TO": "Financials", // BMO Equal Weight Banks
  "XFN.TO": "Financials",
  "XIT.TO": "Information Technology",
  "XHC.TO": "Health Care",
  "XEG.TO": "Energy",
  "ZUB.TO": "Financials",

  // ── Crypto → Other ──
  BTC: "Other",
  ETH: "Other",
  "BTC-USD": "Other",
  "ETH-USD": "Other",
};

function sectorFor(symbol: string): (typeof GICS_SECTORS)[number] {
  const override = SECTOR_OVERRIDES[symbol];
  if (override) return override;
  // Heuristic fallbacks for common ETF naming patterns
  const s = symbol.toUpperCase();
  if (s.endsWith(".TO") && /BANK|FIN|ZEB|XFN/.test(s)) return "Financials";
  if (/USD|BTC|ETH|COIN/.test(s)) return "Other";
  return "Other";
}

