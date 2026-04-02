import { Performance } from "@/lib/api";

interface Props {
  performances: Performance[];
}

export default function MarketCards({ performances }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {performances.map((p) => {
        const isUp = p.daily_change >= 0;
        return (
          <div
            key={p.symbol}
            className="rounded-2xl bg-surface border border-border p-4 flex flex-col gap-2 hover:border-accent/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {p.symbol}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  isUp
                    ? "bg-accent-dim text-accent"
                    : "bg-negative-dim text-negative"
                }`}
              >
                {isUp ? "+" : ""}
                {p.daily_change_pct.toFixed(2)}%
              </span>
            </div>
            <span className="text-2xl font-bold font-mono text-foreground">
              ${p.current_price.toFixed(2)}
            </span>
            <span
              className={`text-sm font-mono ${
                isUp ? "text-accent" : "text-negative"
              }`}
            >
              {isUp ? "+" : ""}
              {p.daily_change.toFixed(2)} today
            </span>
          </div>
        );
      })}
    </div>
  );
}
