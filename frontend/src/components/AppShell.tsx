"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/UserContext";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/holdings", label: "Holdings" },
  { href: "/news", label: "News" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userId, setUserId } = useUser();

  if (!userId) return <>{children}</>;

  return (
    <div className="flex flex-1">
      <aside className="w-56 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        <div className="px-5 py-5">
          <h1 className="text-xl font-bold tracking-tight">Nexus</h1>
          <p className="text-xs text-zinc-400 mt-1 truncate">{userId}</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setUserId(null)}
            className="w-full text-left rounded-lg px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Switch User
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
