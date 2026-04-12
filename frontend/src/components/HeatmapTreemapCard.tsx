import type { Holding, Performance } from "@/lib/api";

/* ── Heatmap Treemap ──
   Sector-grouped treemap. Holdings are bucketed into the 11 GICS
   sectors. Tile size = market-value weight, color = daily %
   change (green pos / red neg, alpha scales with magnitude).

   Index funds / ETFs: classified via SECTOR_OVERRIDES. Broad-market
   funds (VFV, VOO, SPY...) land in a "Diversified" bucket. Sector
   ETFs (ZEB → Financials) map to their dominant sector. */
export default function HeatmapTreemapCard({
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

  type Bucket = {
    name: string;
    size: number;
    weightedChangeNumer: number;
    positions: Position[];
  };

  const CORE_SECTOR_SET = new Set<string>(
    GICS_SECTORS.filter((s) => s !== "Other" && s !== "Diversified")
  );

  const bucketMap = new Map<string, Bucket>();
  for (const p of positions) {
    const weights = sectorWeightsFor(p.symbol);
    for (const [rawSector, w] of Object.entries(weights) as [string, number][]) {
      const sector = CORE_SECTOR_SET.has(rawSector) ? rawSector : "Other";
      const allocated = p.value * w;
      const b = bucketMap.get(sector) ?? {
        name: sector,
        size: 0,
        weightedChangeNumer: 0,
        positions: [],
      };
      b.size += allocated;
      b.weightedChangeNumer += allocated * p.changePct;
      if (!b.positions.find((x) => x.symbol === p.symbol) && w >= 0.5) {
        b.positions.push(p);
      }
      bucketMap.set(sector, b);
    }
  }

  for (const b of bucketMap.values()) {
    b.positions.sort((a, b) => b.value - a.value);
  }

  const hasData = bucketMap.size > 0 && total > 0;

  const N = 11;
  const hhi = Array.from(bucketMap.values()).reduce(
    (s, b) => s + Math.pow(total ? b.size / total : 0, 2),
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

  const colorFor = (pct: number) => {
    const clamped = Math.max(-5, Math.min(5, pct));
    const intensity = Math.abs(clamped) / 5;
    const alpha = 0.25 + intensity * 0.65;
    return pct >= 0
      ? `rgba(0, 214, 50, ${alpha})`
      : `rgba(255, 82, 82, ${alpha})`;
  };

  type SectorTile = {
    name: string;
    weightPct: number;
    changePct: number;
    positions: Position[];
  };

  const CORE_SECTORS = GICS_SECTORS.filter(
    (s) => s !== "Other" && s !== "Diversified"
  );
  const extras = (["Other"] as const).filter((s) => bucketMap.has(s));
  const tiles: SectorTile[] = [...CORE_SECTORS, ...extras].map((name) => {
    const b = bucketMap.get(name);
    return {
      name,
      weightPct: b && total ? (b.size / total) * 100 : 0,
      changePct: b && b.size ? b.weightedChangeNumer / b.size : 0,
      positions: b ? b.positions : [],
    };
  });

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Sector Heatmap Treemap</p>
          <p className="text-[11px] text-muted mt-0.5">Size = weight · Color = daily % change · Grouped by sector</p>
        </div>
        {hasData && (
          <div className="flex flex-col items-center">
            <DiversificationGauge value={diversification} color={divColor} />
            <p
              className="text-[8px] font-semibold tracking-widest mt-0.5"
              style={{ color: divColor }}
            >
              {divLabel}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1.5 auto-rows-[72px]">
        {tiles.map((t) => {
          const hasPos = t.weightPct > 0;
          const fill = hasPos ? colorFor(t.changePct) : "rgba(82,82,82,0.18)";
          const border = hasPos
            ? "border-transparent"
            : "border-dashed border-border";
          const topHoldings = t.positions.slice(0, 2);
          return (
            <div
              key={t.name}
              className={`relative rounded-lg border ${border} p-2 flex flex-col justify-between overflow-hidden`}
              style={{ backgroundColor: fill }}
              title={`${t.name} · ${t.weightPct.toFixed(1)}% · ${
                t.changePct >= 0 ? "+" : ""
              }${t.changePct.toFixed(2)}%`}
            >
              <div>
                <p className="text-[8px] font-semibold tracking-wider text-white/70 uppercase leading-tight">
                  {t.name}
                </p>
                {hasPos && (
                  <p className="text-[9px] font-mono mt-0.5 text-white">
                    {t.changePct >= 0 ? "+" : ""}
                    {t.changePct.toFixed(2)}%
                  </p>
                )}
              </div>
              <div>
                {hasPos ? (
                  <>
                    <p className="text-sm font-bold font-mono text-white leading-none">
                      {t.weightPct.toFixed(1)}%
                    </p>
                    <p className="text-[9px] font-mono text-white/70 mt-0.5 truncate">
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
    </div>
  );
}

function DiversificationGauge({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  const r = 34;
  const circ = Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div className="relative h-12 w-16">
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
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-0.5">
        <span className="text-xs font-bold font-mono" style={{ color }}>
          {value}
          <span className="text-[9px] text-muted">/100</span>
        </span>
      </div>
    </div>
  );
}

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
  AAPL: "Information Technology",
  MSFT: "Information Technology",
  NVDA: "Information Technology",
  "NVDA.TO": "Information Technology",
  "NVDA.NE": "Information Technology",
  "NVDA.NEO": "Information Technology",
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
  VOO: "Diversified",
  VTI: "Diversified",
  SPY: "Diversified",
  IVV: "Diversified",
  QQQ: "Information Technology",
  "VFV.TO": "Diversified",
  "VSP.TO": "Diversified",
  "XIC.TO": "Diversified",
  "VUN.TO": "Diversified",
  "XEQT.TO": "Diversified",
  "VEQT.TO": "Diversified",
  "ZEB.TO": "Financials",
  "XFN.TO": "Financials",
  "XIT.TO": "Information Technology",
  "XHC.TO": "Health Care",
  "XEG.TO": "Energy",
  "ZUB.TO": "Financials",
  BTC: "Other",
  ETH: "Other",
  "BTC-USD": "Other",
  "ETH-USD": "Other",
};

function sectorFor(symbol: string): (typeof GICS_SECTORS)[number] {
  const s = symbol.trim().toUpperCase();
  const override = SECTOR_OVERRIDES[s];
  if (override) return override;
  if (s.endsWith(".TO") && /BANK|FIN|ZEB|XFN/.test(s)) return "Financials";
  if (/USD|BTC|ETH|COIN/.test(s)) return "Other";
  return "Other";
}

const SP500_SECTOR_WEIGHTS: Record<string, number> = (() => {
  const raw: Record<string, number> = {
    "Information Technology": 0.30,
    "Financials": 0.13,
    "Health Care": 0.11,
    "Consumer Discretionary": 0.10,
    "Communication Services": 0.09,
    "Industrials": 0.08,
    "Consumer Staples": 0.06,
    "Energy": 0.035,
    "Utilities": 0.025,
    "Real Estate": 0.022,
    "Materials": 0.018,
  };
  const sum = Object.values(raw).reduce((a, b) => a + b, 0);
  const norm: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) norm[k] = v / sum;
  return norm;
})();

const BROAD_MARKET_ROOTS = new Set([
  "VOO", "VTI", "SPY", "IVV",
  "VFV", "VSP", "VUN", "XIC", "XEQT", "VEQT", "VGRO", "VBAL",
  "XAW", "XUU", "VUS", "ZSP", "ZEA",
]);

function sectorWeightsFor(symbol: string): Record<string, number> {
  const s = symbol.trim().toUpperCase();
  const root = s.split(".")[0];
  if (BROAD_MARKET_ROOTS.has(root)) return { ...SP500_SECTOR_WEIGHTS };
  const sector = sectorFor(s);
  if (sector === "Diversified") return { ...SP500_SECTOR_WEIGHTS };
  return { [sector]: 1 };
}
