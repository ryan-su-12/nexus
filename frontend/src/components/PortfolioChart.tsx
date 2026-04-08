"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { HistoryPoint } from "@/lib/api";

interface Props {
  history: HistoryPoint[];
  benchmark?: HistoryPoint[];
  range: number;
  onRangeChange: (days: number) => void;
}

const RANGES = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
];

function formatDate(dateStr: string, days: number) {
  const d = new Date(dateStr);
  if (days <= 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  if (days <= 90)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatValue(value: number) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function PortfolioChart({
  history,
  benchmark,
  range,
  onRangeChange,
}: Props) {
  if (!history.length) return null;

  const first = history[0].value;
  const last = history[history.length - 1].value;
  const totalChange = last - first;
  const totalChangePct = first ? (totalChange / first) * 100 : 0;
  const isUp = totalChange >= 0;
  const color = isUp ? "#00d632" : "#ff5252";
  const benchColor = "#ff5252";

  // Normalize portfolio + benchmark to % change from the first point so they
  // share a single Y-axis and are visually comparable.
  const benchMap = new Map(
    (benchmark ?? []).map((p) => [p.date, p.value] as const)
  );
  const firstBench = benchmark && benchmark.length ? benchmark[0].value : null;

  const data = history.map((h) => {
    const portfolioPct = first ? ((h.value - first) / first) * 100 : 0;
    const bVal = benchMap.get(h.date);
    const benchPct =
      firstBench && bVal ? ((bVal - firstBench) / firstBench) * 100 : null;
    return {
      date: formatDate(h.date, range),
      portfolio: Number(portfolioPct.toFixed(2)),
      benchmark: benchPct !== null ? Number(benchPct.toFixed(2)) : null,
      rawValue: h.value,
    };
  });

  // Benchmark total % for the header chip
  const benchStart = benchmark?.[0]?.value ?? null;
  const benchEnd = benchmark?.[benchmark.length - 1]?.value ?? null;
  const benchPctTotal =
    benchStart && benchEnd
      ? ((benchEnd - benchStart) / benchStart) * 100
      : null;

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted mb-1">Portfolio Value</p>
          <p className="text-3xl font-bold font-mono text-foreground">
            {formatValue(last)}
          </p>
          <div className="flex items-center gap-3 mt-1 text-sm font-mono">
            <span className={isUp ? "text-accent" : "text-negative"}>
              {isUp ? "+" : ""}
              {formatValue(totalChange)} ({isUp ? "+" : ""}
              {totalChangePct.toFixed(2)}%)
            </span>
            {benchPctTotal !== null && (
              <span className="text-muted">
                · S&amp;P{" "}
                <span
                  className={
                    benchPctTotal >= 0 ? "text-accent/80" : "text-negative/80"
                  }
                >
                  {benchPctTotal >= 0 ? "+" : ""}
                  {benchPctTotal.toFixed(2)}%
                </span>
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => onRangeChange(r.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                range === r.days
                  ? "bg-accent text-black"
                  : "text-muted hover:text-foreground hover:bg-surface-light"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#242424"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "#737373", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "#737373", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
            width={52}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#141414",
              border: "1px solid #242424",
              borderRadius: "12px",
              color: "#f5f5f5",
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [
              `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`,
              name === "portfolio" ? "NEXUS" : "S&P 500",
            ]}
            labelStyle={{ color: "#737373", marginBottom: 4 }}
          />
          <Legend
            verticalAlign="top"
            height={24}
            iconType="circle"
            formatter={(value) =>
              value === "portfolio" ? (
                <span className="text-xs text-muted">NEXUS</span>
              ) : (
                <span className="text-xs text-muted">S&amp;P 500</span>
              )
            }
          />
          <Line
            type="monotone"
            dataKey="portfolio"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            name="portfolio"
          />
          {benchmark && benchmark.length > 0 && (
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke={benchColor}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 3, fill: benchColor, strokeWidth: 0 }}
              name="benchmark"
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
