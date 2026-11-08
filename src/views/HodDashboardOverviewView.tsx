
"use client";

import { useEffect, useState } from "react";
import { Users, Megaphone, Calendar as CalendarIcon, BookOpen, Clock as ClockIcon, ChevronRight, Activity, TrendingUp, CheckCircle, Briefcase } from "lucide-react";
import Link from "next/link";
import AcademicClock from "@/components/Clock";
import OverallTimetable from "@/components/OverallTimetable";
import Heatmap from "@/components/Heatmap";

export default function HodDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [selectedTimelineDay, setSelectedTimelineDay] = useState<string>("I");

  // Notice form state
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeAudience, setNoticeAudience] = useState("ALL");
  const [noticeCategory, setNoticeCategory] = useState("GENERAL");
  const [postingNotice, setPostingNotice] = useState(false);

  const handlePostNotice = async () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
    setPostingNotice(true);
    try {
      const res = await fetch("/api/hod/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noticeTitle,
          content: noticeContent,
          audience: noticeAudience,
          category: noticeCategory
        })
      });
      const resData = await res.json();
      if (resData.success) {
        // Optimistically add to top of list
        setData((prev: any) => ({
          ...prev,
          notices: [resData.data, ...(prev.notices || [])]
        }));
        setNoticeTitle("");
        setNoticeContent("");
        setShowNoticeForm(false);
      }
    } catch (e) {
      console.error(e);
    }
    setPostingNotice(false);
  };

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // update every min

    fetch("/api/hod/dashboard")
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setData(res.data);
          if (res.data.currentDayOrder && res.data.currentDayOrder !== "Leave") {
            setSelectedTimelineDay(res.data.currentDayOrder);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("API error:", err);
        setLoading(false);
      });

    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  const dateStr = currentTime.toLocaleDateString("en-US", { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = currentTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });

  // Period timing calculation for Vel Tech Multi Tech college schedule
  const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
  const isCollegeHours = currentMins >= 480 && currentMins <= 945; // 8:00 AM to 3:45 PM
  let activePeriod = 0;
  if (currentMins >= 480 && currentMins < 535) activePeriod = 1;       // 08:05 - 08:55
  else if (currentMins >= 535 && currentMins < 590) activePeriod = 2;  // 08:55 - 09:45
  else if (currentMins >= 595 && currentMins < 650) activePeriod = 3;  // 10:00 - 10:50
  else if (currentMins >= 650 && currentMins < 710) activePeriod = 4;  // 10:50 - 11:40
  else if (currentMins >= 735 && currentMins < 785) activePeriod = 5;  // 12:20 - 01:05
  else if (currentMins >= 785 && currentMins < 840) activePeriod = 6;  // 01:05 - 01:50
  else if (currentMins >= 840 && currentMins < 890) activePeriod = 7;  // 02:00 - 02:45
  else if (currentMins >= 890 && currentMins <= 945) activePeriod = 8; // 02:45 - 03:30

  const todayEntries = data?.fullTimetable?.[data?.currentDayOrder] || data?.timetable || [];
  const happeningNow = isCollegeHours ? todayEntries.find((t: any) => t.period === activePeriod) : null;
  const upNext = isCollegeHours ? todayEntries.find((t: any) => t.period === activePeriod + 1) : todayEntries[0];

  if (loading) {
    return (
      <main className="student-main" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div className="loading-spinner"></div>
          <h2 style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Syncing your dashboard...</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="student-main">
      <header className="student-header" style={{ marginBottom: "2rem" }}>
        <div>
          <div className="student-date" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CalendarIcon size={14} /> {dateStr}
            <span style={{ color: "var(--border-subtle)" }}>|</span>
            <ClockIcon size={14} /> {timeStr}
            <span style={{ color: "var(--border-subtle)" }}>|</span>
            <span style={{ backgroundColor: "rgba(56, 189, 248, 0.1)", color: "var(--sky-blue)", padding: "0.1rem 0.5rem", borderRadius: "4px", fontWeight: "700" }}>
              {data?.currentDayOrder === "Leave" ? "Today: Leave / Holiday" : `Today: Day Order ${data?.currentDayOrder || "III"}`}
            </span>
            {data?.tomorrowDayOrder && (
              <span style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)", padding: "0.1rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600" }}>
                {data.tomorrowDayOrder === "Leave" ? "Tomorrow: Leave" : `Tomorrow: Day Order ${data.tomorrowDayOrder}`}
              </span>
            )}

            <div style={{ marginLeft: "1rem" }}>
              <AcademicClock size={40} subtext="" />
            </div>
          </div>
          <h1>Welcome back, <span style={{ background: "linear-gradient(90deg, var(--royal-blue), var(--sky-blue))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{data?.hod?.name ? data.hod.name.split(" ")[0] : "HOD"}</span> 👋</h1>
        </div>
        <div className="student-course-info" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
          <strong style={{ fontSize: "1rem" }}>Department of {data?.hod?.department || "CSE"}</strong>
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{data?.hod?.designation || "Head of Department"}</span>
        </div>
      </header>

      {/* Hero Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div className="student-card premium-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", borderTop: "3px solid var(--sky-blue)" }}>
          <div style={{ width: "45px", height: "45px", borderRadius: "10px", backgroundColor: "rgba(56, 189, 248, 0.1)", color: "var(--sky-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={20} />
          </div>
          <div>
            <p style={{ margin: "0 0 0.2rem 0", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>TOTAL STUDENTS</p>
            <h3 style={{ margin: 0, fontSize: "1.5rem", color: "var(--text-main)" }}>1,200</h3>
          </div>
        </div>
        <div className="student-card premium-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", borderTop: "3px solid #22c55e" }}>
          <div style={{ width: "45px", height: "45px", borderRadius: "10px", backgroundColor: "rgba(34, 197, 94, 0.1)", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Briefcase size={20} />
          </div>
          <div>
            <p style={{ margin: "0 0 0.2rem 0", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>FACULTY MEMBERS</p>
            <h3 style={{ margin: 0, fontSize: "1.5rem", color: "var(--text-main)" }}>45</h3>
          </div>
        </div>
        <div className="student-card premium-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", borderTop: "3px solid #a855f7" }}>
          <div style={{ width: "45px", height: "45px", borderRadius: "10px", backgroundColor: "rgba(168, 85, 247, 0.1)", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <p style={{ margin: "0 0 0.2rem 0", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>DEPT ATTENDANCE</p>
            <h3 style={{ margin: 0, fontSize: "1.5rem", color: "var(--text-main)" }}>89%</h3>
          </div>
        </div>
      </div>
      
      {/* Attendance Heatmap */}
      <div className="student-card premium-card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "1rem" }}>Departmental Attendance Heatmap</h3>
        <Heatmap />
      </div>

      {/* Main Grid Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "1.5rem", marginBottom: "2rem" }}>

        {/* Left Column: Schedule & Ongoing */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Current Class Banner */}
          <div className="student-banner" style={{ background: "linear-gradient(135deg, var(--royal-blue) 0%, #1e3a8a 100%)", borderRadius: "16px", padding: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 25px -5px rgba(29, 78, 216, 0.4)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <span style={{ display: "inline-flex", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isCollegeHours && happeningNow ? "#22c55e" : "#f59e0b", boxShadow: isCollegeHours && happeningNow ? "0 0 10px #22c55e" : "0 0 10px #f59e0b" }}></span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", letterSpacing: "0.05em", color: "rgba(255,255,255,0.8)" }}>
                  {isCollegeHours ? `HAPPENING NOW (PERIOD ${activePeriod || 1})` : "OFF-COLLEGE HOURS"}
                </span>
              </div>
              <h2 style={{ fontSize: "2rem", fontWeight: "800", margin: "0 0 0.5rem 0", color: "#fff", lineHeight: 1.2 }}>
                {isCollegeHours
                  ? (happeningNow ? happeningNow.subjectName : "Department Administration / Executive Hours")
                  : "Department Operations In Order"}
              </h2>
              {isCollegeHours && happeningNow ? (
                <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: "0.95rem" }}>
                  Class: <strong>{happeningNow.classId}</strong> | Room: <strong>{happeningNow.roomNo}</strong> ({happeningNow.timeRange})
                </p>
              ) : (
                <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: "0.95rem" }}>
                  {isCollegeHours ? "No active lecture scheduled for this period. Managing department operations." : "Next academic lecture will resume during regular college hours."}
                </p>
              )}

              <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
                <Link href="/hod/department" style={{ backgroundColor: "#fff", color: "var(--royal-blue)", padding: "0.6rem 1.2rem", borderRadius: "8px", fontWeight: "700", fontSize: "0.9rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Activity size={16} /> View Reports
                </Link>
              </div>
            </div>

            {/* Real-time Dynamic Academic Clock */}
            <div style={{ flexShrink: 0 }}>
              <AcademicClock size={125} subtext={isCollegeHours && happeningNow ? `PERIOD ${activePeriod}` : "EXECUTIVE"} />
            </div>
          </div>

          {/* Today's Schedule & Day Switcher */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
                Your Teaching Timeline
              </h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Viewing Day Order {selectedTimelineDay}
              </span>
            </div>

            {/* Day Order Selector Pills */}
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
              {["I", "II", "III", "IV", "V"].map((doStr) => {
                const isSelected = selectedTimelineDay === doStr;
                const isToday = data?.currentDayOrder === doStr;
                return (
                  <button
                    key={doStr}
                    onClick={() => setSelectedTimelineDay(doStr)}
                    style={{
                      padding: "0.4rem 0.85rem",
                      borderRadius: "8px",
                      border: isSelected ? "1px solid var(--royal-blue)" : "1px solid var(--border-subtle)",
                      backgroundColor: isSelected ? "var(--royal-blue)" : "var(--bg-input)",
                      color: isSelected ? "#fff" : "var(--text-main)",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <span>Day {doStr}</span>
                    {isToday && (
                      <span style={{ fontSize: "0.6rem", padding: "0.1rem 0.35rem", borderRadius: "4px", backgroundColor: isSelected ? "rgba(255,255,255,0.25)" : "rgba(34,197,94,0.15)", color: isSelected ? "#fff" : "#22c55e", fontWeight: 800 }}>
                        TODAY
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 8-Period Timeline */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { period: 1, defaultTime: "08:05 - 08:55" },
                { period: 2, defaultTime: "08:55 - 09:45" },
                { period: 3, defaultTime: "10:00 - 10:50" },
                { period: 4, defaultTime: "10:50 - 11:40" },
                { period: 5, defaultTime: "12:20 - 01:05" },
                { period: 6, defaultTime: "01:05 - 01:50" },
                { period: 7, defaultTime: "02:00 - 02:45" },
                { period: 8, defaultTime: "02:45 - 03:30" },
              ].map(({ period, defaultTime }) => {
                const currentDayList = data?.fullTimetable?.[selectedTimelineDay] || [];
                const p = currentDayList.find((e: any) => e.period === period);
                const hasClass = Boolean(p && p.subjectName);
                const isNow = selectedTimelineDay === data?.currentDayOrder && period === activePeriod && isCollegeHours;
                const isPast = selectedTimelineDay === data?.currentDayOrder && period < activePeriod && isCollegeHours;

                return (
                  <div key={period} style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: isNow ? "rgba(29, 78, 216, 0.08)" : hasClass ? "var(--bg-card)" : "var(--bg-input)",
                    border: isNow ? "2px solid var(--royal-blue)" : "1px solid var(--border-subtle)",
                    borderRadius: "12px",
                    padding: "0.9rem 1rem",
                    position: "relative",
                    overflow: "hidden",
                    opacity: isPast ? 0.65 : 1,
                    transition: "all 0.15s ease"
                  }}>
                    {isNow && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", backgroundColor: "var(--royal-blue)" }}></div>}

                    <div style={{ width: "85px", flexShrink: 0, borderRight: "1px solid var(--border-subtle)", paddingRight: "0.75rem", marginRight: "0.75rem" }}>
                      <div style={{ fontSize: "0.95rem", fontWeight: "800", color: isNow ? "var(--royal-blue)" : hasClass ? "var(--text-main)" : "var(--text-muted)" }}>
                        P{period}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {p?.timeRange || defaultTime}
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      {hasClass ? (
                        <>
                          <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0284c7" }}>
                            {p.subjectName}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "0.25rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            <span><strong style={{ color: "var(--text-main)" }}>Class:</strong> {p.classId}</span>
                            <span><strong style={{ color: "var(--text-main)" }}>Room:</strong> {p.roomNo || "Assigned Lab"}</span>
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                          Department Administration / Free Period
                        </div>
                      )}
                    </div>

                    {isNow && (
                      <div style={{ backgroundColor: "rgba(56, 189, 248, 0.15)", color: "var(--sky-blue)", padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800" }}>
                        NOW
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Up Next, Tasks, Notices */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Quick Actions */}
          <div className="student-card premium-card">
            <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-main)", margin: "0 0 1rem 0" }}>Quick Actions</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "0.75rem" }}>
              <Link href="/hod/courses" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "1rem 0.5rem", borderRadius: "10px", textAlign: "center", textDecoration: "none", fontWeight: "600", fontSize: "0.85rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", transition: "all 0.2s" }} className="hover-lift">
                <BookOpen size={20} />
                Course Catalog
              </Link>
              <Link href="/hod/faculty" style={{ backgroundColor: "rgba(56, 189, 248, 0.1)", color: "var(--sky-blue)", padding: "1rem 0.5rem", borderRadius: "10px", textAlign: "center", textDecoration: "none", fontWeight: "600", fontSize: "0.85rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", transition: "all 0.2s" }} className="hover-lift">
                <Users size={20} />
                Manage Staff
              </Link>
              <Link href="/hod/department" style={{ backgroundColor: "rgba(168, 85, 247, 0.1)", color: "#a855f7", padding: "1rem 0.5rem", borderRadius: "10px", textAlign: "center", textDecoration: "none", fontWeight: "600", fontSize: "0.85rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", transition: "all 0.2s" }} className="hover-lift">
                <Activity size={20} />
                Dept Stats
              </Link>
            </div>
          </div>

          {/* Notices */}
          <div className="student-card premium-card" style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 1rem 0" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Megaphone size={18} /> Announcements
              </h3>
              <Link href="/hod/notices" style={{ fontSize: "0.8rem", color: "var(--royal-blue)", textDecoration: "none", fontWeight: "600" }}>
                View All →
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {showNoticeForm ? (
                <div style={{ padding: "1rem", backgroundColor: "var(--bg-card-header)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                  <input
                    type="text"
                    placeholder="Notice Title"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "4px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-main)", color: "var(--text-main)" }}
                  />
                  <textarea
                    placeholder="Notice details..."
                    value={noticeContent}
                    onChange={(e) => setNoticeContent(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "4px", border: "1px solid var(--border-subtle)", minHeight: "80px", backgroundColor: "var(--bg-main)", color: "var(--text-main)" }}
                  />
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <select
                      value={noticeAudience}
                      onChange={(e) => setNoticeAudience(e.target.value)}
                      style={{ flex: 1, padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-main)", color: "var(--text-main)" }}
                    >
                      <option value="ALL">All (Students & Faculty)</option>
                      <option value="STUDENT">Students Only</option>
                      <option value="FACULTY">Faculty Only</option>
                    </select>
                    <select
                      value={noticeCategory}
                      onChange={(e) => setNoticeCategory(e.target.value)}
                      style={{ flex: 1, padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-main)", color: "var(--text-main)" }}
                    >
                      <option value="GENERAL">General</option>
                      <option value="URGENT">Urgent</option>
                      <option value="EXAM">Exam</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={handlePostNotice}
                      disabled={postingNotice}
                      style={{ flex: 1, padding: "0.5rem", backgroundColor: "var(--royal-blue)", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "600", cursor: postingNotice ? "not-allowed" : "pointer" }}
                    >
                      {postingNotice ? "Posting..." : "Post Notice"}
                    </button>
                    <button
                      onClick={() => setShowNoticeForm(false)}
                      style={{ padding: "0.5rem", backgroundColor: "transparent", color: "var(--text-muted)", border: "1px solid var(--border-subtle)", borderRadius: "4px", fontWeight: "600", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                data?.notices && data.notices.length > 0 ? (
                  data.notices.map((notice: any) => {
                    let badgeColor = "rgba(79, 70, 229, 0.1)";
                    let textColor = "#4f46e5";

                    if (notice.category === "URGENT") {
                      badgeColor = "rgba(239, 68, 68, 0.1)";
                      textColor = "#ef4444";
                    } else if (notice.category === "EXAM") {
                      badgeColor = "rgba(217, 119, 6, 0.1)";
                      textColor = "#d97706";
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
                      <div key={notice.id} style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <span style={{ backgroundColor: badgeColor, color: textColor, padding: "0.1rem 0.4rem", borderRadius: "4px", fontSize: "0.65rem", fontWeight: "800", letterSpacing: "0.05em" }}>{notice.category || "GENERAL"}</span>
                          {notice.audience !== "ALL" && (
                            <span style={{ backgroundColor: "var(--bg-card-header)", color: "var(--text-muted)", padding: "0.1rem 0.4rem", borderRadius: "4px", fontSize: "0.6rem", fontWeight: "800", letterSpacing: "0.05em", border: "1px solid var(--border-subtle)" }}>
                              {notice.audience}
                            </span>
                          )}
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "auto" }}>{timeStr}</span>
                        </div>
                        <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.95rem", color: "var(--text-main)" }}>{notice.title}</h4>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>{notice.content}</p>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "1rem 0" }}>No recent notices</div>
                )
              )}
            </div>
            {!showNoticeForm && (
              <button
                onClick={() => setShowNoticeForm(true)}
                style={{ width: "100%", marginTop: "1rem", padding: "0.6rem", background: "none", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-main)", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer" }}
              >
                Post New Notice
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Overall Timetable Section at Bottom */}
      <OverallTimetable
        fullTimetable={data?.fullTimetable}
        currentDayOrder={data?.currentDayOrder}
        title="Department Executive Schedule"
        subtitle={`HOD Teaching & Executive Schedule: ${data?.hod?.name || "HOD"} (${data?.hod?.vmNo || "N/A"}) • ${data?.hod?.department || "CSE"}`}
        mode="hod"
        facultyName={data?.hod?.name}
        userDetails={{
          name: data?.hod?.name,
          vmNo: data?.hod?.vmNo,
          department: data?.hod?.department,
          designation: data?.hod?.designation || "Head of Department (HOD)",
        }}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .hover-lift:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
      `}} />
    </main>
  );
}
