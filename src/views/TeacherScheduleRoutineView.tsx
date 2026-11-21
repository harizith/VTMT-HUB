"use client";

import { useEffect, useState } from "react";
import { FiCalendar, FiClock, FiMapPin, FiUser } from "react-icons/fi";
import { Loader2 } from "lucide-react";

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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading teaching routine...</p>
        </div>
      </div>
    );
  }

  const dayOrders = ["I", "II", "III", "IV", "V"];
  if (data?.timetable?.UNASSIGNED?.length) dayOrders.push("UNASSIGNED");
  const currentEntries: TimetableEntry[] = data?.timetable?.[activeTab] || [];

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.25rem 0" }}>Faculty Teaching Schedule</h2>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Assigned Lecture & Laboratory Periods • Faculty: <strong style={{ color: "var(--text-main)" }}>{data?.teacherName || "Faculty Member"}</strong>
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "var(--danger-bg)",
            color: "var(--danger)",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-sm)",
            marginBottom: "1.5rem",
            border: "1px solid var(--danger-border)",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      <div className="student-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Modern Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border-card)",
            backgroundColor: "var(--bg-card-header)",
            overflowX: "auto",
          }}
        >
          {dayOrders.map((doStr) => {
            const isSelected = activeTab === doStr;
            return (
              <button
                key={doStr}
                onClick={() => setActiveTab(doStr)}
                style={{
                  flex: 1,
                  padding: "0.95rem 1rem",
                  textAlign: "center",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  backgroundColor: isSelected ? "var(--bg-card)" : "transparent",
                  color: isSelected ? "var(--primary)" : "var(--text-muted)",
                  border: "none",
                  borderBottom: isSelected ? "2px solid var(--primary)" : "2px solid transparent",
                  transition: "all 0.18s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {doStr === "UNASSIGNED" ? "Unassigned" : `Day Order ${doStr}`}
              </button>
            );
          })}
        </div>

        {/* Schedule List */}
        <div style={{ padding: "1.5rem" }}>
          {currentEntries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3.5rem 1rem", color: "var(--text-muted)" }}>
              <FiCalendar style={{ fontSize: "2.75rem", marginBottom: "0.75rem", opacity: 0.3 }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.25rem 0", color: "var(--text-main)" }}>
                No classes scheduled
              </h3>
              <p style={{ fontSize: "0.85rem", margin: 0 }}>
                {activeTab === "UNASSIGNED"
                  ? "These entries are missing a day order."
                  : `You have no teaching periods scheduled for Day Order ${activeTab}.`}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {currentEntries.map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-sm)",
                    transition: "all 0.18s var(--ease-smooth)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.boxShadow = "var(--shadow-card)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  }}
                >
                  {/* Period Time Column */}
                  <div
                    style={{
                      backgroundColor: "var(--primary-subtle)",
                      padding: "1.25rem 1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "110px",
                      borderRight: "1px solid var(--border-subtle)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 800,
                        color: "var(--primary)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {entry.period ? `P${entry.period}` : "P—"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                        marginTop: "0.25rem",
                        textAlign: "center",
                        fontWeight: 500,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {entry.timeRange || "Time not set"}
                    </span>
                  </div>

                  {/* Details column */}
                  <div style={{ padding: "1.25rem", flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "0.5rem",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)" }}>
                        {entry.subjectName || "Subject not set"}
                      </h3>
                      {entry.subjectCode && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            backgroundColor: "var(--bg-input)",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "4px",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          {entry.subjectCode}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          color: "var(--text-main)",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                        }}
                      >
                        <FiUser style={{ color: "var(--primary)" }} />
                        <span>Section: <strong>{entry.classId || "—"}</strong></span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          color: "var(--text-main)",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                        }}
                      >
                        <FiMapPin style={{ color: "#10b981" }} />
                        <span>Room: <strong>{entry.roomNo || "—"}</strong></span>
                      </div>
                    </div>
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
