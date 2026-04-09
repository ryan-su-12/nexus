"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

const navItems = [
  { href: "/", label: "Overview", icon: "◎" },
  { href: "/holdings", label: "Portfolio", icon: "◫" },
  { href: "/analytics", label: "Analytics", icon: "◈" },
  { href: "/news", label: "News", icon: "◧" },
  { href: "/connect", label: "Connect", icon: "⟡" },
];

const publicPaths = ["/login", "/signup", "/home", "/forgot-password", "/reset-password", "/verify-mfa"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isPublic = publicPaths.includes(pathname);

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem("nexus.sidebar.collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("nexus.sidebar.collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

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
      <aside
        className={`relative border-r border-border bg-surface flex flex-col transition-[width] duration-200 ease-out ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border border-border bg-surface text-muted hover:text-foreground hover:border-accent/40 flex items-center justify-center text-xs shadow-md transition-colors"
        >
          {collapsed ? "›" : "‹"}
        </button>

        {/* Header */}
        <div className={`py-5 ${collapsed ? "px-3" : "px-5"}`}>
          {collapsed ? (
            <h1 className="text-xl font-bold text-accent text-center">N</h1>
          ) : (
            <>
              <h1 className="text-xl font-bold tracking-tight text-accent">
                Nexus
              </h1>
              <p className="text-xs text-muted mt-1 truncate">{user.email}</p>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-accent-dim text-accent"
                    : "text-muted hover:text-foreground hover:bg-surface-light"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          <Link
            href="/security"
            title={collapsed ? "Security" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              collapsed ? "justify-center" : ""
            } ${
              pathname === "/security"
                ? "bg-accent-dim text-accent"
                : "text-muted hover:text-foreground hover:bg-surface-light"
            }`}
          >
            <span className="text-base">⚙</span>
            {!collapsed && <span>Security</span>}
          </Link>
          <button
            onClick={async () => {
              await signOut();
              router.push("/home");
            }}
            title={collapsed ? "Sign out" : undefined}
            className={`w-full rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-light transition-colors flex items-center gap-3 ${
              collapsed ? "justify-center" : "text-left"
            }`}
          >
            <span className="text-base">⎋</span>
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 bg-background">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
