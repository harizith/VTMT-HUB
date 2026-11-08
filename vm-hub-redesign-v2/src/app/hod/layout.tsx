"use client";

import { Home, Users, BookOpen, Briefcase, Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

export default function HodLayout({ children }: { children: React.ReactNode }) {
  const [hodInfo, setHodInfo] = useState<any>(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

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
    { href: "/hod", label: "Executive Dashboard", shortLabel: "Dashboard", Icon: Home },
    { href: "/hod/department", label: "Department Overview", shortLabel: "Department", Icon: Briefcase },
    { href: "/hod/courses", label: "Department Courses", shortLabel: "Courses", Icon: BookOpen },
    { href: "/hod/faculty", label: "Faculty Directory", shortLabel: "Faculty", Icon: Users },
    { href: "/hod/notices", label: "Announcements", Icon: Bell },
  ];


  return (
    <>
      <AppShell
        portalLabel="HOD Portal"
        navItems={navItems}
        userName={hodInfo?.name}
        userSubtitle={hodInfo?.department ? `HOD, Dept of ${hodInfo.department}` : "Department Head"}
        onProfileClick={() => setShowProfileDrawer(true)}
      >
        {children}
      </AppShell>

      {/* HOD PROFILE SIDE DRAWER (Same as Admin User Drawer) */}
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
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "800",
                    color: "#f59e0b",
                    letterSpacing: "0.05em",
                  }}
                >
                  HEAD OF DEPARTMENT PROFILE
                </span>
                <button
                  onClick={() => setShowProfileDrawer(false)}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Profile Avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "1.5rem",
                    fontWeight: "700",
                  }}
                >
                  {hodInfo?.name ? hodInfo.name.charAt(0) : "H"}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0 }}>
                    {hodInfo?.name || "Head of Department"}
                  </h3>
                  <span
                    style={{
                      padding: "0.15rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      backgroundColor: "rgba(245, 158, 11, 0.15)",
                      color: "#f59e0b",
                    }}
                  >
                    HOD / LEADERSHIP
                  </span>
                </div>
              </div>

              {/* Profile Details List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.875rem" }}>
                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    backgroundColor: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>
                    DEPARTMENT LEAD
                  </span>
                  <strong style={{ color: "var(--text-main)" }}>
                    Department of {hodInfo?.department || "CSE"}
                  </strong>
                </div>

                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    backgroundColor: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>
                    DESIGNATION & ROLE
                  </span>
                  <strong style={{ color: "var(--sky-blue)" }}>
                    Professor & Head of Department
                  </strong>
                </div>

                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    backgroundColor: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>
                    OFFICIAL EMAIL
                  </span>
                  <strong style={{ color: "var(--text-main)" }}>
                    {hodInfo?.email || "hod@veltech.edu.in"}
                  </strong>
                </div>

                <Link
                  href="/hod/profile"
                  onClick={() => setShowProfileDrawer(false)}
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.65rem",
                    borderRadius: "8px",
                    backgroundColor: "var(--royal-blue)",
                    color: "white",
                    fontWeight: "600",
                    textAlign: "center",
                    textDecoration: "none",
                    fontSize: "0.85rem",
                  }}
                >
                  Manage Department Leadership Profile
                </Link>
              </div>
            </div>

            <div style={{ paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
              <button
                onClick={() => setShowProfileDrawer(false)}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-main)",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Close Drawer
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
