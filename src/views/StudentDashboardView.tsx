"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Megaphone, Calendar as CalendarIcon, Sparkles, ChevronRight, X, Clock as ClockIcon, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";

import OverallTimetable from "@/components/OverallTimetable";
import Clock from "@/components/Clock";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/student/dashboard")
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setData(res.data);
        } else {
          console.error("Failed to load dashboard data:", res.error);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("API error:", err);
        setLoading(false);
      });
  }, []);

  if (!mounted) return null;

  // Real date for the UI
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: 'long', day: 'numeric', month: 'long' });

  // Get active period logic (Simplified based on current time)
  const now = new Date();
  const currentHour = now.getHours();
  let activePeriod = 0;
  if (currentHour >= 8 && currentHour < 9) activePeriod = 1;
  else if (currentHour >= 9 && currentHour < 10) activePeriod = 2;
  else if (currentHour >= 10 && currentHour < 11) activePeriod = 3;
  else if (currentHour >= 11 && currentHour < 12) activePeriod = 4;
  else if (currentHour >= 12 && currentHour < 13) activePeriod = 5;
  else if (currentHour >= 13 && currentHour < 14) activePeriod = 6;
  else if (currentHour >= 14 && currentHour < 15) activePeriod = 7;
  else if (currentHour >= 15 && currentHour < 16) activePeriod = 8;

  const happeningNow = data?.timetable?.find((t: any) => t.period === activePeriod);
  const upNext = data?.timetable?.find((t: any) => t.period === activePeriod + 1);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)", fontSize: "0.95rem" }}>
          <div style={{ width: "20px", height: "20px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span>Synchronizing student dashboard...</span>
        </div>
      </div>
    );
  }

  // Attendance calculations from live API payload
  const attendance = data?.attendance;
  const hasAttendanceRecords = Boolean(attendance?.hasRecords && (attendance?.totalPeriods || 0) > 0);
  const attendancePct = hasAttendanceRecords ? Math.round(attendance.percentage) : 0;

  // Modern SaaS palette based on university attendance thresholds:
  // >= 75%: Emerald (#10b981)
  // 65% - 74%: Amber (#f59e0b)
  // < 65%: Critical Rose (#ef4444)
  let ringColor = "var(--text-muted)";
  let badgeText = "No Records Yet";
  let badgeBg = "var(--bg-input)";
  let badgeBorder = "1px solid var(--border-subtle)";
  let badgeColor = "var(--text-muted)";
  let statusSubtitle = "Attendance records will appear once sessions are marked.";

  if (hasAttendanceRecords) {
    if (attendancePct >= 75) {
      ringColor = "#10b981";
      badgeText = "Good Standing";
      badgeBg = "rgba(16, 185, 129, 0.12)";
      badgeBorder = "1px solid rgba(16, 185, 129, 0.25)";
      badgeColor = "#10b981";
      statusSubtitle = "Above the 75% university requirement";
    } else if (attendancePct >= 65) {
      ringColor = "#f59e0b";
      badgeText = "Shortage Warning";
      badgeBg = "rgba(245, 158, 11, 0.12)";
      badgeBorder = "1px solid rgba(245, 158, 11, 0.25)";
      badgeColor = "#f59e0b";
      statusSubtitle = "Below 75% — Needs condonation approval";
    } else {
      ringColor = "#ef4444";
      badgeText = "Critical Defaulter";
      badgeBg = "rgba(239, 68, 68, 0.12)";
      badgeBorder = "1px solid rgba(239, 68, 68, 0.25)";
      badgeColor = "#ef4444";
      statusSubtitle = "Critical shortage (< 65%) — Exam detention risk";
    }
  }

  // SVG Geometry: radius 40, circumference 2 * PI * 40 ≈ 251.33
  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = hasAttendanceRecords
    ? ringCircumference - (Math.min(100, Math.max(0, attendancePct)) / 100) * ringCircumference
    : ringCircumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Top Header Card */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
        padding: "1.25rem 1.75rem",
        borderRadius: "16px",
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600" }}>{dateStr}</span>
            <span style={{ color: "var(--border-subtle)" }}>•</span>
            <span style={{
              backgroundColor: "rgba(37, 99, 235, 0.1)",
              color: "var(--primary)",
              padding: "0.2rem 0.65rem",
              borderRadius: "99px",
              fontWeight: "700",
              fontSize: "0.75rem",
              border: "1px solid rgba(37, 99, 235, 0.2)"
            }}>
              {data?.currentDayOrder === "Leave" ? "Holiday / Leave" : `Day Order ${data?.currentDayOrder || "III"}`}
            </span>
            {data?.tomorrowDayOrder && (
              <span style={{
                backgroundColor: "var(--bg-input)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
                padding: "0.2rem 0.65rem",
                borderRadius: "99px",
                fontSize: "0.75rem",
                fontWeight: "600"
              }}>
                {data.tomorrowDayOrder === "Leave" ? "Tomorrow: Leave" : `Tomorrow: Day ${data.tomorrowDayOrder}`}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 style={{ fontSize: "1.65rem", fontWeight: "800", letterSpacing: "-0.03em", margin: 0, color: "var(--text-main)" }}>
              Welcome back, {data?.student?.name ? data.student.name.split(" ")[0] : "Student"}
            </h1>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>
            {data?.student?.department || "Department"}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
            Semester {data?.student?.semester ?? "—"} • Section {data?.student?.section || "—"} • Class {data?.student?.classId || "—"}
          </div>
        </div>
      </div>

      {/* Main Top Section: Happening Now Banner + Up Next */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {/* Happening Now Banner */}
        <div style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)",
          borderRadius: "18px",
          padding: "1.75rem",
          display: "flex",
          alignItems: "center",
          gap: "1.75rem",
          color: "#ffffff",
          boxShadow: "0 12px 32px -8px rgba(37, 99, 235, 0.45)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Subtle glow orb */}
          <div style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)",
            pointerEvents: "none"
          }} />

          {/* Real-time Dynamic Academic Clock */}
          <div style={{ flexShrink: 0, zIndex: 1 }}>
            <Clock size={120} subtext={activePeriod ? `PERIOD ${activePeriod}` : "COLLEGE"} />
          </div>
          
          <div style={{ zIndex: 1, flex: 1 }}>
            <div style={{
              fontSize: "0.75rem",
              fontWeight: "800",
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.8)",
              marginBottom: "0.4rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#34d399", display: "inline-block", boxShadow: "0 0 8px #34d399" }} />
              HAPPENING NOW
            </div>
            <h2 style={{ fontSize: "1.65rem", fontWeight: "800", margin: "0 0 0.85rem 0", color: "#ffffff", letterSpacing: "-0.02em" }}>
              {happeningNow ? happeningNow.subjectName : "Free Period"}
            </h2>
            {happeningNow && (
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.6rem", fontSize: "0.85rem" }}>
                {(() => {
                  const staffList = (happeningNow.facultyName || "").split(/[,/]+/).map((s: string) => s.trim()).filter(Boolean);
                  const isLab = (happeningNow.subjectName || "").toLowerCase().includes("lab");
                  const isElec = (happeningNow.subjectName || "").toLowerCase().includes("elective");

                  if (staffList.length > 1) {
                    return (
                      <span style={{ backgroundColor: "rgba(255,255,255,0.22)", backdropFilter: "blur(6px)", padding: "0.25rem 0.65rem", borderRadius: "8px", fontWeight: "600", fontSize: "0.8rem" }}>
                        {isLab ? "Lab Faculty: " : isElec ? "Elective: " : "Staff: "}
                        {staffList.join(" • ")}
                      </span>
                    );
                  }
                  return (
                    <span style={{ backgroundColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)", padding: "0.25rem 0.65rem", borderRadius: "8px", fontWeight: "600" }}>
                      {happeningNow.facultyName || "Faculty"}
                    </span>
                  );
                })()}
                <span style={{ backgroundColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)", padding: "0.25rem 0.65rem", borderRadius: "8px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <MapPin size={13} /> Room {happeningNow.roomNo}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Up Next Card */}
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "18px",
          padding: "1.75rem",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                UP NEXT • PERIOD {activePeriod + 1}
              </div>
              {upNext && (
                <span style={{
                  backgroundColor: "rgba(37, 99, 235, 0.1)",
                  color: "var(--primary)",
                  padding: "0.2rem 0.65rem",
                  borderRadius: "99px",
                  fontWeight: "700",
                  fontSize: "0.72rem",
                  border: "1px solid rgba(37, 99, 235, 0.2)"
                }}>
                  Upcoming
                </span>
              )}
            </div>

            <h3 style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--text-main)", margin: "0 0 0.5rem 0", letterSpacing: "-0.02em" }}>
              {upNext ? upNext.subjectName : "No Classes Scheduled"}
            </h3>

            {upNext && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.75rem" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <ClockIcon size={14} />
                  <span>{upNext.timeRange || `Period ${upNext.period}`}</span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <MapPin size={14} />
                  <span>Room: <strong style={{ color: "var(--text-main)" }}>{upNext.roomNo}</strong></span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Faculty: <strong style={{ color: "var(--text-main)" }}>{upNext.facultyName || "N/A"}</strong>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Academic year 2026–2027 • Standard Schedule
          </div>
        </div>
      </div>

      {/* Today's Timetable Horizontal Cards */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-0.02em" }}>
            Today's Schedule {data?.currentDayOrder === "Leave" ? "(Holiday)" : `• Day Order ${data?.currentDayOrder || "I"}`}
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {data?.timetable?.length || 0} periods scheduled
          </span>
        </div>
        
        {(!data?.timetable || data.timetable.length === 0) ? (
          <div style={{
            padding: "2.5rem 1.5rem",
            backgroundColor: "var(--bg-card)",
            borderRadius: "16px",
            border: "1px dashed var(--border-subtle)",
            textAlign: "center",
            color: "var(--text-muted)"
          }}>
            {data?.currentDayOrder === "Leave" ? (
              <>Enjoy your leave! No timetable for today.</>
            ) : (
              <>
                No timetable entries found for class <strong>{data?.student?.classId}</strong> on Day Order <strong>{data?.currentDayOrder}</strong>.
              </>
            )}
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "0.85rem"
          }}>
            {data.timetable.map((p: any, i: number) => {
              const isActive = p.period === activePeriod;
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: isActive ? "var(--primary)" : "var(--bg-card)",
                    color: isActive ? "#ffffff" : "var(--text-main)",
                    borderRadius: "14px",
                    padding: "1rem",
                    border: isActive ? "1px solid var(--primary)" : "1px solid var(--border-subtle)",
                    boxShadow: isActive ? "0 8px 24px -4px rgba(37, 99, 235, 0.4)" : "0 2px 4px rgba(0,0,0,0.03)",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "110px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "800", opacity: isActive ? 0.9 : 0.6, letterSpacing: "0.05em" }}>
                      PERIOD {p.period}
                    </span>
                    {isActive && <span style={{ fontSize: "0.75rem", color: "#fbbf24" }}>● LIVE</span>}
                  </div>
                  <div>
                    <div style={{
                      fontWeight: "700",
                      fontSize: "0.92rem",
                      lineHeight: "1.25",
                      marginTop: "0.4rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {p.subjectCode || p.subjectName}
                    </div>
                    <div style={{
                      fontSize: "0.75rem",
                      opacity: isActive ? 0.85 : 0.6,
                      marginTop: "0.25rem",
                      display: "flex",
                      justifyContent: "space-between"
                    }}>
                      <span>{p.timeRange ? p.timeRange.split("-")[0].trim() : `P${p.period}`}</span>
                      <span>{p.roomNo || "—"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attendance & Notices Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {/* Attendance Card with Live Dynamic Ring */}
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "18px",
          padding: "1.75rem",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            {/* Dynamic SVG Circular Ring */}
            <div style={{ position: "relative", width: "105px", height: "105px", flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                <circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke="var(--border-subtle)"
                  strokeWidth="9"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="9"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontWeight: "800", fontSize: "1.35rem", color: "var(--text-main)", lineHeight: 1 }}>
                  {hasAttendanceRecords ? `${attendancePct}%` : "—"}
                </span>
                <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: "700", letterSpacing: "0.05em", marginTop: "3px" }}>
                  {hasAttendanceRecords ? "OVERALL" : "NO DATA"}
                </span>
              </div>
            </div>

            {/* Attendance Details & Status Pill */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.08em" }}>ATTENDANCE STATUS</div>
                <span style={{
                  backgroundColor: badgeBg,
                  color: badgeColor,
                  border: badgeBorder,
                  padding: "0.2rem 0.6rem",
                  borderRadius: "99px",
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  whiteSpace: "nowrap"
                }}>
                  {badgeText}
                </span>
              </div>

              <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.25rem" }}>
                {hasAttendanceRecords ? `${attendance.attendedPeriods} of ${attendance.totalPeriods} periods attended` : "No attendance recorded"}
              </div>

              <div style={{ fontSize: "0.8rem", fontWeight: "600", color: hasAttendanceRecords ? ringColor : "var(--text-muted)", marginBottom: "0.6rem" }}>
                {statusSubtitle}
              </div>

              {hasAttendanceRecords && (
                <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.75rem", flexWrap: "wrap" }}>
                  <span style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "0.15rem 0.55rem", borderRadius: "6px", fontWeight: "700" }}>
                    P: {attendance.presentPeriods ?? 0}
                  </span>
                  <span style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", color: "var(--primary)", padding: "0.15rem 0.55rem", borderRadius: "6px", fontWeight: "700" }}>
                    OD: {attendance.odPeriods ?? 0}
                  </span>
                  <span style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "0.15rem 0.55rem", borderRadius: "6px", fontWeight: "700" }}>
                    A: {attendance.absentPeriods ?? 0}
                  </span>
                </div>
              )}
            </div>
          </div>

          {hasAttendanceRecords && attendance.subjectWise && attendance.subjectWise.length > 0 && (
            <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {attendance.subjectWise.length} courses tracked
              </span>
              <button
                type="button"
                onClick={() => setShowAttendanceModal(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem"
                }}
              >
                Subject Breakdown <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Department Notices Card */}
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "18px",
          padding: "1.75rem",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.1rem" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-0.02em" }}>
                Department Notices
              </h3>
              <Link href="/student/messages" style={{ fontSize: "0.82rem", color: "var(--primary)", textDecoration: "none", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                View All <ChevronRight size={14} />
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {data?.notices && data.notices.length > 0 ? (
                data.notices.slice(0, 3).map((notice: any) => {
                  let badgeBg = "rgba(37, 99, 235, 0.1)";
                  let badgeFg = "var(--primary)";
                  
                  if (notice.category === "URGENT") {
                    badgeBg = "rgba(239, 68, 68, 0.12)";
                    badgeFg = "#ef4444";
                  } else if (notice.category === "EXAM") {
                    badgeBg = "rgba(245, 158, 11, 0.12)";
                    badgeFg = "#f59e0b";
                  }

                  const now = new Date();
                  const noticeDate = new Date(notice.createdAt);
                  const diffMs = now.getTime() - noticeDate.getTime();
                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                  let timeStr = "";
                  if (diffHours < 24) {
                    timeStr = diffHours === 0 ? "Just now" : `${diffHours}h ago`;
                  } else {
                    const diffDays = Math.floor(diffHours / 24);
                    timeStr = `${diffDays}d ago`;
                  }

                  return (
                    <div key={notice.id} style={{
                      padding: "0.85rem",
                      borderRadius: "12px",
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.35rem"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ backgroundColor: badgeBg, color: badgeFg, padding: "0.15rem 0.5rem", borderRadius: "99px", fontSize: "0.68rem", fontWeight: "800" }}>
                            {notice.category || "GENERAL"}
                          </span>
                          {notice.audience === "SPECIFIC_STUDENT" && (
                            <span style={{ backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#a855f7", padding: "0.15rem 0.5rem", borderRadius: "99px", fontSize: "0.68rem", fontWeight: "800" }}>
                              Targeted
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{timeStr}</span>
                      </div>
                      <div style={{ fontSize: "0.92rem", fontWeight: "700", color: "var(--text-main)" }}>
                        {notice.title}
                      </div>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", lineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {notice.content}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "1.5rem 0" }}>
                  No active notices
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Weekly Timetable Grid */}
      <OverallTimetable
        fullTimetable={data?.fullTimetable}
        currentDayOrder={data?.currentDayOrder}
        title="Weekly Class Timetable"
        subtitle={`Schedule for Class ${data?.student?.classId || "N/A"}`}
        mode="student"
        classId={data?.student?.classId}
        userDetails={{
          name: data?.student?.name,
          rollNumber: data?.student?.vmNo,
          classId: data?.student?.classId,
          department: data?.student?.department,
          semester: data?.student?.semester,
          section: data?.student?.section,
        }}
      />

      {/* Subject-wise Attendance Breakdown Modal */}
      {showAttendanceModal && attendance && (
        <div className="admin-modal-overlay" onClick={() => setShowAttendanceModal(false)}>
          <div className="admin-modal" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text-main)", margin: "0 0 0.25rem 0" }}>
                  Subject Attendance Breakdown
                </h3>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  {data?.student?.classId ? `Class ${data.student.classId}` : "Student Portal"} • Semester {data?.student?.semester ?? "—"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "0.35rem 0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Summary Pill Bar */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.75rem",
              padding: "1rem",
              backgroundColor: "var(--bg-input)",
              borderRadius: "12px",
              marginBottom: "1.25rem",
              textAlign: "center"
            }}>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700" }}>OVERALL</div>
                <div style={{ fontSize: "1.25rem", fontWeight: "800", color: ringColor }}>{attendancePct}%</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700" }}>ATTENDED / TOTAL</div>
                <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text-main)" }}>
                  {attendance.attendedPeriods}/{attendance.totalPeriods}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700" }}>STATUS</div>
                <div style={{ fontSize: "0.88rem", fontWeight: "800", color: badgeColor, marginTop: "2px" }}>{badgeText}</div>
              </div>
            </div>

            {/* Subject List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "340px", overflowY: "auto", paddingRight: "0.25rem" }}>
              {attendance.subjectWise?.map((sub: any, idx: number) => {
                const subPct = Math.round(sub.percentage);
                let subColor = "#10b981";
                if (subPct < 65) subColor = "#ef4444";
                else if (subPct < 75) subColor = "#f59e0b";

                return (
                  <div
                    key={idx}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "12px",
                      border: "1px solid var(--border-subtle)",
                      backgroundColor: "var(--bg-card)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <div>
                        <span style={{ fontWeight: "800", fontSize: "0.92rem", color: "var(--text-main)" }}>
                          {sub.subjectCode}
                        </span>
                        {sub.subjectName && (
                          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                            • {sub.subjectName}
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: "800", fontSize: "1rem", color: subColor }}>
                        {subPct}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ width: "100%", height: "6px", backgroundColor: "var(--bg-input)", borderRadius: "3px", overflow: "hidden", marginBottom: "0.4rem" }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, subPct))}%`,
                          height: "100%",
                          backgroundColor: subColor,
                          borderRadius: "3px",
                          transition: "width 0.5s ease"
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      <span>Attended: {sub.attended} of {sub.total} periods</span>
                      <span style={{ color: subColor, fontWeight: "700" }}>
                        {subPct >= 75 ? "Eligible" : subPct >= 65 ? "Shortage" : "Critical Defaulter"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                className="btn-royal"
                style={{ padding: "0.55rem 1.5rem", fontSize: "0.88rem" }}
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}