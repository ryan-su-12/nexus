import { NewsItem } from "@/lib/api";

interface Props {
  news: NewsItem[];
}

export default function NewsFeed({ news }: Props) {
  if (news.length === 0) return null;

  return (
    <div className="rounded-2xl bg-surface border border-border p-6">
      <h2 className="text-lg font-semibold text-foreground mb-5">Recent News</h2>
      <div className="space-y-4">
        {news.map((item, i) => (
          <div
            key={i}
            className="rounded-xl bg-surface-light border border-border p-4 hover:border-accent/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-md bg-accent-dim px-2 py-0.5 text-xs font-semibold text-accent">
                {item.symbol}
              </span>
              <span className="text-xs text-muted">{item.source}</span>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground hover:text-accent transition-colors"
            >
              {item.headline}
            </a>
            {item.summary && (
              <p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">
                {item.summary}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
