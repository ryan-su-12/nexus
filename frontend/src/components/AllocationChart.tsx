"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { Holding, Performance } from "@/lib/api";

interface Props {
  holdings: Holding[];
  performances: Performance[];
}

const COLORS = [
  "#00d632", "#3b82f6", "#8b5cf6", "#f59e0b",
  "#ec4899", "#06b6d4", "#f97316", "#a855f7",
  "#84cc16", "#14b8a6",
];

const RADIAN = Math.PI / 180;

function renderLabel({ cx, cy, midAngle, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number; outerRadius: number; percent: number;
}) {
  if (percent < 0.03) return null;
  const radius = outerRadius + 26;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#737373"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function AllocationChart({ holdings, performances }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const priceMap: Record<string, number> = {};
  for (const p of performances) priceMap[p.symbol] = p.current_price;

  const valueMap: Record<string, number> = {};
  for (const h of holdings) {
    const price = priceMap[h.symbol];
    if (!price) continue;
    valueMap[h.symbol] = (valueMap[h.symbol] ?? 0) + h.quantity * price;
  }

  const total = Object.values(valueMap).reduce((s, v) => s + v, 0);
  if (total === 0) return null;

  const data = Object.entries(valueMap)
    .map(([symbol, value]) => ({
      name: symbol,
      value: Math.round(value * 100) / 100,
      pct: (value / total) * 100,
    }))
    .sort((a, b) => b.value - a.value);

  const display = activeIndex !== null ? data[activeIndex] : data[0];

  return (
    <div className="rounded-2xl bg-surface border border-border p-6">
      <h2 className="text-base font-semibold">Portfolio Allocation</h2>
      <p className="text-xs text-muted mt-0.5 mb-6">By market value across all accounts</p>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* Chart */}
        <div className="relative flex-shrink-0" style={{ width: 260, height: 260 }}>
          <PieChart width={260} height={260}>
            <Pie
              data={data}
              cx={130}
              cy={130}
              innerRadius={68}
              outerRadius={105}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
              label={renderLabel}
              labelLine={false}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={COLORS[i % COLORS.length]}
                  opacity={activeIndex === null || activeIndex === i ? 1 : 0.35}
                />
              ))}
            </Pie>
          </PieChart>

          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-xs text-muted truncate max-w-[90px]">{display.name}</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {display.pct.toFixed(1)}%
              </p>
              <p className="text-xs text-muted mt-0.5">
                ${display.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 w-full">
          {data.map((item, i) => (
            <div
              key={item.name}
              className="flex items-center gap-3 cursor-default"
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span
                className="h-2 w-2 rounded-full flex-shrink-0 transition-opacity"
                style={{
                  backgroundColor: COLORS[i % COLORS.length],
                  opacity: activeIndex === null || activeIndex === i ? 1 : 0.35,
                }}
              />
              <span className="text-sm text-foreground font-medium w-24 truncate">{item.name}</span>
              <div className="flex-1 h-1 rounded-full bg-surface-light overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${item.pct}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                    opacity: activeIndex === null || activeIndex === i ? 1 : 0.35,
                  }}
                />
              </div>
              <span className="text-xs text-muted w-10 text-right">{item.pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
