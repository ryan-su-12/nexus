import Link from "next/link";

const features = [
  {
    step: "01",
    title: "Connect your brokerage",
    description:
      "Securely link Wealthsimple, Questrade, or any major brokerage in minutes. Your holdings sync automatically — no manual entry.",
  },
  {
    step: "02",
    title: "Track every position in real time",
    description:
      "Live prices and daily performance across Canadian and US markets. See what moved, how much, and when.",
  },
  {
    step: "03",
    title: "Get your AI daily briefing",
    description:
      "Every day, Claude reads your portfolio data and today's news and writes a plain-English summary of what drove your performance.",
  },
];

const stats = [
  { value: "2 min", label: "to connect your brokerage" },
  { value: "US + CA", label: "markets supported" },
  { value: "Claude AI", label: "powering daily summaries" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 border-b border-border bg-background/90 backdrop-blur-sm">
        <span className="text-lg font-bold text-accent tracking-tight">Nexus</span>
        <div className="flex items-center gap-6">
          <Link href="/home#how-it-works" className="text-sm text-muted hover:text-foreground transition-colors hidden sm:block">
            How it works
          </Link>
          <Link href="/login" className="text-sm text-muted hover:text-foreground transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black hover:bg-accent/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col lg:flex-row items-center gap-12 px-8 pt-36 pb-24 max-w-7xl mx-auto w-full">
        {/* Left */}
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-dim px-4 py-1.5 text-xs text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            AI-powered portfolio intelligence
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
            KNOW WHY YOUR<br />
            <span className="text-accent">PORTFOLIO</span><br />
            MOVED.
          </h1>
          <p className="text-lg text-muted max-w-md leading-relaxed">
            Nexus connects to your brokerage, tracks your holdings in real time,
            and uses AI to explain what drove your performance — every single day.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-black hover:bg-accent/90 transition-colors"
            >
              Open an account
            </Link>
            <Link
              href="/login"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Sign in →
            </Link>
          </div>
        </div>

        {/* Right — mock UI */}
        <div className="flex-1 w-full max-w-md">
          <div className="rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <div className="h-3 w-3 rounded-full bg-negative/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-accent/60" />
              <span className="ml-2 text-xs text-muted">nexus — overview</span>
            </div>
            <div className="p-5 space-y-4">
              {/* Portfolio value */}
              <div>
                <p className="text-xs text-muted">Portfolio Value</p>
                <p className="text-3xl font-bold font-mono mt-1">$48,291.42</p>
                <p className="text-sm text-accent font-mono mt-0.5">+$412.18 (+0.86%) today</p>
              </div>
              {/* Fake chart */}
              <div className="h-24 rounded-xl bg-surface-light border border-border flex items-end gap-0.5 px-3 pb-3 overflow-hidden">
                {[35, 42, 38, 55, 48, 62, 58, 70, 65, 78, 72, 85, 80, 92, 88, 95].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-accent/25" style={{ height: `${h}%` }} />
                ))}
              </div>
              {/* Positions */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { symbol: "NVDA", price: "$177.39", change: "+0.93%", up: true },
                  { symbol: "PLTR", price: "$148.46", change: "+1.34%", up: true },
                  { symbol: "VFV.TO", price: "$162.41", change: "+0.88%", up: true },
                  { symbol: "ZEB.TO", price: "$59.93", change: "-0.51%", up: false },
                ].map((s) => (
                  <div key={s.symbol} className="rounded-xl bg-surface-light border border-border p-3">
                    <p className="text-xs text-muted">{s.symbol}</p>
                    <p className="text-sm font-bold font-mono text-foreground mt-1">{s.price}</p>
                    <p className={`text-xs font-mono ${s.up ? "text-accent" : "text-negative"}`}>{s.change}</p>
                  </div>
                ))}
              </div>
              {/* AI Summary snippet */}
              <div className="rounded-xl bg-surface-light border border-border p-4">
                <p className="text-xs text-muted mb-1.5">AI Daily Summary</p>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Your portfolio gained <span className="text-accent font-medium">+0.86%</span> today. NVIDIA led gains following strong data center demand signals, while Palantir climbed on a new government contract announcement...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-surface">
        <div className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-3 divide-x divide-border">
          {stats.map((s) => (
            <div key={s.label} className="text-center px-6">
              <p className="text-2xl font-bold text-accent">{s.value}</p>
              <p className="text-sm text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-8 py-24 max-w-7xl mx-auto w-full">
        <div className="mb-14">
          <p className="text-xs text-accent font-semibold tracking-widest uppercase mb-3">How it works</p>
          <h2 className="text-4xl font-bold max-w-md leading-tight">
            From brokerage to insight in minutes.
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.step} className="rounded-2xl bg-surface border border-border p-8 hover:border-accent/30 transition-colors">
              <p className="text-4xl font-bold text-accent/20 mb-6">{f.step}</p>
              <h3 className="text-base font-semibold mb-3">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature highlight — AI summary */}
      <section className="px-8 py-24 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <p className="text-xs text-accent font-semibold tracking-widest uppercase">Powered by Claude AI</p>
            <h2 className="text-4xl font-bold leading-tight">
              Stop guessing.<br />
              <span className="text-accent">Start understanding.</span>
            </h2>
            <p className="text-muted leading-relaxed max-w-md">
              Most portfolio trackers show you numbers. Nexus tells you what they mean.
              Every day, Claude reads your positions and the day's news and writes a clear,
              concise briefing — connecting price moves to real-world events.
            </p>
            <Link
              href="/signup"
              className="inline-block rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-black hover:bg-accent/90 transition-colors"
            >
              Try it free
            </Link>
          </div>
          {/* Mock summary card */}
          <div className="flex-1 w-full max-w-md rounded-2xl bg-background border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">AI Daily Summary</p>
              <p className="text-xs text-muted">Today</p>
            </div>
            <div className="h-px bg-border" />
            <p className="text-sm text-foreground/80 leading-relaxed">
              Your portfolio gained <span className="text-accent font-semibold">+$412.18 (+0.86%)</span> today,
              driven primarily by NVIDIA's continued strength following remarks from Jensen Huang
              at GTC 2025 on accelerated AI infrastructure demand.
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Palantir added <span className="text-accent font-semibold">+1.34%</span> after announcing
              a new US Army contract expansion. VFV.TO tracked the S&P 500 higher.
              ZEB.TO slipped <span className="text-negative font-semibold">-0.51%</span> amid
              broader weakness in Canadian bank stocks.
            </p>
            <div className="rounded-lg bg-surface-light border border-border px-4 py-3">
              <p className="text-xs text-muted">No holdings had unusual volume or earnings surprises today.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-32 text-center">
        <h2 className="text-5xl font-bold mb-6 leading-tight">
          Your portfolio deserves<br />
          <span className="text-accent">a smarter lens.</span>
        </h2>
        <p className="text-muted max-w-md mx-auto mb-10 leading-relaxed">
          Connect your brokerage and get your first AI daily summary in under 5 minutes.
        </p>
        <Link
          href="/signup"
          className="inline-block rounded-full bg-accent px-10 py-4 text-base font-semibold text-black hover:bg-accent/90 transition-colors"
        >
          Get started — it&apos;s free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-base font-bold text-accent">Nexus</span>
        <p className="text-xs text-muted text-center">
          Market data via Finnhub & Yahoo Finance · AI by Anthropic Claude · Brokerage connections via SnapTrade
        </p>
        <div className="flex gap-6">
          <Link href="/login" className="text-xs text-muted hover:text-foreground transition-colors">Log in</Link>
          <Link href="/signup" className="text-xs text-muted hover:text-foreground transition-colors">Sign up</Link>
        </div>
      </footer>
    </div>
  );
}
