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

interface TeacherCommandLayoutProps {
  children: React.ReactNode;
}

export default function TeacherCommandLayout({ children }: TeacherCommandLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [teacherInfo, setTeacherInfo] = useState<any>(null);
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
    fetch("/api/teacher/dashboard")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setTeacherInfo(res.data.teacher);
        }
      })
      .catch(() => {});
  }, []);

  const navItems = [
    {
      id: "dashboard",
      href: "/teacher",
      label: "Teaching Command Hub",
      subLabel: "Dashboard & Day Order",
      Icon: Layers,
    },
    {
      id: "attendance",
      href: "/teacher/attendance",
      label: "Period Attendance Ledger",
      subLabel: "Fast Roll Call & 1-Tap Save",
      Icon: CheckCircle2,
    },
    {
      id: "courses",
      href: "/teacher/courses",
      label: "Course Allocations",
      subLabel: "Assigned Subjects & Sections",
      Icon: BookOpen,
    },
    {
      id: "students",
      href: "/teacher/students",
      label: "Student Rosters & Records",
      subLabel: "Class Enrolment & Reports",
      Icon: Users,
    },
    {
      id: "substitute",
      href: "/teacher/substitute",
      label: "Substitute Requests",
      subLabel: "Single-Day Class Cover",
      Icon: CheckCircle2,
    },
    {
      id: "notices",
      href: "/teacher/notices",
      label: "Announcements & Circulars",
      subLabel: "Department Broadcasts",
      Icon: Megaphone,
    },
  ];

  // Derive active header title
  const activeNav =
    navItems.find((n) => pathname === n.href || (n.href !== "/teacher" && pathname.startsWith(n.href))) ||
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
            <BrandLogo size="md" subtitle="FACULTY COMMAND HUB" />
          </div>

          {/* Navigation Links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {navItems.map((nav) => {
              const isSelected =
                pathname === nav.href || (nav.href !== "/teacher" && pathname.startsWith(nav.href));

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
                background: "linear-gradient(135deg, var(--primary) 0%, #06b6d4 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "white",
                fontSize: "0.95rem",
                boxShadow: "0 2px 6px rgba(37, 99, 235, 0.3)",
                flexShrink: 0,
              }}
            >
              {teacherInfo?.name ? teacherInfo.name.charAt(0).toUpperCase() : "F"}
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
                {teacherInfo?.name || "Faculty Member"}
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
                MTS: {teacherInfo?.vmNo || teacherInfo?.facultyProfile?.vmNo || "Faculty"}
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
                      backgroundColor: "rgba(37, 99, 235, 0.12)",
                      color: "var(--primary)",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      border: "1px solid rgba(37, 99, 235, 0.2)",
                    }}
                  >
                    FACULTY
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

      {/* FACULTY PROFILE SIDE DRAWER */}
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
                  <Sparkles size={15} style={{ color: "var(--primary)" }} />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: "var(--primary)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    Faculty Profile
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
                    background: "linear-gradient(135deg, var(--primary) 0%, #06b6d4 100%)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.85rem",
                    fontWeight: 800,
                    margin: "0 auto 0.75rem",
                    boxShadow: "0 6px 16px -2px rgba(37, 99, 235, 0.4)",
                  }}
                >
                  {teacherInfo?.name ? teacherInfo.name.charAt(0).toUpperCase() : "F"}
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.25rem" }}>
                  {teacherInfo?.name || "Faculty Member"}
                </h3>
                <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", margin: 0 }}>
                  {teacherInfo?.email || "faculty@vtmt.org"}
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--primary)",
                    fontWeight: 700,
                    margin: "0.35rem 0 0",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  MTS No: {teacherInfo?.vmNo || teacherInfo?.facultyProfile?.vmNo || "MTS-FAC-01"}
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
                    DEPARTMENT
                  </span>
                  <strong style={{ fontSize: "0.9rem", color: "var(--text-main)" }}>
                    Department of {teacherInfo?.department || "CSE"}
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
                    DESIGNATION
                  </span>
                  <strong style={{ fontSize: "0.9rem", color: "var(--text-main)" }}>
                    {teacherInfo?.facultyProfile?.designation ||
                      teacherInfo?.designation ||
                      "Assistant Professor"}
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
                    SYSTEM ROLE
                  </span>
                  <strong style={{ fontSize: "0.9rem", color: "var(--primary)" }}>
                    FACULTY / TEACHER
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
                    ACCOUNT STATUS
                  </span>
                  <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.825rem" }}>
                    ● ACTIVE & VERIFIED
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
