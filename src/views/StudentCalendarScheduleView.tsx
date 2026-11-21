"use client";

import { useEffect, useState } from "react";
import { FiCalendar, FiClock, FiMapPin, FiLayers } from "react-icons/fi";
import { Loader2 } from "lucide-react";

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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading weekly schedule...</p>
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
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.25rem 0" }}>Weekly Master Calendar</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Enrolled Section:</span>
          <span
            style={{
              padding: "0.15rem 0.5rem",
              borderRadius: "4px",
              backgroundColor: "var(--primary-subtle)",
              color: "var(--primary)",
              fontWeight: 700,
              fontSize: "0.8rem",
              border: "1px solid rgba(37, 99, 235, 0.2)",
            }}
          >
            {data?.classId || "N/A"}
          </span>
        </div>
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
        {/* Modern Segmented Day Order Tabs */}
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
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.35rem 0", color: "var(--text-main)" }}>
                No classes scheduled
              </h3>
              <p style={{ fontSize: "0.85rem", margin: 0 }}>
                {activeTab === "UNASSIGNED" ? "These entries are missing a day order." : "Enjoy your free day!"}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {currentEntries.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    display: "flex",
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "1rem 1.25rem",
                    alignItems: "center",
                    boxShadow: "var(--shadow-sm)",
                    transition: "all 0.18s var(--ease-smooth)",
                    gap: "1.25rem",
                    flexWrap: "wrap",
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
                  <div style={{ minWidth: "120px" }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--text-main)",
                        fontSize: "1rem",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {entry.period ? `Period ${entry.period}` : "Period not set"}
                    </div>
                    <div
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        marginTop: "0.2rem",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <FiClock size={13} /> {entry.timeRange || "Time not set"}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ fontWeight: 700, color: "var(--primary)", fontSize: "1.05rem" }}>
                      {entry.subjectName || "Subject not set"}
                      {entry.subjectCode && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "0.1rem 0.4rem",
                            borderRadius: "4px",
                            backgroundColor: "var(--bg-input)",
                            color: "var(--text-muted)",
                            marginLeft: "0.5rem",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          {entry.subjectCode}
                        </span>
                      )}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      {entry.facultyName || "Faculty not set"}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      color: "var(--text-main)",
                      fontWeight: 600,
                      backgroundColor: "var(--bg-input)",
                      padding: "0.4rem 0.85rem",
                      borderRadius: "999px",
                      fontSize: "0.825rem",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <FiMapPin size={13} style={{ color: "var(--primary)" }} /> {entry.roomNo || "Room not set"}
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
