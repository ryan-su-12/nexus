import { Performance } from "@/lib/api";

interface Props {
  performances: Performance[];
}

export default function MarketCards({ performances }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {performances.map((p) => {
        const isUp = p.daily_change >= 0;
        return (
          <div
            key={p.symbol}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-1"
          >
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {p.symbol}
            </span>
            <span className="text-xl font-semibold font-mono">
              ${p.current_price.toFixed(2)}
            </span>
            <span
              className={`text-sm font-mono ${
                isUp
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isUp ? "+" : ""}
              {p.daily_change.toFixed(2)} ({isUp ? "+" : ""}
              {p.daily_change_pct.toFixed(2)}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}
