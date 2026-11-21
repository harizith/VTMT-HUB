"use client";

import { useEffect, useState } from "react";
import { Briefcase, Users, Activity, FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

export default function DepartmentPage() {
  const [dept, setDept] = useState<any>(null);
  const [stats, setStats] = useState<any>({ totalStudents: 0, totalFaculty: 0, avgAttendance: 100 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/departments").then((r) => r.json()).catch(() => null),
      fetch("/api/hod/dashboard").then((r) => r.json()).catch(() => null),
    ])
      .then(([deptRes, hodRes]) => {
        let hodDeptCode = hodRes?.data?.hod?.department || "CSE";
        let foundDept = null;
        if (deptRes?.success && deptRes?.departments?.length > 0) {
          foundDept = deptRes.departments.find((d: any) => d.code === hodDeptCode) || deptRes.departments[0];
        }
        if (foundDept) {
          if (!foundDept.hodName && hodRes?.data?.hod?.name) {
            foundDept = { ...foundDept, hodName: hodRes.data.hod.name };
          }
          setDept(foundDept);
        }
        if (hodRes?.data?.stats) {
          setStats(hodRes.data.stats);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleExportAll = async () => {
    if (!dept) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/hod/attendance/export?departmentCode=${dept.code}`);
      const { data } = await res.json();

      const worksheetData = data.students.map((s: any) => ({
        "Roll No": s.studentProfile?.rollNumber || s.vmNo || "N/A",
        Name: s.name,
        Section: s.studentProfile?.section || "N/A",
        "Total Present": data.attendance.filter((a: any) => a.studentId === s.id && a.status === "PRESENT").length,
        "Total Absent": data.attendance.filter((a: any) => a.studentId === s.id && a.status === "ABSENT").length,
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "AttendanceSummary");
      XLSX.writeFile(workbook, `Attendance_Summary_${dept.code}.xlsx`);
    } catch (e) {
      console.error(e);
      alert("Failed to export attendance");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div
        style={{
          marginBottom: "1.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.25rem 0" }}>
            Department Operational Overview
          </h2>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.85rem" }}>
            Departmental intelligence, strength analytics, and university compliance summaries.
          </p>
        </div>
        <button onClick={handleExportAll} disabled={exporting} className="btn-royal">
          {exporting ? (
            <>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              <span>Generating Excel...</span>
            </>
          ) : (
            <>
              <FileSpreadsheet size={16} />
              <span>Export All Student Attendance</span>
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading department metrics...</p>
          </div>
        </div>
      ) : dept ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="student-card premium-card" style={{ padding: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "14px",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Briefcase size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.25rem 0", color: "var(--text-main)" }}>
                  {dept.name}
                </h3>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#10b981",
                    fontWeight: 700,
                    padding: "0.15rem 0.55rem",
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    borderRadius: "6px",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  DEPT CODE: {dept.code}
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: "1.5rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  padding: "0.85rem 1rem",
                  backgroundColor: "var(--bg-input)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.3rem", fontWeight: 700 }}>
                  HEAD OF DEPARTMENT
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)" }}>
                  {dept.hodName || "Not Assigned"}
                </div>
              </div>
              <div
                style={{
                  padding: "0.85rem 1rem",
                  backgroundColor: "var(--bg-input)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.3rem", fontWeight: 700 }}>
                  INSTITUTIONAL STATUS
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#10b981" }}>
                  ● Active & NAAC / NBA Accredited
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            <div
              className="student-card premium-card"
              style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  backgroundColor: "var(--primary-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)",
                }}
              >
                <Users size={24} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)", fontVariantNumeric: "tabular-nums" }}>
                  {stats.totalStudents}
                </h4>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  Active Enrolled Students
                </span>
              </div>
            </div>

            <div
              className="student-card premium-card"
              style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(168, 85, 247, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#a855f7",
                }}
              >
                <Activity size={24} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)", fontVariantNumeric: "tabular-nums" }}>
                  {stats.avgAttendance}%
                </h4>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  Daily Attendance (Period 1)
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ color: "var(--text-muted)" }}>No department data found.</div>
      )}
    </div>
  );
}
