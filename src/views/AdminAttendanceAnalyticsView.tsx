"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, Calendar, Search, Filter, RefreshCw, BarChart2, ShieldAlert, Sparkles, Building2 } from "lucide-react";

export default function AdminAttendanceAnalyticsView() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [classSummaries, setClassSummaries] = useState<any[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDept && selectedDept !== "ALL") params.append("department", selectedDept);
      if (selectedClass && selectedClass !== "ALL") params.append("classId", selectedClass);
      if (dateFilter) params.append("dateString", dateFilter);

      const res = await fetch(`/api/admin/attendance?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setRecords(json.data.records || []);
        setSummary(json.data.summary || { total: 0, present: 0, absent: 0, percentage: 0 });
        setClassSummaries(json.data.classSummaries || []);
        if (json.data.availableDates) {
          setAvailableDates(json.data.availableDates);
        }
      }
    } catch (e) {
      console.error("Failed to load admin attendance", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDept, selectedClass, dateFilter]);

  const filteredRecords = records.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.studentName && r.studentName.toLowerCase().includes(q)) ||
      (r.studentId && r.studentId.toLowerCase().includes(q)) ||
      (r.classId && r.classId.toLowerCase().includes(q)) ||
      (r.subjectCode && r.subjectCode.toLowerCase().includes(q)) ||
      (r.facultyName && r.facultyName.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Metrics Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
        {/* Attendance Rate */}
        <div style={{
          padding: "1.5rem",
          borderRadius: "16px",
          border: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-card)",
          boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                CAMPUS ATTENDANCE INDEX
              </span>
              <span style={{
                backgroundColor: summary.percentage >= 75 ? "rgba(16, 185, 129, 0.12)" : summary.percentage >= 65 ? "rgba(245, 158, 11, 0.12)" : "rgba(239, 68, 68, 0.12)",
                color: summary.percentage >= 75 ? "#10b981" : summary.percentage >= 65 ? "#f59e0b" : "#ef4444",
                padding: "0.2rem 0.55rem",
                borderRadius: "99px",
                fontSize: "0.72rem",
                fontWeight: "700"
              }}>
                {summary.percentage >= 75 ? "Healthy" : summary.percentage >= 65 ? "Warning" : "Critical Deficit"}
              </span>
            </div>
            <div style={{ fontSize: "2.25rem", fontWeight: "800", letterSpacing: "-0.03em", color: summary.percentage >= 75 ? "#10b981" : summary.percentage >= 65 ? "#f59e0b" : "#ef4444" }}>
              {summary.percentage}%
            </div>
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)" }}>
            <strong>{summary.present}</strong> present out of <strong>{summary.total}</strong> recorded slots
          </div>
        </div>

        {/* Sessions Recorded */}
        <div style={{
          padding: "1.5rem",
          borderRadius: "16px",
          border: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-card)",
          boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                TOTAL SESSIONS AUDITED
              </span>
              <span style={{
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                color: "var(--primary)",
                padding: "0.2rem 0.55rem",
                borderRadius: "99px",
                fontSize: "0.72rem",
                fontWeight: "700"
              }}>
                Active Ledger
              </span>
            </div>
            <div style={{ fontSize: "2.25rem", fontWeight: "800", letterSpacing: "-0.03em", color: "var(--primary)" }}>
              {summary.total}
            </div>
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)" }}>
            Synchronized across all departments & sections
          </div>
        </div>

        {/* Absenteeism Recorded */}
        <div style={{
          padding: "1.5rem",
          borderRadius: "16px",
          border: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-card)",
          boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                ABSENTEE NOTIFICATIONS
              </span>
              <span style={{
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                color: "#ef4444",
                padding: "0.2rem 0.55rem",
                borderRadius: "99px",
                fontSize: "0.72rem",
                fontWeight: "700"
              }}>
                Defaulter Log
              </span>
            </div>
            <div style={{ fontSize: "2.25rem", fontWeight: "800", letterSpacing: "-0.03em", color: "#ef4444" }}>
              {summary.absent}
            </div>
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)" }}>
            Flagged absences & leave without condonation
          </div>
        </div>
      </div>

      {/* Class Section Breakdown */}
      {classSummaries.length > 0 && (
        <div style={{
          padding: "1.5rem",
          borderRadius: "16px",
          border: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-card)",
          boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
            <BarChart2 size={18} style={{ color: "var(--primary)" }} />
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.01em" }}>
              Cohort & Section Analytics
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {classSummaries.map((c: any) => (
              <div
                key={c.classId}
                style={{
                  padding: "1rem 1.15rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--bg-input)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.95rem", color: "var(--text-main)", fontWeight: 800 }}>{c.classId}</strong>
                  <span style={{
                    fontSize: "0.88rem",
                    fontWeight: "800",
                    color: c.total === 0 ? "var(--text-muted)" : c.percentage >= 75 ? "#10b981" : "#ef4444"
                  }}>
                    {c.total === 0 ? "—" : `${c.percentage}%`}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: "100%", height: "5px", backgroundColor: "var(--border-subtle)", borderRadius: "3px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, c.percentage || 0))}%`,
                      height: "100%",
                      backgroundColor: c.percentage >= 75 ? "#10b981" : "#ef4444",
                      borderRadius: "3px"
                    }}
                  />
                </div>

                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {c.total > 0
                    ? `${c.present}/${c.total} attended`
                    : c.enrolledCount > 0
                    ? `${c.enrolledCount} enrolled (pending)`
                    : "No sessions logged"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div style={{
        padding: "1.25rem",
        borderRadius: "16px",
        border: "1px solid var(--border-subtle)",
        backgroundColor: "var(--bg-card)",
        boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="admin-input"
            style={{ fontSize: "0.85rem", padding: "0.55rem 0.85rem", borderRadius: "10px" }}
          >
            <option value="ALL">All Departments</option>
            <option value="CSE">Computer Science (CSE)</option>
            <option value="ECE">Electronics (ECE)</option>
            <option value="IT">Information Tech (IT)</option>
            <option value="MECH">Mechanical (MECH)</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="admin-input"
            style={{ fontSize: "0.85rem", padding: "0.55rem 0.85rem", borderRadius: "10px" }}
          >
            <option value="">All Past Dates ({availableDates.length} recorded)</option>
            {availableDates.map(d => (
              <option key={d} value={d}>
                {d === new Date().toISOString().split('T')[0] ? `Today (${d})` : d}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="admin-input"
            style={{ fontSize: "0.85rem", padding: "0.55rem 0.85rem", borderRadius: "10px" }}
          />

          <div style={{ position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search student, code, faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-input"
              style={{ fontSize: "0.85rem", padding: "0.55rem 0.85rem 0.55rem 2.2rem", width: "240px", borderRadius: "10px" }}
            />
          </div>
        </div>

        <button
          onClick={fetchAttendance}
          className="btn-royal"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.55rem 1.15rem",
            borderRadius: "10px",
            fontSize: "0.85rem",
            fontWeight: "700"
          }}
        >
          <RefreshCw size={14} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Attendance Records Table */}
      <div style={{
        borderRadius: "16px",
        border: "1px solid var(--border-subtle)",
        backgroundColor: "var(--bg-card)",
        boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)",
        overflow: "hidden"
      }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "var(--text-main)" }}>
              Institutional Roll Call Audit Trail ({filteredRecords.length})
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem", display: "block" }}>
              Verified period sessions recorded by faculty
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ width: "24px", height: "24px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem auto" }} />
            <span>Synchronizing attendance log...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-muted)" }}>
            No attendance entries found matching the active filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card-header)" }}>
                  <th style={{ padding: "0.85rem 1.25rem", fontWeight: "700", color: "var(--text-muted)", fontSize: "0.75rem", letterSpacing: "0.05em" }}>DATE</th>
                  <th style={{ padding: "0.85rem 1.25rem", fontWeight: "700", color: "var(--text-muted)", fontSize: "0.75rem", letterSpacing: "0.05em" }}>CLASS</th>
                  <th style={{ padding: "0.85rem 1.25rem", fontWeight: "700", color: "var(--text-muted)", fontSize: "0.75rem", letterSpacing: "0.05em" }}>PERIOD</th>
                  <th style={{ padding: "0.85rem 1.25rem", fontWeight: "700", color: "var(--text-muted)", fontSize: "0.75rem", letterSpacing: "0.05em" }}>STUDENT NAME</th>
                  <th style={{ padding: "0.85rem 1.25rem", fontWeight: "700", color: "var(--text-muted)", fontSize: "0.75rem", letterSpacing: "0.05em" }}>SUBJECT</th>
                  <th style={{ padding: "0.85rem 1.25rem", fontWeight: "700", color: "var(--text-muted)", fontSize: "0.75rem", letterSpacing: "0.05em" }}>FACULTY</th>
                  <th style={{ padding: "0.85rem 1.25rem", fontWeight: "700", color: "var(--text-muted)", fontSize: "0.75rem", letterSpacing: "0.05em" }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r: any) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background-color 0.15s ease" }}>
                    <td style={{ padding: "0.85rem 1.25rem", fontWeight: "700", color: "var(--text-main)" }}>{r.dateString}</td>
                    <td style={{ padding: "0.85rem 1.25rem" }}>
                      <span style={{
                        padding: "0.2rem 0.55rem",
                        borderRadius: "6px",
                        backgroundColor: "rgba(37, 99, 235, 0.1)",
                        color: "var(--primary)",
                        fontWeight: "700",
                        fontSize: "0.75rem",
                        border: "1px solid rgba(37, 99, 235, 0.2)"
                      }}>
                        {r.classId}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1.25rem", color: "var(--text-muted)", fontWeight: "600" }}>Period {r.period}</td>
                    <td style={{ padding: "0.85rem 1.25rem", fontWeight: "700", color: "var(--text-main)" }}>
                      {r.studentName || r.studentId}
                    </td>
                    <td style={{ padding: "0.85rem 1.25rem" }}>
                      <strong style={{ color: "var(--text-main)" }}>{r.subjectCode}</strong>
                    </td>
                    <td style={{ padding: "0.85rem 1.25rem", color: "var(--text-muted)" }}>{r.facultyName}</td>
                    <td style={{ padding: "0.85rem 1.25rem" }}>
                      {r.status === "PRESENT" ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          color: "#10b981",
                          fontWeight: "700",
                          fontSize: "0.75rem",
                          backgroundColor: "rgba(16, 185, 129, 0.12)",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "99px",
                          border: "1px solid rgba(16, 185, 129, 0.25)"
                        }}>
                          <CheckCircle2 size={12} /> PRESENT
                        </span>
                      ) : r.status === "ON_DUTY" ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          color: "#38bdf8",
                          fontWeight: "700",
                          fontSize: "0.75rem",
                          backgroundColor: "rgba(56, 189, 248, 0.12)",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "99px",
                          border: "1px solid rgba(56, 189, 248, 0.25)"
                        }}>
                          <Clock size={12} /> ON DUTY
                        </span>
                      ) : (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          color: "#ef4444",
                          fontWeight: "700",
                          fontSize: "0.75rem",
                          backgroundColor: "rgba(239, 68, 68, 0.12)",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "99px",
                          border: "1px solid rgba(239, 68, 68, 0.25)"
                        }}>
                          <XCircle size={12} /> ABSENT
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
