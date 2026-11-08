"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sun } from "lucide-react";

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

  // The most specific nav item that matches the path is the active one
  const activeHref =
    [...navItems]
      .sort((a, b) => b.href.length - a.href.length)
      .find((n) => pathname === n.href || pathname.startsWith(n.href + "/"))?.href ?? navItems[0]?.href;
  const activeIndex = Math.max(0, navItems.findIndex((n) => n.href === activeHref));
  const activeItem = navItems[activeIndex];

  return (
    <div className="shell">
      <header className="shell-header">
        <Link href={navItems[0]?.href ?? "/"} className="shell-brand">
          <span className="shell-logo" aria-hidden="true">VM</span>
          <span className="shell-brand-text">
            <strong>VM-HUB</strong>
            <small>{portalLabel}</small>
          </span>
        </Link>

        <nav
          className="shell-nav"
          aria-label="Primary"
          style={{ ["--idx" as string]: activeIndex, ["--count" as string]: navItems.length } as React.CSSProperties}
        >
          <span className="shell-nav-marker" aria-hidden="true" />
          {navItems.map(({ href, label, Icon }) => {
            const active = href === activeHref;
            return (
              <Link
                key={href}
                href={href}
                className={`shell-nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                title={label}
              >
                <Icon size={18} strokeWidth={active ? 2.3 : 1.9} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shell-actions">
          <button
            type="button"
            className="shell-icon-btn shell-theme-btn"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle light and dark mode"
          >
            <Sun size={18} className="icon-for-dark" />
            <Moon size={18} className="icon-for-light" />
          </button>
          <button type="button" className="shell-user" onClick={onProfileClick} aria-label="Open profile">
            <span className="shell-avatar">{initialsOf(userName)}</span>
            <span className="shell-user-text">
              <strong>{userName || "Loading…"}</strong>
              <small>{userSubtitle || portalLabel}</small>
            </span>
          </button>
          <button
            type="button"
            className="shell-icon-btn shell-signout"
            onClick={() => signOut({ callbackUrl: "/" })}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* Keyed on the path so each page change plays one short transition */}
      <main className="shell-content" key={pathname}>
        <div className="page-head">
          <span suppressHydrationWarning>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
          <h1>{activeItem?.label}</h1>
        </div>
        {children}
      </main>
    </div>
  );
}
