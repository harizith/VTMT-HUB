"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  BookOpen,
  Calendar,
  Megaphone,
  CheckCircle2,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Shield,
  Layers,
  GraduationCap,
  Briefcase,
  X,
  Sparkles,
} from "lucide-react";
import Clock from "@/components/Clock";
import BrandLogo from "@/components/BrandLogo";

interface HodCommandLayoutProps {
  children: React.ReactNode;
}

export default function HodCommandLayout({ children }: HodCommandLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [hodInfo, setHodInfo] = useState<any>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // Sync theme
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  useEffect(() => {
    fetch("/api/hod/dashboard")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setHodInfo(res.data.hod || res.data.teacher);
        }
      })
      .catch(() => {});
  }, []);

  const navItems = [
    {
      id: "dashboard",
      href: "/hod",
      label: "Department Command",
      subLabel: "Overview & Day Order",
      Icon: Briefcase,
    },
    {
      id: "department",
      href: "/hod/department",
      label: "Department Metrics",
      subLabel: "Workload & Stats",
      Icon: Layers,
    },
    {
      id: "courses",
      href: "/hod/courses",
      label: "Course Allocations",
      subLabel: "Curriculum & Credits",
      Icon: BookOpen,
    },
    {
      id: "faculty",
      href: "/hod/faculty",
      label: "Faculty Directory",
      subLabel: "Staff & Workloads",
      Icon: Users,
    },
    {
      id: "attendance",
      href: "/hod/attendance",
      label: "Take Attendance",
      subLabel: "Direct Period Roll Call",
      Icon: CheckCircle2,
    },
    {
      id: "notices",
      href: "/hod/notices",
      label: "Announcements",
      subLabel: "Broadcast to Dept",
      Icon: Megaphone,
    },
  ];

  // Derive active header title
  const activeNav =
    navItems.find((n) => pathname === n.href || (n.href !== "/hod" && pathname.startsWith(n.href))) ||
    navItems[0];

  return (
    <div className="admin-layout" data-theme={theme}>
      {/* Mobile Backdrop */}
      <div
        className={`admin-sidebar-overlay ${isMobileSidebarOpen ? "open" : ""}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* LEFT SIDEBAR */}
      <aside className={`admin-sidebar ${isMobileSidebarOpen ? "open" : ""}`}>
        <div>
          {/* Brand Heading */}
          <div
            style={{
              paddingBottom: "1.25rem",
              borderBottom: "1px solid var(--border-subtle)",
              marginBottom: "1.25rem",
            }}
          >
            <BrandLogo size="md" subtitle="HOD GOVERNANCE PORTAL" />
          </div>

          {/* Navigation Links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {navItems.map((nav) => {
              const isSelected =
                pathname === nav.href || (nav.href !== "/hod" && pathname.startsWith(nav.href));

              return (
                <button
                  key={nav.id}
                  onClick={() => {
                    router.push(nav.href);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`admin-nav-item ${isSelected ? "active" : ""}`}
                  style={{ position: "relative" }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <nav.Icon
                      size={18}
                      style={{
                        color: isSelected ? "var(--primary)" : "var(--text-muted)",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontWeight: isSelected ? 600 : 500 }}>{nav.label}</span>
                  </span>
                  <ChevronRight
                    size={14}
                    style={{
                      color: isSelected ? "var(--primary)" : "var(--text-tertiary)",
                      opacity: isSelected ? 1 : 0.5,
                      transform: isSelected ? "translateX(2px)" : "none",
                      transition: "transform 0.15s ease",
                    }}
                  />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Profile Capsule, Theme Toggle, Sign Out */}
        <div
          style={{
            paddingTop: "1rem",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {/* User Profile Card */}
          <div
            onClick={() => setShowProfileDrawer(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.65rem 0.85rem",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
              transition: "all 0.18s var(--ease-smooth)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--primary)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "white",
                fontSize: "0.95rem",
                boxShadow: "0 2px 6px rgba(245, 158, 11, 0.3)",
                flexShrink: 0,
              }}
            >
              {hodInfo?.name ? hodInfo.name.charAt(0).toUpperCase() : "H"}
            </div>
            <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  color: "var(--text-main)",
                }}
              >
                {hodInfo?.name || "Head of Department"}
              </div>
              <div
                style={{
                  fontSize: "0.725rem",
                  color: "var(--text-muted)",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {hodInfo?.department ? `Dept of ${hodInfo.department}` : "Department Lead"}
              </div>
            </div>
            <ChevronRight size={15} style={{ color: "var(--text-tertiary)" }} />
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              width: "100%",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-main)",
              border: "1px solid var(--border-subtle)",
              padding: "0.55rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.825rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {theme === "dark" ? (
              <>
                <Sun size={15} style={{ color: "#fbbf24" }} />
                <span>Switch to Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={15} style={{ color: "#6366f1" }} />
                <span>Switch to Dark Mode</span>
              </>
            )}
          </button>

          {/* Sign Out Button */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="btn-danger"
            style={{ width: "100%" }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-main">
        {/* Top Header with Live Clock */}
        <header className="admin-header-container">
          <div className="admin-header-top">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button
                className="hamburger-btn"
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Open mobile navigation"
              >
                ☰
              </button>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                  <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>
                    {activeNav.label}
                  </h1>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      fontSize: "0.7rem",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "999px",
                      backgroundColor: "rgba(245, 158, 11, 0.15)",
                      color: "#d97706",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                    }}
                  >
                    HOD LEADERSHIP
                  </span>
                </div>
                <p style={{ margin: "3px 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Vel Tech Multi Tech Autonomous ERP System • {activeNav.subLabel}
                </p>
              </div>
            </div>

            {/* Campus Clock */}
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
              <Clock size={86} subtext="CAMPUS" />
            </div>
          </div>
        </header>

        {/* Page View Body */}
        <div style={{ padding: "0.25rem 0" }}>{children}</div>
      </main>

      {/* HOD PROFILE SIDE DRAWER */}
      {showProfileDrawer && (
        <div className="admin-drawer-container" onClick={() => setShowProfileDrawer(false)}>
          <aside onClick={(e) => e.stopPropagation()} className="admin-drawer">
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: "1rem",
                  borderBottom: "1px solid var(--border-subtle)",
                  marginBottom: "1.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Sparkles size={15} style={{ color: "#d97706" }} />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: "#d97706",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    Department Head Profile
                  </span>
                </div>
                <button
                  onClick={() => setShowProfileDrawer(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "1.1rem",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label="Close drawer"
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.85rem",
                    fontWeight: 800,
                    margin: "0 auto 0.75rem",
                    boxShadow: "0 6px 16px -2px rgba(245, 158, 11, 0.4)",
                  }}
                >
                  {hodInfo?.name ? hodInfo.name.charAt(0).toUpperCase() : "H"}
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.25rem" }}>
                  {hodInfo?.name || "Head of Department"}
                </h3>
                <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", margin: 0 }}>
                  {hodInfo?.email || "hod@vtmt.org"}
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#d97706",
                    fontWeight: 700,
                    margin: "0.35rem 0 0",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  MTS No: {hodInfo?.vmNo || hodInfo?.facultyProfile?.vmNo || "MTS-HOD-01"}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div
                  style={{
                    backgroundColor: "var(--bg-input)",
                    padding: "0.75rem 0.85rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", fontWeight: 600 }}>
                    DEPARTMENT LEADERSHIP
                  </span>
                  <strong style={{ fontSize: "0.9rem", color: "var(--text-main)" }}>
                    Department of {hodInfo?.department || "CSE"}
                  </strong>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--bg-input)",
                    padding: "0.75rem 0.85rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", fontWeight: 600 }}>
                    POSITION & TITLE
                  </span>
                  <strong style={{ fontSize: "0.9rem", color: "var(--text-main)" }}>
                    {hodInfo?.facultyProfile?.designation ||
                      hodInfo?.designation ||
                      "Professor & Head of Department"}
                  </strong>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--bg-input)",
                    padding: "0.75rem 0.85rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", fontWeight: 600 }}>
                    SYSTEM AUTHORITY
                  </span>
                  <strong style={{ fontSize: "0.9rem", color: "#d97706" }}>
                    HEAD OF DEPARTMENT (HOD)
                  </strong>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--bg-input)",
                    padding: "0.75rem 0.85rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", fontWeight: 600 }}>
                    SECURITY CLEARANCE
                  </span>
                  <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.825rem" }}>
                    ● GOVERNANCE LEVEL GRANTED
                  </span>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
              <button
                onClick={() => setShowProfileDrawer(false)}
                className="btn-secondary"
                style={{ width: "100%" }}
              >
                Close Drawer
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
