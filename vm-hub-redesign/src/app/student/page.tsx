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

  return (
    <main className="student-main">
      <header className="student-header" style={{ alignItems: "center" }}>
        <div>
          <div className="student-date" style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: "600" }}>{dateStr}</span>
            <span style={{ color: "var(--border-subtle)" }}>•</span>
            <span style={{ backgroundColor: "rgba(11, 93, 82, 0.1)", color: "var(--royal-blue)", padding: "0.15rem 0.6rem", borderRadius: "12px", fontWeight: "700", fontSize: "0.75rem", border: "1px solid rgba(11, 93, 82, 0.2)" }}>
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
            <span style={{ backgroundColor: "rgba(11, 93, 82, 0.1)", color: "var(--royal-blue)", padding: "0.35rem 0.85rem", borderRadius: "16px", fontWeight: "700", fontSize: "0.75rem", alignSelf: "flex-start", border: "1px solid rgba(11, 93, 82, 0.2)" }}>
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
        {/* Attendance Card */}
        <div className="student-card premium-card" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div className="attendance-ring" style={{ position: "relative" }}>
            <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-subtle)" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray="251.2" strokeDashoffset="32.65" strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.2rem", color: "var(--text-main)" }}>
              87%
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>ATTENDANCE</div>
            <div style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.25rem" }}>Overall this semester</div>
            <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "#10b981" }}>Above the 75% attendance bar</div>
          </div>
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
                let badgeColor = "rgba(11, 93, 82, 0.1)";
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
                          <span style={{ backgroundColor: "rgba(122, 106, 158, 0.15)", color: "#7a6a9e", padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.65rem", fontWeight: "700" }}>For You</span>
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
    </main>
  );
}
