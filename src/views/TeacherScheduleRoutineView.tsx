"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiHome, FiCalendar, FiBell, FiUser, FiLogOut, FiClock, FiMapPin } from "react-icons/fi";
import { signOut } from "next-auth/react";

interface TimetableEntry {
  id: string;
  dayOrder: string | null;
  period: number | null;
  timeRange: string | null;
  subjectCode: string | null;
  subjectName: string | null;
  classId: string | null;
  roomNo: string | null;
}

export default function TeacherCalendarPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("I");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/teacher/calendar")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || "Failed to load calendar data.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("An error occurred while fetching data.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="student-main" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const dayOrders = ["I", "II", "III", "IV", "V"];
  if (data?.timetable?.UNASSIGNED?.length) dayOrders.push("UNASSIGNED");
  const currentEntries: TimetableEntry[] = data?.timetable?.[activeTab] || [];

  return (
    <main className="student-main">
      <header className="student-header">
        <div>
          <h1>My Schedule</h1>
          <p className="student-subtitle">Faculty: {data?.teacherName || "Loading..."}</p>
        </div>
      </header>

      {error && (
        <div style={{ backgroundColor: "var(--bg-card)", color: "#ef4444", padding: "1rem", borderRadius: "8px", marginBottom: "2rem", border: "1px solid #fca5a5" }}>
          {error}
        </div>
      )}

      <div className="student-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card-header)" }}>
          {dayOrders.map(doStr => (
            <button
              key={doStr}
              onClick={() => setActiveTab(doStr)}
              style={{
                flex: 1,
                padding: "1rem",
                textAlign: "center",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer",
                backgroundColor: activeTab === doStr ? "var(--bg-card)" : "transparent",
                color: activeTab === doStr ? "var(--royal-blue)" : "var(--text-muted)",
                borderBottom: activeTab === doStr ? "2px solid var(--royal-blue)" : "2px solid transparent",
                transition: "all 0.2s"
              }}
            >
              {doStr === "UNASSIGNED" ? "Unassigned" : `Day Order ${doStr}`}
            </button>
          ))}
        </div>

        {/* Schedule List */}
        <div style={{ padding: "1.5rem" }}>
          {currentEntries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
              <FiCalendar style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.2 }} />
              <h3>No classes scheduled</h3>
              <p>{activeTab === "UNASSIGNED" ? "These entries are missing a day order." : `You have a free day for Day Order ${activeTab}`}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {currentEntries.map((entry, idx) => (
                <div key={idx} style={{ 
                  display: "flex", 
                  backgroundColor: "var(--bg-input)", 
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid var(--border-subtle)"
                }}>
                  {/* Time column */}
                  <div style={{ 
                    backgroundColor: "rgba(29, 78, 216, 0.05)",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "100px",
                    borderRight: "1px dashed var(--border-subtle)"
                  }}>
                    <span style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--royal-blue)" }}>{entry.period ? `P${entry.period}` : "Period —"}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", textAlign: "center" }}>
                      {entry.timeRange ? entry.timeRange.replace("-", "\n") : "Time not set"}
                    </span>
                  </div>
                  
                  {/* Details column */}
                  <div style={{ padding: "1.25rem", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text-main)" }}>{entry.subjectName || "Subject not set"}</h3>
                      <span style={{ fontSize: "0.8rem", backgroundColor: "var(--bg-card)", padding: "0.2rem 0.5rem", borderRadius: "4px", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                        {entry.subjectCode || "—"}
                      </span>
                    </div>
                    
                    <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        <FiUser style={{ color: "var(--sky-blue)" }} />
                        <span>Class: {entry.classId || "—"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        <FiMapPin style={{ color: "#10b981" }} />
                        <span>Room {entry.roomNo || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
