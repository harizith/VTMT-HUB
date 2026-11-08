"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { LogOut, Menu, Moon, Sun, X } from "lucide-react";

export interface ShellNavItem {
  href: string;
  label: string;
  /** Optional shorter label (kept for callers that pass one) */
  shortLabel?: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

interface AppShellProps {
  portalLabel: string;
  navItems: ShellNavItem[];
  userName?: string;
  userSubtitle?: string;
  onProfileClick: () => void;
  children: React.ReactNode;
}

function initialsOf(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "U";
}

export default function AppShell({
  portalLabel,
  navItems,
  userName,
  userSubtitle,
  onProfileClick,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Escape closes the mobile sidebar
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  // The most specific nav item that matches the path is the active one
  const activeHref =
    [...navItems]
      .sort((a, b) => b.href.length - a.href.length)
      .find((n) => pathname === n.href || pathname.startsWith(n.href + "/"))?.href ?? navItems[0]?.href;
  const activeIndex = Math.max(
    0,
    navItems.findIndex((n) => n.href === activeHref)
  );
  const activeItem = navItems[activeIndex];
  const initials = initialsOf(userName);

  return (
    <div className="shell">
      <div
        className={`shell-scrim ${drawerOpen ? "open" : ""}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      <aside className={`shell-sidebar ${drawerOpen ? "open" : ""}`} aria-label="Sidebar">
        <div className="shell-sidebar-top">
          <Link href={navItems[0]?.href ?? "/"} className="shell-brand" onClick={() => setDrawerOpen(false)}>
            <span className="shell-logo" aria-hidden="true">VM</span>
            <span className="shell-brand-text">
              <strong>VM-HUB</strong>
              <small>{portalLabel}</small>
            </span>
          </Link>
          <button
            type="button"
            className="shell-close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="shell-nav" aria-label="Primary" style={{ ["--idx" as string]: activeIndex } as React.CSSProperties}>
          <span className="shell-nav-marker" aria-hidden="true" />
          {navItems.map(({ href, label, Icon }, i) => {
            const active = href === activeHref;
            return (
              <Link
                key={href}
                href={href}
                className={`shell-nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setDrawerOpen(false)}
                style={{ ["--n" as string]: i } as React.CSSProperties}
              >
                <Icon size={19} strokeWidth={active ? 2.3 : 1.9} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shell-sidebar-bottom">
          <button type="button" className="shell-user" onClick={() => { setDrawerOpen(false); onProfileClick(); }}>
            <span className="shell-avatar">{initials}</span>
            <span className="shell-user-text">
              <strong>{userName || "Loading…"}</strong>
              <small>{userSubtitle || portalLabel}</small>
            </span>
          </button>
          <button type="button" className="shell-signout" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="shell-main">
        <header className="shell-header">
          <button
            type="button"
            className="shell-menu-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="shell-title">
            <h1>{activeItem?.label}</h1>
            <span suppressHydrationWarning>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
          <button
            type="button"
            className="shell-icon-btn shell-theme-btn"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle light and dark mode"
          >
            <Sun size={18} className="icon-for-dark" />
            <Moon size={18} className="icon-for-light" />
          </button>
        </header>

        {/* Keyed on the path so each page change plays one short transition */}
        <main className="shell-content" key={pathname}>
          {children}
        </main>
      </div>
    </div>
  );
}
