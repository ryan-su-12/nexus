interface Props {
  summary: string | null;
  loading: boolean;
  onGenerate: () => void;
}

export default function SummaryPanel({ summary, loading, onGenerate }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">AI Daily Summary</h2>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
        >
          {loading ? "Generating..." : "Generate Summary"}
        </button>
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
          <span className="text-sm">Claude is analyzing your portfolio...</span>
        </div>
      )}
      {summary && !loading && (
        <div className="prose prose-zinc dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
          {summary}
        </div>
      )}
      {!summary && !loading && (
        <p className="text-sm text-zinc-400">
          Click &quot;Generate Summary&quot; to get an AI-powered analysis of your portfolio.
        </p>
      )}
    </div>
  );
}
