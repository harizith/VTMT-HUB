"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock, MapPin, Building2, UserCheck, AlertCircle } from "lucide-react";

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

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)", fontSize: "0.95rem" }}>
          <div style={{ width: "20px", height: "20px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span>Loading faculty schedule matrix...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
        padding: "1.5rem 1.75rem",
        borderRadius: "16px",
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
            <span style={{
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              color: "#f59e0b",
              padding: "0.2rem 0.65rem",
              borderRadius: "99px",
              fontWeight: "700",
              fontSize: "0.75rem",
              border: "1px solid rgba(245, 158, 11, 0.25)"
            }}>
              FACULTY TIMETABLE
            </span>
            <span style={{ color: "var(--border-subtle)" }}>•</span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600" }}>
              Staff ID: <strong style={{ color: "var(--text-main)" }}>{vmNo || "HOD"}</strong>
            </span>
          </div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: "800", letterSpacing: "-0.03em", margin: 0, color: "var(--text-main)" }}>
            Teaching & Lecture Schedule
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: "0.35rem 0 0 0" }}>
            Weekly scheduled theory & laboratory sessions across assigned undergraduate/postgraduate sections.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            padding: "0.6rem 1rem",
            borderRadius: "10px",
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
            textAlign: "right"
          }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "700" }}>DAY {activeDay} LOAD</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--primary)" }}>
              {currentEntries.length} Period{currentEntries.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: "rgba(239, 68, 68, 0.08)",
          color: "#ef4444",
          padding: "1rem 1.25rem",
          borderRadius: "12px",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          fontSize: "0.9rem"
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Schedule Container */}
      <div style={{
        backgroundColor: "var(--bg-card)",
        borderRadius: "16px",
        border: "1px solid var(--border-subtle)",
        overflow: "hidden",
        boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)"
      }}>
        {/* Segmented Day Order Navigation Bar */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-card-header)",
          padding: "0.35rem",
          gap: "0.35rem",
          overflowX: "auto"
        }}>
          {dayOrders.map(dayOrder => {
            const count = (timetable[dayOrder] || []).length;
            const isActive = activeDay === dayOrder;
            return (
              <button
                key={dayOrder}
                onClick={() => setActiveDay(dayOrder)}
                style={{
                  flex: 1,
                  minWidth: "120px",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  backgroundColor: isActive ? "var(--bg-card)" : "transparent",
                  color: isActive ? "var(--primary)" : "var(--text-muted)",
                  border: isActive ? "1px solid var(--border-subtle)" : "1px solid transparent",
                  boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                <span>Day Order {dayOrder}</span>
                <span style={{
                  fontSize: "0.72rem",
                  padding: "0.1rem 0.45rem",
                  borderRadius: "99px",
                  backgroundColor: isActive ? "rgba(37, 99, 235, 0.1)" : "var(--bg-input)",
                  color: isActive ? "var(--primary)" : "var(--text-muted)",
                  fontWeight: 800
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Schedule Entries */}
        <div style={{ padding: "1.75rem" }}>
          {currentEntries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 1.5rem", color: "var(--text-muted)" }}>
              <CalendarDays size={48} style={{ opacity: 0.25, margin: "0 auto 1.25rem auto" }} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text-main)", margin: "0 0 0.4rem 0" }}>
                No Teaching Sessions Scheduled
              </h3>
              <p style={{ fontSize: "0.9rem", margin: 0 }}>
                You have no classroom or lab commitments allocated for Day Order {activeDay}.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {currentEntries.map(entry => (
                <div
                  key={entry.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "1.25rem",
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "14px",
                    padding: "1.25rem 1.5rem",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                    transition: "transform 0.15s ease, border-color 0.15s ease"
                  }}
                >
                  {/* Period & Timing */}
                  <div style={{ minWidth: "150px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{
                        backgroundColor: "rgba(37, 99, 235, 0.1)",
                        color: "var(--primary)",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "8px",
                        fontWeight: "800",
                        fontSize: "0.82rem"
                      }}>
                        PERIOD {entry.period}
                      </span>
                    </div>
                    <div style={{
                      color: "var(--text-muted)",
                      fontSize: "0.82rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      marginTop: "0.4rem",
                      fontWeight: "600"
                    }}>
                      <Clock size={13} /> {entry.timeRange}
                    </div>
                  </div>

                  {/* Subject & Class Details */}
                  <div style={{ flex: 1, minWidth: "220px" }}>
                    <div style={{ fontWeight: 800, color: "var(--text-main)", fontSize: "1.05rem", letterSpacing: "-0.01em" }}>
                      {entry.subjectName}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: "0.75rem",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "6px",
                        backgroundColor: "var(--bg-input)",
                        color: "var(--text-muted)",
                        fontWeight: 700,
                        border: "1px solid var(--border-subtle)"
                      }}>
                        {entry.subjectCode}
                      </span>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        Assigned Class: <strong style={{ color: "var(--text-main)" }}>{entry.classId}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Venue / Room Pill */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    color: "var(--text-main)",
                    fontWeight: 700,
                    backgroundColor: "var(--bg-input)",
                    padding: "0.55rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "0.88rem"
                  }}>
                    <MapPin size={15} style={{ color: "var(--primary)" }} />
                    <span>Room {entry.roomNo}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
