import { Holding, Performance } from "@/lib/api";

interface Props {
  holdings: Holding[];
  performances: Performance[];
}

export default function HoldingsTable({ holdings, performances }: Props) {
  const perfMap = new Map(performances.map((p) => [p.symbol, p]));

  // Group holdings by account
  const accounts = new Map<string, { name: string; holdings: Holding[] }>();
  for (const h of holdings) {
    const key = h.account_id ?? "unknown";
    const label = h.account_name ?? "Unknown Account";
    if (!accounts.has(key)) accounts.set(key, { name: label, holdings: [] });
    accounts.get(key)!.holdings.push(h);
  }

  // If no account data, fall back to a single ungrouped table
  const grouped = accounts.size > 0 ? [...accounts.values()] : [{ name: "", holdings }];

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.name} className="rounded-2xl bg-surface border border-border overflow-hidden">
          {group.name && (
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{group.name}</span>
              <span className="text-xs text-muted">· {group.holdings.length} position{group.holdings.length !== 1 ? "s" : ""}</span>
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="px-5 py-3 font-medium">Symbol</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium text-right">Price</th>
                <th className="px-5 py-3 font-medium text-right">Change</th>
                <th className="px-5 py-3 font-medium text-right">Change %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {group.holdings.map((h) => {
                const perf = perfMap.get(h.symbol);
                const isUp = perf ? perf.daily_change >= 0 : true;
                const changeColor = perf
                  ? isUp ? "text-accent" : "text-negative"
                  : "text-muted";

                return (
                  <tr key={`${h.account_id}-${h.symbol}`} className="hover:bg-surface-light transition-colors">
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
      ))}
    </div>
  );
}
