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
  facultyName: string | null;
  roomNo: string | null;
}

export default function CalendarPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("I");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/student/calendar")
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
      <div className="admin-layout">
        <div className="admin-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <div className="loading-spinner"></div>
        </div>
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
          <h1>Weekly Calendar</h1>
          <p className="student-subtitle">Class: {data?.classId || "N/A"}</p>
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
              <p>{activeTab === "UNASSIGNED" ? "These entries are missing a day order." : "Enjoy your free day!"}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {currentEntries.map((entry) => (
                <div key={entry.id} style={{ 
                  display: "flex", 
                  backgroundColor: "var(--bg-card)", 
                  border: "1px solid var(--border-subtle)", 
                  borderRadius: "12px", 
                  padding: "1rem 1.5rem",
                  alignItems: "center",
                  boxShadow: "var(--shadow-card)",
                  transition: "border 0.3s ease"
                }}>
                  <div style={{ marginRight: "1.5rem", minWidth: "120px" }}>
                    <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "1.1rem" }}>{entry.period ? `Period ${entry.period}` : "Period not set"}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
                      <FiClock /> {entry.timeRange || "Time not set"}
                    </div>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "var(--royal-blue)", fontSize: "1.05rem" }}>
                      {entry.subjectName || "Subject not set"}{entry.subjectCode ? ` (${entry.subjectCode})` : ""}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                      {entry.facultyName || "Faculty not set"}
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-main)", fontWeight: 500, backgroundColor: "var(--bg-card-header)", padding: "0.5rem 1rem", borderRadius: "99px" }}>
                    <FiMapPin /> {entry.roomNo || "Room not set"}
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
