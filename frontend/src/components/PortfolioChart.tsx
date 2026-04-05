"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { HistoryPoint } from "@/lib/api";

interface Props {
  history: HistoryPoint[];
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
  if (days <= 90) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatValue(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PortfolioChart({ history, range, onRangeChange }: Props) {
  if (!history.length) return null;

  const first = history[0].value;
  const last = history[history.length - 1].value;
  const totalChange = last - first;
  const totalChangePct = first ? ((totalChange / first) * 100) : 0;
  const isUp = totalChange >= 0;
  const color = isUp ? "#00d632" : "#ff5252";


  const data = history.map((h) => ({
    ...h,
    date: formatDate(h.date, range),
  }));

  return (
    <div className="rounded-2xl bg-surface border border-border p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-muted mb-1">Portfolio Value</p>
          <p className="text-3xl font-bold font-mono text-foreground">
            {formatValue(last)}
          </p>
          <p className={`text-sm font-mono mt-1 ${isUp ? "text-accent" : "text-negative"}`}>
            {isUp ? "+" : ""}{formatValue(totalChange)} ({isUp ? "+" : ""}{totalChangePct.toFixed(2)}%)
          </p>
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

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#242424" strokeDasharray="3 3" vertical={false} />
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
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={48}
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
            formatter={(value) => [formatValue(Number(value)), "Value"]}
            labelStyle={{ color: "#737373", marginBottom: 4 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#chartGradient)"
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
