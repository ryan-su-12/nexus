"use client";

import ReactMarkdown from "react-markdown";

interface Props {
  summary: string | null;
  loading: boolean;
  onGenerate: () => void;
}

export default function SummaryPanel({ summary, loading, onGenerate }: Props) {
  return (
    <div className="rounded-2xl bg-surface border border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">AI Daily Summary</h2>
          <p className="text-xs text-muted mt-0.5">Powered by Claude</p>
        </div>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-black hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Generating..." : "Generate Summary"}
        </button>
      </div>
      {loading && (
        <div className="flex items-center gap-3 text-muted py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
          <span className="text-sm">Analyzing your portfolio...</span>
        </div>
      )}
      {summary && !loading && (
        <div className="rounded-xl bg-surface-light border border-border p-5 text-sm leading-relaxed text-foreground/90">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-sm font-bold mb-2 mt-4">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-3">{children}</h3>,
              p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-foreground/90">{children}</li>,
            }}
          >
            {summary}
          </ReactMarkdown>
        </div>
      )}
      {!summary && !loading && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted">
            Generate an AI-powered analysis of your portfolio performance.
          </p>
        </div>
      )}
    </div>
  );
}
