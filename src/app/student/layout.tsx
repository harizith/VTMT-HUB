"use client";

import { Home, Calendar, Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setStudentInfo(res.data.student);
        }
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { href: "/student", label: "Dashboard", Icon: Home },
    { href: "/student/calendar", label: "Calendar & Schedule", shortLabel: "Schedule", Icon: Calendar },
    { href: "/student/messages", label: "Announcements", Icon: Bell },
  ];

  return (
    <>
      <AppShell
        portalLabel="Student Portal"
        navItems={navItems}
        userName={studentInfo?.name}
        userSubtitle={studentInfo?.registerNo || studentInfo?.department || "Student"}
        onProfileClick={() => setShowProfileDrawer(true)}
      >
        {children}
      </AppShell>

      {/* STUDENT PROFILE SIDE DRAWER (Same as Admin User Drawer) */}
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
                    color: "var(--sky-blue)",
                    letterSpacing: "0.05em",
                  }}
                >
                  STUDENT PROFILE DETAILS
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
                    background: "linear-gradient(135deg, var(--royal-blue) 0%, var(--sky-blue) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "1.5rem",
                    fontWeight: "700",
                  }}
                >
                  {studentInfo?.name ? studentInfo.name.charAt(0) : "S"}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0 }}>
                    {studentInfo?.name || "Student"}
                  </h3>
                  <span
                    style={{
                      padding: "0.15rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      backgroundColor: "rgba(56, 189, 248, 0.15)",
                      color: "var(--sky-blue)",
                    }}
                  >
                    STUDENT ACCOUNT
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
                    REGISTER NUMBER
                  </span>
                  <strong style={{ color: "var(--text-main)" }}>
                    {studentInfo?.registerNo || "N/A"}
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
                    DEPARTMENT & SECTION
                  </span>
                  <strong style={{ color: "var(--text-main)" }}>
                    {studentInfo?.department || "CSE"} • Section {studentInfo?.section || "A"}
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
                    YEAR & SEMESTER
                  </span>
                  <strong style={{ color: "var(--text-main)" }}>
                    Year {studentInfo?.year || "II"} • Semester {studentInfo?.semester || "3"}
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
                    CLASS ID
                  </span>
                  <strong style={{ color: "var(--sky-blue)" }}>
                    {studentInfo?.classId || `${studentInfo?.year || "II"}-${studentInfo?.department || "CSE"}-${studentInfo?.section || "A"}`}
                  </strong>
                </div>

                <Link
                  href="/student/profile"
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
                  Edit Full Profile & Password
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
