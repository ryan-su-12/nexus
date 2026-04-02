import { NewsItem } from "@/lib/api";

interface Props {
  news: NewsItem[];
}

export default function NewsFeed({ news }: Props) {
  if (news.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <h2 className="text-lg font-semibold mb-4">Recent News</h2>
      <div className="space-y-4">
        {news.map((item, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {item.symbol}
              </span>
              <span className="text-xs text-zinc-400">{item.source}</span>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline"
            >
              {item.headline}
            </a>
            {item.summary && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                {item.summary}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
