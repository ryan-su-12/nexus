"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/AuthContext";
import {
  getHoldings,
  getMarketData,
  type Holding,
  type Performance,
} from "@/lib/api";
import HeatmapTreemapCard from "@/components/HeatmapTreemapCard";

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


