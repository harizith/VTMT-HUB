"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Megaphone, Calendar as CalendarIcon } from "lucide-react";

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
      <main className="student-main" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <h2 style={{ color: "var(--text-muted)" }}>Loading your personalized dashboard...</h2>
      </main>
    );
  }

  // Attendance calculations from live API payload
  const attendance = data?.attendance;
  const hasAttendanceRecords = Boolean(attendance?.hasRecords && (attendance?.totalPeriods || 0) > 0);
  const attendancePct = hasAttendanceRecords ? Math.round(attendance.percentage) : 0;

  // LinkedIn theme colors based on official thresholds:
  // >= 75%: LinkedIn Green (#01754F)
  // 65% - 74%: LinkedIn Amber / Gold (#915907)
  // < 65%: Critical Defaulter Red (#D11124)
  let ringColor = "var(--text-muted)";
  let badgeText = "No Records Yet";
  let badgeBg = "var(--bg-input)";
  let badgeBorder = "1px solid var(--border-subtle)";
  let badgeColor = "var(--text-muted)";
  let statusSubtitle = "Attendance records will appear once sessions are marked.";

  if (hasAttendanceRecords) {
    if (attendancePct >= 75) {
      ringColor = "#01754F";
      badgeText = "Good Standing";
      badgeBg = "rgba(1, 117, 79, 0.1)";
      badgeBorder = "1px solid rgba(1, 117, 79, 0.25)";
      badgeColor = "#01754F";
      statusSubtitle = "Above the 75% university requirement";
    } else if (attendancePct >= 65) {
      ringColor = "#915907";
      badgeText = "Shortage Warning";
      badgeBg = "rgba(145, 89, 7, 0.1)";
      badgeBorder = "1px solid rgba(145, 89, 7, 0.25)";
      badgeColor = "#915907";
      statusSubtitle = "Below 75% — Needs condonation approval";
    } else {
      ringColor = "#D11124";
      badgeText = "Critical Defaulter";
      badgeBg = "rgba(209, 17, 36, 0.1)";
      badgeBorder = "1px solid rgba(209, 17, 36, 0.25)";
      badgeColor = "#D11124";
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
    <main className="student-main">
      <header className="student-header" style={{ alignItems: "center" }}>
        <div>
          <div className="student-date" style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: "600" }}>{dateStr}</span>
            <span style={{ color: "var(--border-subtle)" }}>•</span>
            <span style={{ backgroundColor: "rgba(10, 102, 194, 0.1)", color: "var(--royal-blue)", padding: "0.15rem 0.6rem", borderRadius: "12px", fontWeight: "700", fontSize: "0.75rem", border: "1px solid rgba(10, 102, 194, 0.2)" }}>
              {data?.currentDayOrder === "Leave" ? "Holiday / Leave" : `Day Order ${data?.currentDayOrder || "III"}`}
            </span>
            {data?.tomorrowDayOrder && (
              <span style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)", padding: "0.15rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600" }}>
                {data.tomorrowDayOrder === "Leave" ? "Tomorrow: Leave" : `Tomorrow: Day ${data.tomorrowDayOrder}`}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "700", letterSpacing: "-0.02em" }}>
              Welcome, {data?.student?.name ? data.student.name.split(" ")[0] : "Student"}
            </h1>
          </div>
        </div>
        <div className="student-course-info" style={{ textAlign: "right" }}>
          <strong style={{ fontSize: "0.95rem", color: "var(--text-main)" }}>{data?.student?.department || "Department"}</strong>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Semester {data?.student?.semester ?? "—"} • Section {data?.student?.section || "—"}</span>
        </div>
      </header>

      {/* Main Top Section: Banner + Up Next */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Happening Now Banner */}
        <div className="student-banner">
          {/* Real-time Dynamic Academic Clock */}
          <div style={{ flexShrink: 0 }}>
            <Clock size={125} subtext={activePeriod ? `PERIOD ${activePeriod}` : "COLLEGE"} />
          </div>
          
          <div style={{ zIndex: 1 }}>
            <div style={{ fontSize: "0.85rem", fontWeight: "700", letterSpacing: "0.05em", color: "rgba(255,255,255,0.7)", marginBottom: "0.5rem" }}>HAPPENING NOW</div>
            <h2 style={{ fontSize: "1.8rem", fontWeight: "700", margin: "0 0 1rem 0", color: "#fff" }}>{happeningNow ? happeningNow.subjectName : "Free Period"}</h2>
            {happeningNow && (
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.6rem", fontSize: "0.9rem", color: "#fff" }}>
                {(() => {
                  const staffList = (happeningNow.facultyName || "").split(/[,/]+/).map((s: string) => s.trim()).filter(Boolean);
                  const isLab = (happeningNow.subjectName || "").toLowerCase().includes("lab");
                  const isElec = (happeningNow.subjectName || "").toLowerCase().includes("elective");

                  if (staffList.length > 1) {
                    return (
                      <span style={{ backgroundColor: "rgba(255,255,255,0.22)", padding: "0.2rem 0.65rem", borderRadius: "6px", fontWeight: "600", fontSize: "0.82rem" }}>
                        {isLab ? "Lab Staff: " : isElec ? "Elective Faculty: " : "Faculty: "}
                        {staffList.join(" • ")}
                      </span>
                    );
                  }
                  return (
                    <span style={{ backgroundColor: "rgba(255,255,255,0.2)", padding: "0.2rem 0.6rem", borderRadius: "6px", fontWeight: "600" }}>
                      {happeningNow.facultyName || "Faculty"}
                    </span>
                  );
                })()}
                <span>Room {happeningNow.roomNo}</span>
              </div>
            )}
          </div>
        </div>

        {/* Up Next Card */}
        <div className="student-card premium-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>UP NEXT • P{activePeriod + 1}</div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text-main)", margin: "0 0 0.5rem 0" }}>{upNext ? upNext.subjectName : "No Classes Scheduled"}</h3>
            {upNext && (
              <>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  {(() => {
                    const staffList = (upNext.facultyName || "").split(/[,/]+/).map((s: string) => s.trim()).filter(Boolean);
                    const isLab = (upNext.subjectName || "").toLowerCase().includes("lab");
                    const isElec = (upNext.subjectName || "").toLowerCase().includes("elective");

                    if (staffList.length > 1) {
                      return (
                        <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                          {isLab ? "Lab Staff: " : isElec ? "Elective Faculty: " : "Staff: "}
                          {staffList.join(" • ")}
                        </span>
                      );
                    }
                    return <span>{upNext.facultyName || "Faculty"}</span>;
                  })()}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  {upNext.roomNo}
                </div>
              </>
            )}
          </div>
          {upNext && (
            <span style={{ backgroundColor: "rgba(10, 102, 194, 0.1)", color: "var(--royal-blue)", padding: "0.35rem 0.85rem", borderRadius: "16px", fontWeight: "700", fontSize: "0.75rem", alignSelf: "flex-start", border: "1px solid rgba(10, 102, 194, 0.2)" }}>
              Upcoming
            </span>
          )}
        </div>
      </div>

      {/* Today's Timetable */}
      <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "1rem" }}>Today's timetable {data?.currentDayOrder === "Leave" ? "" : `(Day Order ${data?.currentDayOrder})`}</h3>
      
      {(!data?.timetable || data.timetable.length === 0) ? (
        <div style={{ padding: "2rem", backgroundColor: "var(--bg-card)", borderRadius: "12px", border: "1px dashed var(--border-subtle)", textAlign: "center", color: "var(--text-muted)", marginBottom: "2rem" }}>
          {data?.currentDayOrder === "Leave" ? (
            <>Enjoy your leave! No timetable for today.</>
          ) : (
            <>
              No timetable found in the database for your class ({data?.student?.classId}) on Day Order {data?.currentDayOrder}. <br />
              <strong>(Please add timetable entries in the Admin Panel to see them here).</strong>
            </>
          )}
        </div>
      ) : (
        <div className="student-timetable-scroll">
          {data.timetable.map((p: any, i: number) => {
            const isActive = p.period === activePeriod;
            return (
              <div key={i} className={`period-card ${isActive ? "active" : ""}`}>
                <div className="period-number" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>P{p.period}</span>
                  {isActive && <span style={{ color: "#f59e0b" }}>★</span>}
                </div>
                <div className="period-time">{p.timeRange || `Period ${p.period}`}</div>
                <div className="period-subject">{p.subjectName}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" }}>
        {/* Attendance Card with Live Dynamic Ring */}
        <div className="student-card premium-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            {/* Dynamic SVG Circular Ring */}
            <div className="attendance-ring" style={{ position: "relative", width: "100px", height: "100px", flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke="var(--border-subtle)"
                  strokeWidth="9"
                />
                {/* Dynamic Value Arc */}
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
                <span style={{ fontWeight: "800", fontSize: "1.25rem", color: "var(--text-main)", lineHeight: 1 }}>
                  {hasAttendanceRecords ? `${attendancePct}%` : "—"}
                </span>
                <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: "600", marginTop: "2px" }}>
                  {hasAttendanceRecords ? "OVERALL" : "NO DATA"}
                </span>
              </div>
            </div>

            {/* Attendance Details & Status Pill */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.05em" }}>ATTENDANCE</div>
                <span style={{
                  backgroundColor: badgeBg,
                  color: badgeColor,
                  border: badgeBorder,
                  padding: "0.15rem 0.55rem",
                  borderRadius: "12px",
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  whiteSpace: "nowrap"
                }}>
                  {badgeText}
                </span>
              </div>

              <div style={{ fontSize: "1.02rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.2rem" }}>
                {hasAttendanceRecords ? `${attendance.attendedPeriods} of ${attendance.totalPeriods} periods attended` : "No attendance recorded"}
              </div>

              <div style={{ fontSize: "0.76rem", fontWeight: "600", color: hasAttendanceRecords ? ringColor : "var(--text-muted)", marginBottom: "0.45rem" }}>
                {statusSubtitle}
              </div>

              {hasAttendanceRecords && (
                <div style={{ display: "flex", gap: "0.4rem", fontSize: "0.72rem", flexWrap: "wrap" }}>
                  <span style={{ backgroundColor: "rgba(1, 117, 79, 0.08)", color: "#01754F", padding: "0.1rem 0.45rem", borderRadius: "4px", fontWeight: "600" }}>
                    P: {attendance.presentPeriods ?? 0}
                  </span>
                  <span style={{ backgroundColor: "rgba(10, 102, 194, 0.08)", color: "var(--royal-blue, #0a66c2)", padding: "0.1rem 0.45rem", borderRadius: "4px", fontWeight: "600" }}>
                    OD: {attendance.odPeriods ?? 0}
                  </span>
                  <span style={{ backgroundColor: "rgba(209, 17, 36, 0.08)", color: "#D11124", padding: "0.1rem 0.45rem", borderRadius: "4px", fontWeight: "600" }}>
                    A: {attendance.absentPeriods ?? 0}
                  </span>
                </div>
              )}
            </div>
          </div>

          {hasAttendanceRecords && attendance.subjectWise && attendance.subjectWise.length > 0 && (
            <div style={{ marginTop: "0.85rem", paddingTop: "0.65rem", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {attendance.subjectWise.length} subject{attendance.subjectWise.length > 1 ? "s" : ""} recorded
              </span>
              <button
                type="button"
                onClick={() => setShowAttendanceModal(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--royal-blue, #0a66c2)",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem"
                }}
              >
                Subject Breakdown →
              </button>
            </div>
          )}
        </div>

        {/* Notices Card */}
        <div className="student-card premium-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>Department notices</h3>
            <Link href="/student/messages" style={{ fontSize: "0.8rem", color: "var(--royal-blue)", textDecoration: "none", fontWeight: "600" }}>
              View All →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {data?.notices && data.notices.length > 0 ? (
              data.notices.map((notice: any) => {
                // Determine color based on category
                let badgeColor = "rgba(79, 70, 229, 0.1)";
                let textColor = "#4f46e5";
                
                if (notice.category === "URGENT") {
                  badgeColor = "rgba(239, 68, 68, 0.1)";
                  textColor = "#ef4444";
                } else if (notice.category === "EXAM") {
                  badgeColor = "rgba(217, 119, 6, 0.1)";
                  textColor = "#d97706";
                }

                // Calculate relative time (e.g. 2h ago, 1d ago)
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
                  <div key={notice.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-subtle)", gap: "0.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ backgroundColor: badgeColor, color: textColor, padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.65rem", fontWeight: "700" }}>{notice.category || "GENERAL"}</span>
                        {notice.audience === "SPECIFIC_STUDENT" && (
                          <span style={{ backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#a855f7", padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.65rem", fontWeight: "700" }}>For You</span>
                        )}
                      </div>
                      <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)" }}>{notice.title}</span>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", lineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>{notice.content}</p>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{timeStr}</span>
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "1rem 0" }}>No new notices</div>
            )}
          </div>
        </div>
      </div>

      {/* Overall Timetable Section at Bottom */}
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
          <div className="admin-modal" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text-main)", margin: "0 0 0.25rem 0" }}>
                  Subject Attendance Breakdown
                </h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {data?.student?.classId ? `Class ${data.student.classId}` : "Student Portal"} • Semester {data?.student?.semester ?? "—"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "0.2rem 0.5rem"
                }}
              >
                ✕
              </button>
            </div>

            {/* Quick Summary Pill Bar */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.75rem",
              padding: "0.75rem",
              backgroundColor: "var(--bg-input)",
              borderRadius: "8px",
              marginBottom: "1.25rem",
              textAlign: "center"
            }}>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "600" }}>OVERALL</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "800", color: ringColor }}>{attendancePct}%</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "600" }}>ATTENDED / TOTAL</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-main)" }}>
                  {attendance.attendedPeriods}/{attendance.totalPeriods}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "600" }}>STATUS</div>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: badgeColor, marginTop: "2px" }}>{badgeText}</div>
              </div>
            </div>

            {/* Subject List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "300px", overflowY: "auto", paddingRight: "0.25rem" }}>
              {attendance.subjectWise?.map((sub: any, idx: number) => {
                const subPct = Math.round(sub.percentage);
                let subColor = "#01754F";
                if (subPct < 65) subColor = "#D11124";
                else if (subPct < 75) subColor = "#915907";

                return (
                  <div
                    key={idx}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-subtle)",
                      backgroundColor: "var(--bg-card)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <div>
                        <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--text-main)" }}>
                          {sub.subjectCode}
                        </span>
                        {sub.subjectName && (
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                            • {sub.subjectName}
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: "800", fontSize: "0.95rem", color: subColor }}>
                        {subPct}%
                      </span>
                    </div>

                    {/* Mini progress bar */}
                    <div style={{ width: "100%", height: "6px", backgroundColor: "var(--bg-input)", borderRadius: "3px", overflow: "hidden", marginBottom: "0.35rem" }}>
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

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      <span>Attended: {sub.attended} of {sub.total} periods</span>
                      <span style={{ color: subColor, fontWeight: "600" }}>
                        {subPct >= 75 ? "Eligible" : subPct >= 65 ? "Shortage" : "Defaulter"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "1.25rem", textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                className="btn-royal"
                style={{ padding: "0.45rem 1.25rem", fontSize: "0.85rem" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
