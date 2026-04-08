"use client";

/* ──────────────────────────────────────────────────────────────
   Analytics — Portfolio Health & Risk Assessment
   ┌──────────────────────────────────────────┐
   │ Header   [Portfolio Gauges ▾]            │
   ├──────────────────┬───────────────────────┤
   │ Concentration    │ Concentration Risk    │
   │ Risk             │                       │
   ├──────────────────┼───────────────────────┤
   │ Sensitivity      │ Sensitivity (What-if) │
   ├──────────────────┼───────────────────────┤
   │ Risk Scores      │ Recommended Actions   │
   │ VaR Analysis     │ Stress Test Scenarios │
   └──────────────────┴───────────────────────┘
   ────────────────────────────────────────── */

export default function AnalyticsPage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          PORTFOLIO HEALTH &amp; RISK ASSESSMENT
        </h1>
        <button className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs text-foreground hover:border-accent/40 transition-colors">
          Portfolio Gauges
          <span className="text-muted">▾</span>
        </button>
      </div>

      {/* Concentration risk row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ConcentrationRiskCard sectorPct={38} stockPct={18} sectorLabel="Tech 38%" stockLabel="[NVDA] 18%" />
        <ConcentrationRiskCard sectorPct={36} stockPct={18} sectorLabel="Tech 36%" stockLabel="[NVDA] 10%" />
      </div>

      {/* Sensitivity row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SensitivityCard />
        <SensitivityWhatIfCard />
      </div>

      {/* Bottom row: risk scores / VaR  +  actions / stress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-5">
          <RiskScoresCard />
          <VaRAnalysisCard />
        </div>
        <div className="space-y-5">
          <RecommendedActionsCard />
          <StressTestScenariosCard />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Shared
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-muted">
        {children}
      </p>
      <button className="text-muted hover:text-foreground text-sm">⋮</button>
    </div>
  );
}

/* ── Donut gauge (SVG) ── */
function DonutGauge({
  pct,
  color,
  label,
  valueLabel,
}: {
  pct: number;
  color: string;
  label: string;
  valueLabel: string;
}) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-muted tracking-wider">{label}</span>
          <span
            className="text-sm font-bold font-mono"
            style={{ color }}
          >
            {valueLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Concentration Risk ── */
function ConcentrationRiskCard({
  sectorPct,
  stockPct,
  sectorLabel,
  stockLabel,
}: {
  sectorPct: number;
  stockPct: number;
  sectorLabel: string;
  stockLabel: string;
}) {
  return (
    <Card>
      <SectionLabel>Concentration Risk</SectionLabel>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-2">
          <DonutGauge
            pct={sectorPct}
            color="#22c55e"
            label="SECTOR"
            valueLabel={`${sectorPct}%`}
          />
          <p className="text-xs text-muted">{sectorLabel}</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <DonutGauge
            pct={stockPct}
            color="#ef4444"
            label="STOCK"
            valueLabel={`${stockPct}%`}
          />
          <p className="text-xs text-muted">{stockLabel}</p>
        </div>
      </div>
    </Card>
  );
}

/* ── Sensitivity Analysis (candlestick placeholder) ── */
function SensitivityCard() {
  const candles = Array.from({ length: 28 }, (_, i) => {
    const up = Math.sin(i * 0.7) > -0.1;
    const h = 20 + Math.abs(Math.sin(i * 0.5)) * 55;
    const y = 40 + Math.sin(i * 0.4) * 15;
    return { up, h, y };
  });
  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <SectionLabel>Sensitivity Analysis</SectionLabel>
        <div className="flex items-center gap-1.5 -mt-2">
          <span className="text-[10px] text-muted">What if</span>
          <span className="h-3 w-6 rounded-full bg-surface-light relative">
            <span className="absolute h-2.5 w-2.5 rounded-full bg-muted top-[1px] left-[1px]" />
          </span>
        </div>
      </div>
      <p className="text-xs text-muted mb-2">
        What if... <span className="text-foreground">[CRUDE OIL]</span>{" "}
        <span className="text-accent">+16% ↑</span>
      </p>
      <div className="h-40 rounded-lg bg-surface-light border border-border p-2 relative overflow-hidden">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {candles.map((c, i) => {
            const x = 5 + i * 7;
            return (
              <g key={i}>
                <line
                  x1={x + 2}
                  x2={x + 2}
                  y1={c.y - 5}
                  y2={c.y + c.h / 2 + 5}
                  stroke={c.up ? "#22c55e" : "#ef4444"}
                  strokeWidth="0.5"
                />
                <rect
                  x={x}
                  y={c.y}
                  width="4"
                  height={c.h / 2}
                  fill={c.up ? "#22c55e" : "#ef4444"}
                />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-2 text-[10px] text-muted">
          <span>Jan</span>
          <span>Mid</span>
        </div>
        <button className="text-[11px] rounded-md border border-border px-3 py-1 text-muted hover:text-foreground">
          More ▾
        </button>
      </div>
    </Card>
  );
}

/* ── Sensitivity (What-if projection) ── */
function SensitivityWhatIfCard() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <SectionLabel>Sensitivity Analysis</SectionLabel>
        <div className="flex items-center gap-1.5 -mt-2">
          <span className="text-[10px] text-muted">What if</span>
          <span className="h-3 w-6 rounded-full bg-accent/40 relative">
            <span className="absolute h-2.5 w-2.5 rounded-full bg-accent top-[1px] right-[1px]" />
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted">
          What if... <span className="text-foreground">[CRUDE OIL]</span>{" "}
          <span className="text-accent">+16% ↑</span>
        </p>
        <span className="text-[10px] rounded-md bg-accent-dim text-accent px-2 py-0.5">
          +10% ↑
        </span>
      </div>
      <div className="h-40 rounded-lg bg-surface-light border border-border p-2 relative overflow-hidden">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {/* cone of uncertainty */}
          <polygon
            points="10,60 200,20 200,100"
            fill="rgba(34,197,94,0.12)"
            stroke="none"
          />
          <polygon
            points="10,60 200,45 200,75"
            fill="rgba(239,68,68,0.18)"
            stroke="none"
          />
          <polyline
            points="10,60 40,58 80,55 120,52 160,48 200,45"
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.2"
          />
          <polyline
            points="10,60 40,62 80,65 120,67 160,70 200,72"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.2"
          />
        </svg>
        <div className="absolute right-3 top-3 text-right">
          <p className="text-[9px] text-muted">impact score</p>
          <p className="text-sm font-mono text-negative">-0.45%</p>
        </div>
      </div>
      <div className="flex gap-6 text-[10px] text-muted mt-2">
        <span>Jan</span>
        <span>Jun</span>
        <span>Dec</span>
      </div>
    </Card>
  );
}

/* ── Risk Scores (beta gauge + metrics) ── */
function RiskScoresCard() {
  return (
    <Card>
      <SectionLabel>Risk Scores</SectionLabel>
      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="flex flex-col items-center">
          <div className="relative h-24 w-28">
            <svg viewBox="0 0 100 60" className="h-full w-full">
              <path
                d="M10,55 A40,40 0 0,1 90,55"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M10,55 A40,40 0 0,1 70,20"
                fill="none"
                stroke="#22c55e"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <line
                x1="50"
                y1="55"
                x2="72"
                y2="22"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="50" cy="55" r="2.5" fill="#ffffff" />
            </svg>
          </div>
          <p className="text-[10px] text-muted mt-1">Beta</p>
          <div className="flex gap-6 text-[10px] text-muted mt-0.5">
            <span>Low</span>
            <span>10%</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-[11px] text-muted">Beta</span>
            <span className="text-base font-mono text-accent">5.70</span>
          </div>
          <div className="flex items-start justify-between">
            <span className="text-[11px] text-muted">Volatility</span>
            <span className="text-base font-mono text-accent">3.3</span>
          </div>
          <div className="flex items-start justify-between">
            <span className="text-[11px] text-muted">Beta</span>
            <span className="text-base font-mono text-negative">3.3</span>
          </div>
          <div className="flex items-start justify-between">
            <span className="text-[11px] text-muted">Volatility</span>
            <span className="text-base font-mono text-negative">2.5</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ── Value at Risk ── */
function VaRAnalysisCard() {
  return (
    <Card>
      <p className="text-sm font-semibold text-foreground">
        Value at Risk (VaR) Analysis
      </p>
      <p className="text-[11px] text-muted mt-0.5 mb-3">
        Concentration assessment and context analysis.
      </p>
      <ul className="space-y-1.5 text-xs text-muted">
        <li>- Value at Risk (VaR) surge</li>
        <li>- Value at Risk (VaR) analyst</li>
      </ul>
    </Card>
  );
}

/* ── Recommended Actions ── */
function RecommendedActionsCard() {
  const actions = [
    "Rebalance: Trim [NVDA]",
    "Rebalance: Req [NVBL]",
    "Rebalance: Req [NVBA]",
  ];
  return (
    <Card>
      <SectionLabel>Recommended Actions</SectionLabel>
      <div className="space-y-2">
        {actions.map((a, i) => (
          <button
            key={i}
            className="w-full text-left rounded-lg border border-border bg-surface-light px-3 py-2.5 text-xs text-foreground hover:border-accent/40 transition-colors"
          >
            {a}
          </button>
        ))}
        <button className="w-full rounded-lg border border-accent/40 bg-accent-dim px-3 py-2.5 text-xs font-semibold text-accent hover:bg-accent/20 transition-colors">
          Execution
        </button>
      </div>
    </Card>
  );
}

/* ── Stress Test Scenarios ── */
function StressTestScenariosCard() {
  const scenarios = ["Market Crash 200h", "Inflation Surge"];
  return (
    <Card>
      <SectionLabel>Stress Test Scenarios</SectionLabel>
      <div className="space-y-2">
        {scenarios.map((s, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-surface-light px-3 py-2.5 text-xs text-foreground"
          >
            {s}
          </div>
        ))}
      </div>
    </Card>
  );
}
