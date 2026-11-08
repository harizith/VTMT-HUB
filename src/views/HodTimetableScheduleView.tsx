"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock, MapPin } from "lucide-react";

interface TimetableEntry {
  id: string;
  period: number;
  timeRange: string;
  subjectCode: string;
  subjectName: string;
  classId: string;
  roomNo: string;
}

export default function SchedulePage() {
  const [timetable, setTimetable] = useState<Record<string, TimetableEntry[]>>({});
  const [vmNo, setVmNo] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState("I");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/hod/calendar")
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setTimetable(res.data.timetable || {});
          setVmNo(res.data.vmNo || "");
        } else {
          setError(res.error || "Failed to load schedule.");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("An error occurred while fetching the schedule.");
        setLoading(false);
      });
  }, []);

  const dayOrders = ["I", "II", "III", "IV", "V"];
  const currentEntries = timetable[activeDay] || [];

  return (
    <main className="student-main">
      <header className="student-header">
        <div>
          <h1>Weekly Schedule</h1>
          <p className="student-subtitle">VM No: {vmNo || "N/A"}</p>
        </div>
      </header>

      {error && (
        <div style={{ backgroundColor: "var(--bg-card)", color: "#ef4444", padding: "1rem", borderRadius: "8px", marginBottom: "2rem", border: "1px solid #fca5a5" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>Loading schedule...</div>
      ) : (
        <section className="student-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card-header)" }}>
            {dayOrders.map(dayOrder => (
              <button
                key={dayOrder}
                onClick={() => setActiveDay(dayOrder)}
                style={{
                  flex: 1,
                  padding: "1rem",
                  textAlign: "center",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  backgroundColor: activeDay === dayOrder ? "var(--bg-card)" : "transparent",
                  color: activeDay === dayOrder ? "#d97706" : "var(--text-muted)",
                  borderBottom: activeDay === dayOrder ? "2px solid #d97706" : "2px solid transparent",
                  transition: "all 0.2s"
                }}
              >
                Day Order {dayOrder}
              </button>
            ))}
          </div>

          <div style={{ padding: "1.5rem" }}>
            {currentEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                <CalendarDays size={48} style={{ opacity: 0.2, margin: "0 auto 1rem auto" }} />
                <h3>No classes scheduled</h3>
                <p>You have a free day for Day Order {activeDay}.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {currentEntries.map(entry => (
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
                      <div style={{ fontWeight: 700, color: "#d97706", fontSize: "1.1rem" }}>Period {entry.period}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
                        <Clock size={14} /> {entry.timeRange}
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#d97706", fontSize: "1.05rem" }}>
                        {entry.subjectName} ({entry.subjectCode})
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                        Class: {entry.classId}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-main)", fontWeight: 500, backgroundColor: "var(--bg-card-header)", padding: "0.5rem 1rem", borderRadius: "99px" }}>
                      <MapPin size={16} /> {entry.roomNo}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
