"use client";

import { useState, useEffect, useMemo } from "react";
import { Users, Search, CheckCircle2, AlertTriangle, Filter } from "lucide-react";

interface StudentAttendanceRow {
  id: string;
  name: string;
  email: string;
  vmNo: string;
  rollNumber: string;
  department: string;
  year: string;
  section: string;
  semester: number | null;
  classId: string;
  totalClasses: number;
  presentClasses: number;
  odClasses: number;
  absentClasses: number;
  attendancePercentage: number;
}

export default function HodStudentAttendanceView() {
  const [students, setStudents] = useState<StudentAttendanceRow[]>([]);
  const [department, setDepartment] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/hod/student-attendance")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setDepartment(res.data.department || "");
          setStudents(res.data.students || []);
        } else {
          setError(res.error || "Failed to load student attendance");
        }
      })
      .catch((err) => setError(err.message || "Network error"))
      .finally(() => setLoading(false));
  }, []);

  const classOptions = useMemo(() => {
    const set = new Set(students.map((s) => s.classId));
    return ["ALL", ...Array.from(set).sort()];
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (classFilter !== "ALL" && s.classId !== classFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.vmNo.toLowerCase().includes(q) ||
        s.classId.toLowerCase().includes(q)
      );
    });
  }, [students, search, classFilter]);

  const summary = useMemo(() => {
    const total = filtered.length;
    const avg =
      total > 0
        ? Math.round(
            (filtered.reduce((acc, s) => acc + s.attendancePercentage, 0) / total) * 10
          ) / 10
        : 0;
    const below75 = filtered.filter((s) => s.totalClasses > 0 && s.attendancePercentage < 75).length;
    return { total, avg, below75 };
  }, [filtered]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            Student Attendance {department ? `— ${department}` : ""}
          </h1>
          <p style={{ margin: "0.25rem 0 0", opacity: 0.7, fontSize: "0.9rem" }}>
            Department-wide student attendance percentages across all recorded periods.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        <div className="card" style={{ padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: 0.7, fontSize: "0.85rem" }}>
            <Users size={16} /> Total Students
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "0.35rem" }}>
            {summary.total}
          </div>
        </div>
        <div className="card" style={{ padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: 0.7, fontSize: "0.85rem" }}>
            <CheckCircle2 size={16} /> Average Attendance
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "0.35rem" }}>
            {summary.avg}%
          </div>
        </div>
        <div className="card" style={{ padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: 0.7, fontSize: "0.85rem" }}>
            <AlertTriangle size={16} /> Below 75%
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              marginTop: "0.35rem",
              color: summary.below75 > 0 ? "#ef4444" : "inherit",
            }}
          >
            {summary.below75}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="card"
        style={{
          padding: "1rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.5,
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll no, or VM no..."
            className="input"
            style={{ width: "100%", paddingLeft: "2.25rem" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Filter size={16} style={{ opacity: 0.6 }} />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="input"
          >
            {classOptions.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "All Classes" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: "1rem", overflowX: "auto" }}>
        {loading ? (
          <p style={{ padding: "1rem", opacity: 0.7 }}>Loading student attendance...</p>
        ) : error ? (
          <p style={{ padding: "1rem", color: "#ef4444" }}>{error}</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: "1rem", opacity: 0.7 }}>No students found for this filter.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, rgba(255,255,255,0.1))" }}>
                <th style={{ padding: "0.75rem 0.5rem" }}>Student Name</th>
                <th style={{ padding: "0.75rem 0.5rem" }}>Roll / VM No</th>
                <th style={{ padding: "0.75rem 0.5rem" }}>Class</th>
                <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Present</th>
                <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>OD</th>
                <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Absent</th>
                <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Total</th>
                <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const pct = s.attendancePercentage;
                const badgeColor =
                  s.totalClasses === 0
                    ? "#6b7280"
                    : pct >= 75
                    ? "#10b981"
                    : pct >= 65
                    ? "#f59e0b"
                    : "#ef4444";

                return (
                  <tr
                    key={s.id}
                    style={{ borderBottom: "1px solid var(--border-color, rgba(255,255,255,0.06))" }}
                  >
                    <td style={{ padding: "0.7rem 0.5rem", fontWeight: 500 }}>{s.name}</td>
                    <td style={{ padding: "0.7rem 0.5rem", opacity: 0.8 }}>
                      {s.rollNumber || s.vmNo || "—"}
                    </td>
                    <td style={{ padding: "0.7rem 0.5rem" }}>{s.classId}</td>
                    <td style={{ padding: "0.7rem 0.5rem", textAlign: "right" }}>{s.presentClasses}</td>
                    <td style={{ padding: "0.7rem 0.5rem", textAlign: "right" }}>{s.odClasses}</td>
                    <td style={{ padding: "0.7rem 0.5rem", textAlign: "right" }}>{s.absentClasses}</td>
                    <td style={{ padding: "0.7rem 0.5rem", textAlign: "right" }}>{s.totalClasses}</td>
                    <td style={{ padding: "0.7rem 0.5rem", textAlign: "right" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "999px",
                          fontWeight: 600,
                          fontSize: "0.82rem",
                          backgroundColor: `${badgeColor}20`,
                          color: badgeColor,
                        }}
                      >
                        {s.totalClasses === 0 ? "N/A" : `${pct}%`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
