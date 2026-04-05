"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

const navItems = [
  { href: "/", label: "Overview", icon: "◎" },
  { href: "/holdings", label: "Holdings", icon: "◫" },
  { href: "/news", label: "News", icon: "◧" },
  { href: "/connect", label: "Connect", icon: "⟡" },
];

const publicPaths = ["/login", "/signup", "/home", "/forgot-password", "/reset-password", "/verify-mfa"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const isPublic = publicPaths.includes(pathname);

  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.push("/home");
    }
  }, [loading, user, isPublic, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (isPublic) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-1">
      <aside className="w-56 border-r border-border bg-surface flex flex-col">
        <div className="px-5 py-5">
          <h1 className="text-xl font-bold tracking-tight text-accent">Nexus</h1>
          <p className="text-xs text-muted mt-1 truncate">{user.email}</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent-dim text-accent"
                    : "text-muted hover:text-foreground hover:bg-surface-light"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-border space-y-1">
          <Link
            href="/security"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/security"
                ? "bg-accent-dim text-accent"
                : "text-muted hover:text-foreground hover:bg-surface-light"
            }`}
          >
            Security
          </Link>
          <button
            onClick={async () => {
              await signOut();
              router.push("/home");
            }}
            className="w-full text-left rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-light transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 bg-background">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
