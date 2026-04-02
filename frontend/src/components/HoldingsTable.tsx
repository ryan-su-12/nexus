import { Holding, Performance } from "@/lib/api";

interface Props {
  holdings: Holding[];
  performances: Performance[];
}

export default function HoldingsTable({ holdings, performances }: Props) {
  const perfMap = new Map(performances.map((p) => [p.symbol, p]));

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-900 text-left text-zinc-500 dark:text-zinc-400">
            <th className="px-4 py-3 font-medium">Symbol</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium text-right">Price</th>
            <th className="px-4 py-3 font-medium text-right">Change</th>
            <th className="px-4 py-3 font-medium text-right">Change %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {holdings.map((h) => {
            const perf = perfMap.get(h.symbol);
            const changeColor = perf
              ? perf.daily_change >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
              : "text-zinc-400";

            return (
              <tr key={h.symbol} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <td className="px-4 py-3 font-semibold">{h.symbol}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{h.name}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {perf ? `$${perf.current_price.toFixed(2)}` : "--"}
                </td>
                <td className={`px-4 py-3 text-right font-mono ${changeColor}`}>
                  {perf ? `${perf.daily_change >= 0 ? "+" : ""}${perf.daily_change.toFixed(2)}` : "--"}
                </td>
                <td className={`px-4 py-3 text-right font-mono ${changeColor}`}>
                  {perf ? `${perf.daily_change_pct >= 0 ? "+" : ""}${perf.daily_change_pct.toFixed(2)}%` : "--"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
