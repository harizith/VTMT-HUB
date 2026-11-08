"use client";

import { useState } from "react";
import { Calendar, LayoutGrid, List, Download, Printer, FileText, X } from "lucide-react";

export interface TimetableEntry {
  id?: string;
  classId?: string;
  dayOrder: string;
  period: number;
  timeRange: string;
  subjectCode: string;
  subjectName: string;
  facultyName?: string;
  roomNo: string;
  vmsNo?: string | null;
  category?: string | null;
  academicYear?: string | null;
  semType?: string | null;
}

export interface UserDetailsProps {
  name?: string | null;
  rollNumber?: string | null;
  vmNo?: string | null;
  department?: string | null;
  designation?: string | null;
  semester?: number | string | null;
  section?: string | null;
  batch?: string | null;
  classId?: string | null;
}

interface OverallTimetableProps {
  fullTimetable?: Record<string, TimetableEntry[]> | null;
  currentDayOrder?: string;
  title?: string;
  subtitle?: string;
  mode?: "student" | "teacher" | "hod" | "admin";
  classId?: string;
  facultyName?: string;
  userDetails?: UserDetailsProps;
}

const PERIOD_LIST = [
  { period: 1, label: "Period 1", defaultTime: "08:05 - 08:55" },
  { period: 2, label: "Period 2", defaultTime: "08:55 - 09:45" },
  { period: 3, label: "Period 3", defaultTime: "10:00 - 10:50" },
  { period: 4, label: "Period 4", defaultTime: "10:50 - 11:40" },
  { period: 5, label: "Period 5", defaultTime: "12:20 - 01:05" },
  { period: 6, label: "Period 6", defaultTime: "01:05 - 01:50" },
  { period: 7, label: "Period 7", defaultTime: "02:00 - 02:45" },
  { period: 8, label: "Period 8", defaultTime: "02:45 - 03:30" },
];

const DAY_ORDERS = ["I", "II", "III", "IV", "V"];

export default function OverallTimetable({
  fullTimetable,
  currentDayOrder = "I",
  title = "Overall Timetable",
  subtitle,
  mode = "student",
  classId,
  facultyName,
  userDetails
}: OverallTimetableProps) {
  const initialDayOrder = DAY_ORDERS.includes(currentDayOrder) ? currentDayOrder : "I";
  const [selectedDayOrder, setSelectedDayOrder] = useState<string>(initialDayOrder);
  const [viewMode, setViewMode] = useState<"matrix" | "tabs">("matrix");
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const timetableMap: Record<string, TimetableEntry[]> = fullTimetable || {
    "I": [], "II": [], "III": [], "IV": [], "V": []
  };

  const selectedEntries = timetableMap[selectedDayOrder] || [];

  // Derived user details for the official template
  const resolvedName = userDetails?.name || facultyName || (mode === "student" ? "Student" : "Faculty Member");
  const resolvedClassId = userDetails?.classId || classId || "II-CSE-A";
  const resolvedId = userDetails?.vmNo || userDetails?.rollNumber || "N/A";
  const resolvedDept = userDetails?.department || "Computer Science and Engineering";
  const resolvedDesignation = userDetails?.designation || (mode === "student" ? "Student" : "Assistant Professor");

  // Calculate unique subjects for the official document subject table
  const allSlots = Object.values(timetableMap).flat();
  const uniqueSubjects: { code: string; name: string; faculty: string; room: string; hours: number; semType?: string | null }[] = [];
  allSlots.forEach(slot => {
    if (!slot.subjectCode || slot.subjectCode === "-" || slot.subjectCode === "LUNCH") return;
    const existing = uniqueSubjects.find(s => s.code === slot.subjectCode && s.name === slot.subjectName);
    if (existing) {
      existing.hours += 1;
      if (slot.facultyName && slot.facultyName.includes(",") && !existing.faculty.includes(",")) {
        existing.faculty = slot.facultyName;
      }
      if (!existing.semType && slot.semType) {
        existing.semType = slot.semType;
      }
    } else {
      uniqueSubjects.push({
        code: slot.subjectCode,
        name: slot.subjectName,
        faculty: slot.facultyName || facultyName || "Faculty",
        room: slot.roomNo || "Room",
        hours: 1,
        semType: slot.semType || null,
      });
    }
  });

  const totalWeeklyHours = allSlots.filter(s => s.subjectCode && s.subjectCode !== "-" && !s.subjectCode.includes("LUNCH")).length;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const printEl = document.getElementById("official-printable-timetable");
    if (!printEl) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${resolvedName} - Official Timetable</title>
  <style>
    @page { size: landscape; margin: 10mm; }
    body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; background: #fff; color: #000; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #000; padding: 6px 4px; text-align: center; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 8px; }
    .header h1 { margin: 0; font-size: 16pt; font-weight: bold; }
    .header p { margin: 2px 0; font-size: 10pt; }
    .badge { display: inline-block; border: 1.5px solid #000; padding: 3px 15px; font-weight: bold; font-size: 12pt; margin-top: 6px; }
    .meta-box { border: 1px solid #000; padding: 8px 12px; margin-bottom: 12px; display: grid; grid-template-columns: repeat(4, 1fr); font-size: 10pt; gap: 6px; }
    .lunch-cell { background-color: #f8f8f8; font-weight: bold; font-size: 9px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 40px; font-weight: bold; font-size: 10pt; padding: 0 20px; }
    .sig-line { width: 180px; border-top: 1px solid #000; text-align: center; padding-top: 5px; }
  </style>
</head>
<body>
  ${printEl.innerHTML}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Timetable_${resolvedName.replace(/[^a-zA-Z0-9]/g, "_")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="student-card premium-card" style={{ marginTop: "2rem", padding: "1.25rem 1.5rem" }}>
      {/* Top Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.85rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "rgba(29, 78, 216, 0.1)", color: "var(--royal-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calendar size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-0.01em" }}>
              {title}
            </h2>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
              {subtitle || (classId ? `Class: ${classId}` : facultyName ? `Faculty: ${facultyName}` : "Complete 5-Day Weekly Matrix")}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Download Official Timetable Button */}
          <button
            onClick={() => setShowDownloadModal(true)}
            className="btn-sky"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.45rem 0.9rem",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(56, 189, 248, 0.25)"
            }}
            title="Download or Print Official College Timetable Format"
          >
            <Download size={15} />
            <span>Download Timetable</span>
          </button>

          {/* View Switcher: Matrix vs Single Day View */}
          <div style={{ display: "inline-flex", padding: "3px", backgroundColor: "var(--bg-input)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <button
              onClick={() => setViewMode("matrix")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: viewMode === "matrix" ? "var(--bg-card)" : "transparent",
                color: viewMode === "matrix" ? "var(--royal-blue)" : "var(--text-muted)",
                boxShadow: viewMode === "matrix" ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              <LayoutGrid size={14} />
              <span>Table View</span>
            </button>
            <button
              onClick={() => setViewMode("tabs")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: viewMode === "tabs" ? "var(--bg-card)" : "transparent",
                color: viewMode === "tabs" ? "var(--royal-blue)" : "var(--text-muted)",
                boxShadow: viewMode === "tabs" ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              <List size={14} />
              <span>Day View</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === "matrix" ? (
        /* ================= EXACT TABLE AS SHOWN IN SCREENSHOT ================= */
        <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-card-header)", borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ padding: "1rem", textAlign: "left", width: "100px", fontWeight: "700", color: "var(--text-main)", borderRight: "1px solid var(--border-subtle)" }}>
                  Day
                </th>
                {PERIOD_LIST.map(p => (
                  <th key={p.period} style={{ padding: "0.85rem 0.75rem", textAlign: "left", fontWeight: "700", color: "var(--text-main)", borderRight: p.period < 8 ? "1px solid var(--border-subtle)" : "none", minWidth: "140px" }}>
                    <div>{p.label}</div>
                    <div style={{ fontSize: "0.68rem", fontWeight: "normal", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                      {p.defaultTime}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAY_ORDERS.map(doStr => {
                const isCurrent = currentDayOrder === doStr;
                const entries = timetableMap[doStr] || [];

                return (
                  <tr
                    key={doStr}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      backgroundColor: isCurrent ? "rgba(29, 78, 216, 0.04)" : "transparent",
                      transition: "background-color 0.15s ease"
                    }}
                  >
                    {/* Day Column (Day I, Day II, etc.) */}
                    <td style={{
                      padding: "1.25rem 1rem",
                      fontWeight: "800",
                      color: isCurrent ? "var(--royal-blue)" : "var(--text-main)",
                      borderRight: "1px solid var(--border-subtle)",
                      backgroundColor: isCurrent ? "rgba(29, 78, 216, 0.06)" : "var(--bg-card-header)",
                      verticalAlign: "top",
                      whiteSpace: "nowrap"
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        <span style={{ fontSize: "0.95rem" }}>Day {doStr}</span>
                        {isCurrent && (
                          <span style={{
                            display: "inline-block",
                            width: "fit-content",
                            fontSize: "0.6rem",
                            padding: "0.1rem 0.35rem",
                            borderRadius: "4px",
                            backgroundColor: "#22c55e",
                            color: "#ffffff",
                            fontWeight: 800,
                            letterSpacing: "0.03em"
                          }}>
                            TODAY
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Period Columns 1 to 8 */}
                    {PERIOD_LIST.map(p => {
                      const entry = entries.find(e => e.period === p.period);
                      const hasClass = Boolean(entry && entry.subjectName);

                      return (
                        <td
                          key={p.period}
                          style={{
                            padding: "0.9rem 0.75rem",
                            borderRight: p.period < 8 ? "1px solid var(--border-subtle)" : "none",
                            verticalAlign: "top",
                            lineHeight: 1.35
                          }}
                        >
                          {hasClass ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                              {/* 1. Subject Name in vibrant Sky/Royal Blue */}
                              <div style={{
                                fontWeight: "700",
                                fontSize: "0.83rem",
                                color: "#0284c7",
                                wordBreak: "break-word"
                              }}>
                                {entry?.subjectName}
                              </div>

                              {/* 2. Faculty / Class handling info */}
                              <div style={{
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                                wordBreak: "break-word"
                              }}>
                                {(() => {
                                  const rawName = entry?.facultyName || "";
                                  const staffList = rawName.split(/[,/]+/).map((s: string) => s.trim()).filter(Boolean);
                                  const isLabSlot = (entry?.subjectName || entry?.subjectCode || "").toLowerCase().includes("lab");
                                  const isElectiveSlot =
                                    (entry?.subjectName || entry?.subjectCode || "").toLowerCase().includes("elective") ||
                                    (entry?.category || "").toLowerCase() === "pe" ||
                                    (entry?.category || "").toLowerCase() === "oe";

                                  if (staffList.length > 1) {
                                    const badgeTitle = isLabSlot
                                      ? `Lab In-Charge (${staffList.length} Staff)`
                                      : isElectiveSlot
                                      ? `Elective Faculty (${staffList.length} Staff)`
                                      : `Faculty (${staffList.length})`;

                                    const badgeBg = isLabSlot
                                      ? "rgba(245, 158, 11, 0.15)"
                                      : isElectiveSlot
                                      ? "rgba(192, 132, 252, 0.15)"
                                      : "rgba(56, 189, 248, 0.15)";

                                    const badgeColor = isLabSlot
                                      ? "#f59e0b"
                                      : isElectiveSlot
                                      ? "#c084fc"
                                      : "var(--sky-blue)";

                                    return (
                                      <div style={{ marginTop: "3px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
                                          <span style={{
                                            fontSize: "0.62rem",
                                            fontWeight: 800,
                                            backgroundColor: badgeBg,
                                            color: badgeColor,
                                            padding: "1px 4px",
                                            borderRadius: "3px",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.03em"
                                          }}>
                                            {badgeTitle}
                                          </span>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5px" }}>
                                          {staffList.map((fn: string, fIdx: number) => (
                                            <div key={fIdx} style={{
                                              fontSize: "0.71rem",
                                              color: "var(--text-main)",
                                              fontWeight: 600,
                                              lineHeight: 1.2
                                            }}>
                                              • {fn}
                                            </div>
                                          ))}
                                        </div>
                                        {mode !== "student" && (
                                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                            Class: <strong>{entry?.classId || classId}</strong>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }

                                  // Exactly 1 professor assigned for this class
                                  return mode === "student" ? (
                                    <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                                      {rawName || "Faculty"}
                                    </span>
                                  ) : (
                                    <span>
                                      <strong style={{ color: "var(--text-main)" }}>{entry?.classId || classId}</strong>
                                      {rawName ? ` • ${rawName}` : ""}
                                    </span>
                                  );
                                })()}
                              </div>

                              {/* 3. Room Number & Sem (Odd/Even) */}
                              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap", marginTop: "2px" }}>
                                {entry?.roomNo && (
                                  <div style={{
                                    fontSize: "0.72rem",
                                    fontWeight: "600",
                                    color: "var(--text-muted)",
                                    opacity: 0.85
                                  }}>
                                    {entry.roomNo}
                                  </div>
                                )}
                                {entry?.semType && (
                                  <span style={{
                                    fontSize: "0.62rem",
                                    fontWeight: 700,
                                    padding: "0.08rem 0.35rem",
                                    borderRadius: "4px",
                                    backgroundColor: entry.semType.toUpperCase() === "ODD" ? "rgba(168, 85, 247, 0.15)" : "rgba(16, 185, 129, 0.15)",
                                    color: entry.semType.toUpperCase() === "ODD" ? "#c084fc" : "#10b981",
                                    border: entry.semType.toUpperCase() === "ODD" ? "1px solid rgba(168, 85, 247, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                                    lineHeight: 1.2
                                  }}>
                                    Sem ({entry.semType.toUpperCase() === "ODD" ? "Odd" : "Even"})
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div style={{ minHeight: "45px", display: "flex", alignItems: "center" }}>
                              <span style={{ color: "var(--text-muted)", opacity: 0.3, fontSize: "0.85rem" }}>—</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ================= SINGLE DAY FOCUS VIEW ================= */
        <div>
          {/* Day Order Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
            {DAY_ORDERS.map(doStr => {
              const isSelected = selectedDayOrder === doStr;
              const isToday = currentDayOrder === doStr;
              const count = (timetableMap[doStr] || []).length;

              return (
                <button
                  key={doStr}
                  onClick={() => setSelectedDayOrder(doStr)}
                  style={{
                    padding: "0.6rem 1.1rem",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    whiteSpace: "nowrap",
                    border: isSelected ? "1px solid var(--royal-blue)" : "1px solid var(--border-subtle)",
                    backgroundColor: isSelected ? "var(--royal-blue)" : "var(--bg-input)",
                    color: isSelected ? "#ffffff" : "var(--text-main)",
                    boxShadow: isSelected ? "0 4px 12px rgba(29, 78, 216, 0.25)" : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span>Day Order {doStr}</span>
                  {isToday && (
                    <span style={{
                      fontSize: "0.65rem",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "4px",
                      backgroundColor: isSelected ? "rgba(255,255,255,0.25)" : "rgba(34, 197, 94, 0.15)",
                      color: isSelected ? "#ffffff" : "#22c55e",
                      fontWeight: 800
                    }}>
                      TODAY
                    </span>
                  )}
                  <span style={{ fontSize: "0.7rem", opacity: isSelected ? 0.85 : 0.6 }}>
                    ({count} classes)
                  </span>
                </button>
              );
            })}
          </div>

          {/* Period cards for selected day */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {PERIOD_LIST.map(({ period, label, defaultTime }) => {
              const entry = selectedEntries.find(e => e.period === period);
              const hasClass = Boolean(entry && entry.subjectName);

              return (
                <div
                  key={period}
                  style={{
                    borderRadius: "12px",
                    border: "1px solid var(--border-subtle)",
                    backgroundColor: hasClass ? "var(--bg-card)" : "var(--bg-input)",
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "125px"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, padding: "0.2rem 0.5rem", borderRadius: "6px", backgroundColor: "rgba(2, 132, 199, 0.1)", color: "#0284c7" }}>
                        {label.toUpperCase()}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {entry?.timeRange || defaultTime}
                      </span>
                    </div>

                    {hasClass ? (
                      <div>
                        <h4 style={{ margin: "0 0 0.35rem 0", fontSize: "0.92rem", fontWeight: "700", color: "#0284c7", lineHeight: 1.3 }}>
                          {entry?.subjectName}
                        </h4>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {entry?.facultyName && entry.facultyName.includes(",") ? (
                            <div style={{ marginTop: "4px", backgroundColor: "rgba(56, 189, 248, 0.06)", padding: "5px 8px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                              <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--sky-blue)", textTransform: "uppercase", marginBottom: "2px" }}>
                                Lab Staff In-Charge ({entry.facultyName.split(",").length} Faculty):
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                {entry.facultyName.split(",").map((fn, fIdx) => (
                                  <div key={fIdx} style={{ fontSize: "0.74rem", color: "var(--text-main)", fontWeight: 600 }}>
                                    👨‍🏫 {fn.trim()}
                                  </div>
                                ))}
                              </div>
                              {mode !== "student" && (
                                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "3px" }}>
                                  Class: <strong>{entry?.classId || classId}</strong>
                                </div>
                              )}
                            </div>
                          ) : (
                            mode === "student" ? (entry?.facultyName || "Faculty") : `Class: ${entry?.classId || classId}${entry?.facultyName ? ` • ${entry.facultyName}` : ""}`
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "0.75rem 0", color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
                        Free Period
                      </div>
                    )}
                  </div>

                  {hasClass && entry?.roomNo && (
                    <div style={{ marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)" }}>
                      {entry.roomNo}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Official College Timetable Preview & Download Modal */}
      {showDownloadModal && (
        <div
          className="admin-modal-overlay"
          onClick={() => setShowDownloadModal(false)}
          style={{ zIndex: 1200 }}
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "1150px",
              width: "95vw",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "1.5rem",
              backgroundColor: "var(--bg-card)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem"
            }}
          >
            {/* Modal Controls Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.85rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText size={20} color="var(--sky-blue)" />
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0, color: "var(--text-main)" }}>
                  Official College Timetable (Print & Download)
                </h3>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <button
                  onClick={handlePrint}
                  className="btn-sky"
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.9rem", fontSize: "0.82rem", fontWeight: 700 }}
                >
                  <Printer size={15} />
                  <span>Print / Save as PDF</span>
                </button>

                <button
                  onClick={handleDownloadHtml}
                  className="btn-royal"
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.9rem", fontSize: "0.82rem", fontWeight: 700 }}
                >
                  <Download size={15} />
                  <span>Download HTML</span>
                </button>

                <button
                  onClick={() => setShowDownloadModal(false)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.3rem" }}
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Official Printable Document Container */}
            <div
              id="official-printable-timetable"
              style={{
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: "24px 28px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: "11px",
                lineHeight: "1.3"
              }}
            >
              {/* College Header */}
              <div style={{ textAlign: "center", borderBottom: "2px solid #000000", paddingBottom: "8px", marginBottom: "12px" }}>
                <h1 style={{ fontSize: "14pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 2px 0", letterSpacing: "0.02em", color: "#000000" }}>
                  VEL TECH MULTI TECH Dr.RANGARAJAN Dr.SAKUNTHALA ENGINEERING COLLEGE
                </h1>
                <p style={{ fontSize: "9.5pt", fontStyle: "italic", margin: "0 0 4px 0", color: "#333333" }}>
                  (An Autonomous Institution - Affiliated to Anna University, Chennai)
                </p>
                <h2 style={{ fontSize: "11pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 6px 0", color: "#000000" }}>
                  DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
                </h2>
                <div style={{ display: "inline-block", border: "1.5px solid #000000", padding: "2px 16px", fontWeight: "bold", fontSize: "11pt", textTransform: "uppercase", letterSpacing: "0.05em", color: "#000000" }}>
                  {mode === "student" ? "CLASS TIME TABLE" : "INDIVIDUAL TIME TABLE"}
                </div>
              </div>

              {/* Details Box */}
              <div style={{ border: "1px solid #000000", padding: "8px 12px", marginBottom: "12px", backgroundColor: "#fafafa" }}>
                <div style={{ fontWeight: "bold", fontSize: "10pt", marginBottom: "4px", borderBottom: "1px dotted #888", paddingBottom: "2px" }}>
                  {mode === "student" ? "Student Details" : "Faculty Details"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: "6px", fontSize: "9.5pt" }}>
                  <div>
                    <strong>{mode === "student" ? "Student Name:" : "Name of Faculty:"}</strong> {resolvedName}
                  </div>
                  <div>
                    <strong>{mode === "student" ? "Roll / VM No:" : "MTS No:"}</strong> {resolvedId}
                  </div>
                  <div>
                    <strong>{mode === "student" ? "Class & Section:" : "Designation:"}</strong> {mode === "student" ? resolvedClassId : resolvedDesignation}
                  </div>
                  <div>
                    <strong>{mode === "student" ? "Academic Year:" : "Total Hours/Week:"}</strong> {mode === "student" ? "2025 - 2026" : `${totalWeeklyHours} Hours`}
                  </div>
                  <div>
                    <strong>Department:</strong> {resolvedDept}
                  </div>
                  <div>
                    <strong>Branch:</strong> CSE
                  </div>
                  <div>
                    <strong>Semester:</strong>{" "}
                    {(() => {
                      const semVal = userDetails?.semester;
                      if (!semVal) {
                        return "Sem 3 (Odd)";
                      }
                      const num = Number(semVal);
                      if (isNaN(num)) return `${semVal}`;
                      return `Sem ${num} (${num % 2 !== 0 ? "Odd" : "Even"})`;
                    })()}
                  </div>
                  <div>
                    <strong>Status:</strong> Active Regular
                  </div>
                </div>
              </div>

              {/* Timetable Grid Table */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontWeight: "bold", fontSize: "10pt", marginBottom: "4px" }}>
                  Time Table Grid
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt", textAlign: "center", border: "1.5px solid #000000" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#eaeaea" }}>
                      <th style={{ border: "1px solid #000000", padding: "6px 4px", width: "70px", fontWeight: "bold" }}>
                        Day Order (DO)
                      </th>
                      <th style={{ border: "1px solid #000000", padding: "4px", width: "75px" }}>
                        <strong>1</strong><br /><span style={{ fontSize: "7pt" }}>08:05 - 08:55</span>
                      </th>
                      <th style={{ border: "1px solid #000000", padding: "4px", width: "75px" }}>
                        <strong>2</strong><br /><span style={{ fontSize: "7pt" }}>08:55 - 09:45</span>
                      </th>
                      <th style={{ border: "1px solid #000000", padding: "4px", width: "75px" }}>
                        <strong>3</strong><br /><span style={{ fontSize: "7pt" }}>10:00 - 10:50</span>
                      </th>
                      <th style={{ border: "1px solid #000000", padding: "4px", width: "75px" }}>
                        <strong>4</strong><br /><span style={{ fontSize: "7pt" }}>10:50 - 11:40</span>
                      </th>
                      <th style={{ border: "1px solid #000000", padding: "4px", width: "70px", backgroundColor: "#e2e8f0", fontWeight: "bold" }}>
                        Break / Lunch<br /><span style={{ fontSize: "7pt" }}>11:40 - 12:20</span>
                      </th>
                      <th style={{ border: "1px solid #000000", padding: "4px", width: "75px" }}>
                        <strong>5</strong><br /><span style={{ fontSize: "7pt" }}>12:20 - 01:05</span>
                      </th>
                      <th style={{ border: "1px solid #000000", padding: "4px", width: "75px" }}>
                        <strong>6</strong><br /><span style={{ fontSize: "7pt" }}>01:05 - 01:50</span>
                      </th>
                      <th style={{ border: "1px solid #000000", padding: "4px", width: "75px" }}>
                        <strong>7</strong><br /><span style={{ fontSize: "7pt" }}>02:00 - 02:45</span>
                      </th>
                      <th style={{ border: "1px solid #000000", padding: "4px", width: "75px" }}>
                        <strong>8</strong><br /><span style={{ fontSize: "7pt" }}>02:45 - 03:30</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAY_ORDERS.map((dOrder) => {
                      const dayEntries = timetableMap[dOrder] || [];
                      const p1 = dayEntries.find(e => e.period === 1);
                      const p2 = dayEntries.find(e => e.period === 2);
                      const p3 = dayEntries.find(e => e.period === 3);
                      const p4 = dayEntries.find(e => e.period === 4);
                      const p5 = dayEntries.find(e => e.period === 5);
                      const p6 = dayEntries.find(e => e.period === 6);
                      const p7 = dayEntries.find(e => e.period === 7);
                      const p8 = dayEntries.find(e => e.period === 8);

                      return (
                        <tr key={dOrder} style={{ height: "36px" }}>
                          <td style={{ border: "1px solid #000000", fontWeight: "bold", backgroundColor: "#f2f2f2" }}>
                            {dOrder}
                          </td>
                          {[p1, p2, p3, p4].map((slot, pIdx) => (
                            <td key={pIdx} style={{ border: "1px solid #000000", padding: "4px 2px", verticalAlign: "middle" }}>
                              {slot && slot.subjectName ? (
                                <div>
                                  <div style={{ fontWeight: "bold", fontSize: "8pt" }}>{slot.subjectCode}</div>
                                  <div style={{ fontSize: "7pt" }}>{slot.subjectName.slice(0, 18)}</div>
                                  <div style={{ fontSize: "6.5pt", color: "#555" }}>{slot.roomNo || ""}</div>
                                  {slot.facultyName && slot.facultyName.includes(",") && (
                                    <div style={{ fontSize: "5.5pt", color: "#222", marginTop: "1px", fontStyle: "italic", lineHeight: 1.1 }}>
                                      Staff: {slot.facultyName.split(",").map((s: string) => s.trim().replace(/^(Dr\.?|Mr\.?|Ms\.?)\s+/i, '')).join(", ")}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: "#aaa" }}>-</span>
                              )}
                            </td>
                          ))}
                          <td style={{ border: "1px solid #000000", backgroundColor: "#f8f8f8", fontWeight: "bold", fontSize: "7pt", letterSpacing: "0.05em" }}>
                            LUNCH BREAK
                          </td>
                          {[p5, p6, p7, p8].map((slot, pIdx) => (
                            <td key={pIdx + 4} style={{ border: "1px solid #000000", padding: "4px 2px", verticalAlign: "middle" }}>
                              {slot && slot.subjectName ? (
                                <div>
                                  <div style={{ fontWeight: "bold", fontSize: "8pt" }}>{slot.subjectCode}</div>
                                  <div style={{ fontSize: "7pt" }}>{slot.subjectName.slice(0, 18)}</div>
                                  <div style={{ fontSize: "6.5pt", color: "#555" }}>{slot.roomNo || ""}</div>
                                  {slot.facultyName && slot.facultyName.includes(",") && (
                                    <div style={{ fontSize: "5.5pt", color: "#222", marginTop: "1px", fontStyle: "italic", lineHeight: 1.1 }}>
                                      Staff: {slot.facultyName.split(",").map((s: string) => s.trim().replace(/^(Dr\.?|Mr\.?|Ms\.?)\s+/i, '')).join(", ")}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: "#aaa" }}>-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Subject Details List Table */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontWeight: "bold", fontSize: "10pt", marginBottom: "4px" }}>
                  Subject Details
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5pt", textAlign: "left", border: "1px solid #000000" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f0f0f0" }}>
                      <th style={{ border: "1px solid #000000", padding: "4px 6px", width: "35px" }}>S.No</th>
                      <th style={{ border: "1px solid #000000", padding: "4px 6px", width: "85px" }}>Subject Code</th>
                      <th style={{ border: "1px solid #000000", padding: "4px 6px" }}>Subject Name</th>
                      <th style={{ border: "1px solid #000000", padding: "4px 6px", width: "85px", textAlign: "center" }}>Sem (Odd/Even)</th>
                      <th style={{ border: "1px solid #000000", padding: "4px 6px", width: "120px" }}>Handled By / Class</th>
                      <th style={{ border: "1px solid #000000", padding: "4px 6px", width: "70px" }}>Room No</th>
                      <th style={{ border: "1px solid #000000", padding: "4px 6px", width: "55px", textAlign: "center" }}>Periods</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueSubjects.length > 0 ? (
                      uniqueSubjects.map((sub, sIdx) => {
                        const semLabel = sub.semType
                          ? `Sem (${sub.semType.toUpperCase() === "ODD" ? "Odd" : "Even"})`
                          : userDetails?.semester
                          ? `Sem ${userDetails.semester} (${Number(userDetails.semester) % 2 !== 0 ? "Odd" : "Even"})`
                          : "Sem (Odd)";
                        return (
                          <tr key={sub.code + sIdx}>
                            <td style={{ border: "1px solid #000000", padding: "4px 6px", textAlign: "center" }}>{sIdx + 1}</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 6px", fontWeight: "bold" }}>{sub.code}</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 6px" }}>{sub.name}</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 6px", textAlign: "center", fontWeight: "600", fontSize: "7.5pt" }}>
                              {semLabel}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "4px 6px" }}>{sub.faculty}</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 6px" }}>{sub.room}</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 6px", textAlign: "center", fontWeight: "bold" }}>{sub.hours}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} style={{ border: "1px solid #000000", padding: "8px", textAlign: "center", color: "#666" }}>
                          No subject assignments mapped in this timetable.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signatures Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "36px", padding: "0 15px", fontSize: "9.5pt", fontWeight: "bold" }}>
                <div style={{ textAlign: "center", width: "200px" }}>
                  <div style={{ borderTop: "1px solid #000000", paddingTop: "5px" }}>
                    {mode === "student" ? "Student Signature" : "Faculty Signature"}
                  </div>
                </div>
                <div style={{ textAlign: "center", width: "200px" }}>
                  <div style={{ borderTop: "1px solid #000000", paddingTop: "5px" }}>
                    Time Table Coordinator
                  </div>
                </div>
                <div style={{ textAlign: "center", width: "200px" }}>
                  <div style={{ borderTop: "1px solid #000000", paddingTop: "5px" }}>
                    Head of the Department (HOD)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Print Styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #official-printable-timetable,
          #official-printable-timetable * {
            visibility: visible !important;
          }
          #official-printable-timetable {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            margin: 0 !important;
            padding: 12px !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 999999 !important;
          }
          @page {
            size: landscape;
            margin: 8mm;
          }
        }
      `}} />
    </section>
  );
}
