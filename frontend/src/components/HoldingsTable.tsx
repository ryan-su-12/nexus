import { Holding, Performance } from "@/lib/api";

interface Props {
  holdings: Holding[];
  performances: Performance[];
}

export default function HoldingsTable({ holdings, performances }: Props) {
  const perfMap = new Map(performances.map((p) => [p.symbol, p]));

  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="px-5 py-4 font-medium">Symbol</th>
            <th className="px-5 py-4 font-medium">Name</th>
            <th className="px-5 py-4 font-medium text-right">Price</th>
            <th className="px-5 py-4 font-medium text-right">Change</th>
            <th className="px-5 py-4 font-medium text-right">Change %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {holdings.map((h) => {
            const perf = perfMap.get(h.symbol);
            const isUp = perf ? perf.daily_change >= 0 : true;
            const changeColor = perf
              ? isUp
                ? "text-accent"
                : "text-negative"
              : "text-muted";

            return (
              <tr key={h.symbol} className="hover:bg-surface-light transition-colors">
                <td className="px-5 py-4 font-semibold text-foreground">{h.symbol}</td>
                <td className="px-5 py-4 text-muted">{h.name}</td>
                <td className="px-5 py-4 text-right font-mono text-foreground">
                  {perf ? `$${perf.current_price.toFixed(2)}` : "--"}
                </td>
                <td className={`px-5 py-4 text-right font-mono ${changeColor}`}>
                  {perf ? `${isUp ? "+" : ""}${perf.daily_change.toFixed(2)}` : "--"}
                </td>
                <td className={`px-5 py-4 text-right font-mono ${changeColor}`}>
                  {perf ? `${isUp ? "+" : ""}${perf.daily_change_pct.toFixed(2)}%` : "--"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
