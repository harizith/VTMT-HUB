"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { LogOut, Moon, Sun, UserRound } from "lucide-react";

export interface ShellNavItem {
  href: string;
  label: string;
  /** Shorter label used in the top bar and mobile tab bar */
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // The most specific nav item that matches the current path is active
  const activeHref =
    [...navItems]
      .sort((a, b) => b.href.length - a.href.length)
      .find((n) => pathname === n.href || pathname.startsWith(n.href + "/"))?.href ?? navItems[0]?.href;

  const initials = initialsOf(userName);

  return (
    <div className="shell">
      <header className="shell-topbar">
        <div className="shell-topbar-inner">
          <Link href={navItems[0]?.href ?? "/"} className="shell-brand" aria-label="VM-HUB home">
            <span className="shell-logo" aria-hidden="true">VM</span>
            <span className="shell-brand-text">
              <strong>VM-HUB</strong>
              <small>{portalLabel}</small>
            </span>
          </Link>

          <nav className="shell-tabs" aria-label="Primary">
            {navItems.map(({ href, label, shortLabel, Icon }) => {
              const active = href === activeHref;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`shell-tab ${active ? "active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  title={label}
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
                  <span>{shortLabel ?? label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="shell-actions" ref={menuRef}>
            <button
              type="button"
              className="shell-icon-btn shell-theme-btn"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle light and dark mode"
            >
              <Sun size={18} className="icon-for-dark" />
              <Moon size={18} className="icon-for-light" />
            </button>
            <button
              type="button"
              className="shell-avatar-btn"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
            >
              <span className="shell-avatar">{initials}</span>
              <span className="shell-avatar-caret" aria-hidden="true">▾</span>
            </button>

            {menuOpen && (
              <div className="shell-menu" role="menu">
                <div className="shell-menu-head">
                  <span className="shell-avatar lg">{initials}</span>
                  <div>
                    <div className="shell-menu-name">{userName || "Your account"}</div>
                    <div className="shell-menu-sub">{userSubtitle || portalLabel}</div>
                  </div>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  className="shell-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onProfileClick();
                  }}
                >
                  <UserRound size={16} /> View profile
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="shell-menu-item danger"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="shell-body">
        <aside className="shell-side" aria-label="Your profile">
          <section className="shell-card shell-profile">
            <div className="shell-cover" />
            <span className="shell-avatar xl">{initials}</span>
            <h2 className="shell-profile-name">{userName || "Loading…"}</h2>
            <p className="shell-profile-sub">{userSubtitle || portalLabel}</p>
            <button type="button" className="shell-profile-btn" onClick={onProfileClick}>
              View profile
            </button>
          </section>
          <section className="shell-card shell-today">
            <span className="shell-today-label">Today</span>
            <span className="shell-today-date" suppressHydrationWarning>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </section>
        </aside>

        {/* Keyed on the path so each page change plays one short transition */}
        <main className="shell-content" key={pathname}>
          {children}
        </main>
      </div>

      <nav className="shell-bottombar" aria-label="Primary mobile">
        {navItems.map(({ href, label, shortLabel, Icon }) => {
          const active = href === activeHref;
          return (
            <Link
              key={href}
              href={href}
              className={`shell-bottom-tab ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
              <span>{shortLabel ?? label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
