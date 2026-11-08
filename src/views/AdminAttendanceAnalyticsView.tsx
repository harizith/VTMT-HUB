"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, Calendar, Search, Filter, RefreshCw, BarChart2 } from "lucide-react";

export default function AdminAttendanceAnalyticsView() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [classSummaries, setClassSummaries] = useState<any[]>([]);
  
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
      (r.studentId && r.studentId.toLowerCase().includes(q)) ||
      (r.classId && r.classId.toLowerCase().includes(q)) ||
      (r.subjectCode && r.subjectCode.toLowerCase().includes(q)) ||
      (r.facultyName && r.facultyName.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Metrics Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div className="premium-card" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
            COLLEGE ATTENDANCE RATE
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: summary.percentage >= 75 ? "#10b981" : summary.percentage >= 65 ? "#f59e0b" : "#ef4444" }}>
            {summary.percentage}%
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            {summary.present} present out of {summary.total} marked slots
          </div>
        </div>

        <div className="premium-card" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
            TOTAL SESSIONS RECORDED
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--royal-blue)" }}>
            {summary.total}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Across all classes & subjects
          </div>
        </div>

        <div className="premium-card" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
            ABSENT RECORDINGS
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#ef4444" }}>
            {summary.absent}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Defaulter & leave instances
          </div>
        </div>
      </div>

      {/* Class Section Breakdown */}
      {classSummaries.length > 0 && (
        <div className="premium-card" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <BarChart2 size={18} style={{ color: "var(--royal-blue)" }} />
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "var(--text-main)" }}>
              Section-wise Attendance Performance
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
            {classSummaries.map((c: any) => (
              <div key={c.classId} style={{ padding: "0.85rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-input)" }}>
                <strong style={{ fontSize: "0.95rem", color: "var(--text-main)", display: "block" }}>{c.classId}</strong>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.35rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{c.present}/{c.total} attended</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: "700", color: c.percentage >= 75 ? "#10b981" : "#ef4444" }}>
                    {c.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="premium-card" style={{ padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="premium-input"
            style={{ fontSize: "0.85rem", padding: "0.45rem 0.75rem" }}
          >
            <option value="ALL">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="IT">IT</option>
            <option value="MECH">MECH</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="premium-input"
            style={{ fontSize: "0.85rem", padding: "0.45rem 0.75rem" }}
          />

          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search student, subject, faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="premium-input"
              style={{ fontSize: "0.85rem", padding: "0.45rem 0.75rem 0.45rem 2rem", width: "230px" }}
            />
            <Search size={14} style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          </div>
        </div>

        <button
          onClick={fetchAttendance}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.45rem 0.9rem",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)",
            backgroundColor: "var(--bg-input)",
            color: "var(--text-main)",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: "600"
          }}
        >
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {/* Attendance Records Table */}
      <div className="premium-card" style={{ borderRadius: "12px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "var(--text-main)" }}>
            Live Attendance Audit Trail ({filteredRecords.length})
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Showing latest institution-wide sessions
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Loading attendance records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            No attendance records found matching filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-input)" }}>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: "700", color: "var(--text-muted)" }}>DATE</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: "700", color: "var(--text-muted)" }}>CLASS</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: "700", color: "var(--text-muted)" }}>PERIOD</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: "700", color: "var(--text-muted)" }}>STUDENT ID</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: "700", color: "var(--text-muted)" }}>SUBJECT</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: "700", color: "var(--text-muted)" }}>FACULTY</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: "700", color: "var(--text-muted)" }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r: any) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: "600", color: "var(--text-main)" }}>{r.dateString}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", backgroundColor: "rgba(10, 102, 194, 0.1)", color: "var(--royal-blue)", fontWeight: "600", fontSize: "0.75rem" }}>
                        {r.classId}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>Period {r.period}</td>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: "600", color: "var(--text-main)" }}>{r.studentId}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <strong style={{ color: "var(--text-main)" }}>{r.subjectCode}</strong>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>{r.facultyName}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {r.status === "PRESENT" ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#10b981", fontWeight: "700", fontSize: "0.75rem", backgroundColor: "rgba(16, 185, 129, 0.1)", padding: "0.2rem 0.5rem", borderRadius: "12px" }}>
                          <CheckCircle2 size={12} /> PRESENT
                        </span>
                      ) : r.status === "ON_DUTY" ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#38bdf8", fontWeight: "700", fontSize: "0.75rem", backgroundColor: "rgba(56, 189, 248, 0.1)", padding: "0.2rem 0.5rem", borderRadius: "12px" }}>
                          <Clock size={12} /> ON DUTY
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#ef4444", fontWeight: "700", fontSize: "0.75rem", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "0.2rem 0.5rem", borderRadius: "12px" }}>
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

