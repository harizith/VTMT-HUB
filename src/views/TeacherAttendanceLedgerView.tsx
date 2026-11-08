"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle2, XCircle, Clock, AlertCircle, Download, CheckCheck, RefreshCw, Filter, Search, Calendar, UserCheck } from "lucide-react";

export type AttendanceStatus = "Present" | "Absent" | "Late" | "OD";

interface StudentRow {
  id: string;
  name: string;
  email: string;
  rollNo?: string;
  vmNo?: string;
  section?: string;
  computedClassId?: string;
  attendancePercent?: number;
}

export default function TeacherAttendanceLedgerView() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("All");

  // Attendance map: studentId -> Status ("Present" | "Absent" | "Late" | "OD")
  const [attendanceRecords, setAttendanceRecords] = useState<{ [studentId: string]: AttendanceStatus }>({});

  // Standard VTMT period timing slots
  const periodSlots: { [key: number]: string } = {
    1: "08:45 - 09:35",
    2: "09:35 - 10:25",
    3: "10:45 - 11:35",
    4: "11:35 - 12:25",
    5: "01:15 - 02:05",
    6: "02:05 - 02:55",
    7: "03:05 - 03:55",
    8: "03:55 - 04:45",
  };

  // Load teacher classes & student roster
  const loadData = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/students?date=${dateStr}`);
      const data = await res.json();
      if (data.success) {
        const studentList: StudentRow[] = (data.data.students || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          rollNo: s.studentProfile?.rollNumber || s.rollNo || s.vmNo || "N/A",
          vmNo: s.vmNo || s.studentProfile?.vmNo || "N/A",
          section: s.computedClassId || s.section || "CSE-A",
          computedClassId: s.computedClassId || "CSE-A",
          attendancePercent: s.attendancePercent || 85.0
        }));

        setStudents(studentList);
        const classes = data.data.todayClasses || [];
        setTodayClasses(classes);

        if (classes.length > 0) {
          if (!selectedCourseCode) {
            setSelectedCourseCode(classes[0].subjectCode || "21CS601");
          }
        }

        // Initialize / Map attendance records from DB
        const dbRecords = data.data.attendance || [];
        const initialStatus: { [studentId: string]: AttendanceStatus } = {};

        studentList.forEach((s) => {
          const rec = dbRecords.find((r: any) => r.studentId === s.id && Number(r.period) === Number(selectedPeriod));
          if (rec) {
            const raw = String(rec.status || "").toUpperCase();
            if (raw === "ABSENT") initialStatus[s.id] = "Absent";
            else if (raw === "LATE") initialStatus[s.id] = "Late";
            else if (raw === "OD") initialStatus[s.id] = "OD";
            else initialStatus[s.id] = "Present";
          } else {
            // Default to Present
            initialStatus[s.id] = "Present";
          }
        });

        setAttendanceRecords(initialStatus);
      }
    } catch (err) {
      console.error("Failed to load teacher students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  // When period changes, reload matching DB records
  useEffect(() => {
    if (students.length > 0) {
      fetch(`/api/teacher/attendance?dateString=${selectedDate}&period=${selectedPeriod}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.records)) {
            const map: { [id: string]: AttendanceStatus } = {};
            students.forEach((s) => {
              const match = data.records.find((r: any) => r.studentId === s.id);
              if (match) {
                const raw = String(match.status || "").toUpperCase();
                if (raw === "ABSENT") map[s.id] = "Absent";
                else if (raw === "LATE") map[s.id] = "Late";
                else if (raw === "OD") map[s.id] = "OD";
                else map[s.id] = "Present";
              } else {
                map[s.id] = "Present";
              }
            });
            setAttendanceRecords(map);
          }
        })
        .catch(() => {});
    }
  }, [selectedPeriod]);

  // Available unique sections
  const availableSections = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.computedClassId) set.add(s.computedClassId);
    });
    return Array.from(set);
  }, [students]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSection = selectedSection === "All" || s.computedClassId === selectedSection;
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        s.name.toLowerCase().includes(q) ||
        (s.rollNo && s.rollNo.toLowerCase().includes(q)) ||
        (s.vmNo && s.vmNo.toLowerCase().includes(q)) ||
        s.email.toLowerCase().includes(q);
      return matchesSection && matchesSearch;
    });
  }, [students, selectedSection, searchTerm]);

  // Status toggle
  const handleStatusToggle = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Mark all
  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: { [studentId: string]: AttendanceStatus } = { ...attendanceRecords };
    filteredStudents.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceRecords(updated);
  };

  // Metrics
  const totalCount = filteredStudents.length;
  const presentCount = filteredStudents.filter((s) => (attendanceRecords[s.id] || "Present") === "Present").length;
  const absentCount = filteredStudents.filter((s) => attendanceRecords[s.id] === "Absent").length;
  const lateCount = filteredStudents.filter((s) => attendanceRecords[s.id] === "Late").length;
  const odCount = filteredStudents.filter((s) => attendanceRecords[s.id] === "OD").length;
  const effectivePresent = presentCount + odCount;
  const sessionRate = totalCount > 0 ? ((effectivePresent / totalCount) * 100).toFixed(0) : "0";

  // Commit session to database
  const handleCommitSession = async () => {
    if (filteredStudents.length === 0) {
      alert("No students in current view to commit.");
      return;
    }

    setSubmitting(true);
    try {
      const activeClass = todayClasses.find((c) => Number(c.period) === Number(selectedPeriod));
      const subjectCode = selectedCourseCode || activeClass?.subjectCode || "21CS601";
      const classId = selectedSection !== "All" ? selectedSection : (activeClass?.classId || "II-CSE-A");
      const dayOrder = activeClass?.dayOrder || "I";

      const batch = filteredStudents.map((s) => ({
        studentId: s.id,
        classId: s.computedClassId || classId,
        dateString: selectedDate,
        dayOrder: String(dayOrder),
        period: Number(selectedPeriod),
        subjectCode,
        status: (attendanceRecords[s.id] || "Present").toUpperCase(),
      }));

      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch }),
      });

      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        setStatusMessage(`Successfully saved ${json.count || batch.length} student attendance records for Period ${selectedPeriod}!`);
        setTimeout(() => {
          setSaveSuccess(false);
          setStatusMessage("");
        }, 5000);
      } else {
        alert(json.error || "Failed to commit attendance.");
      }
    } catch (err: any) {
      console.error("Save error:", err);
      alert(err.message || "An error occurred while saving attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["Register/VM No", "Student Name", "Email", "Section", "Subject Code", "Date", "Period", "Status"];
    const rows = filteredStudents.map((s) => [
      s.rollNo || s.vmNo || "N/A",
      `"${s.name}"`,
      s.email,
      s.computedClassId || selectedSection,
      selectedCourseCode || "21CS601",
      selectedDate,
      `Period ${selectedPeriod} (${periodSlots[selectedPeriod] || "Hour"})`,
      attendanceRecords[s.id] || "Present",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_${selectedCourseCode || "Course"}_P${selectedPeriod}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" style={{ paddingBottom: "2rem" }}>
      {/* 1. Header & Actions (Clean LinkedIn ERP style) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "700", color: "var(--text-main)", margin: 0, letterSpacing: "-0.01em" }}>
            Fast Roll Call & Period Attendance Ledger
          </h1>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
            1-tap roll call logging (Present, Absent, Late, OD), instant CSV audit report, and PostgreSQL persistent ledger.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={handleExportCSV}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 1rem",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-main)",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <Download size={15} style={{ color: "#16a34a" }} />
            Export to CSV
          </button>

          <button
            onClick={handleCommitSession}
            disabled={submitting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 1.25rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "var(--royal-blue)",
              color: "white",
              fontSize: "0.85rem",
              fontWeight: "700",
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: "0 2px 6px rgba(10, 102, 194, 0.3)",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            <CheckCheck size={16} />
            {submitting ? "Committing..." : "✓ Commit Session"}
          </button>
        </div>
      </div>

      {/* Success banner */}
      {saveSuccess && (
        <div
          style={{
            borderRadius: "10px",
            border: "1px solid rgba(22, 163, 74, 0.3)",
            backgroundColor: "rgba(22, 163, 74, 0.08)",
            padding: "0.85rem 1.25rem",
            fontSize: "0.88rem",
            fontWeight: "600",
            color: "#16a34a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>✓ {statusMessage || `Period ${selectedPeriod} session committed to institutional audit ledger!`}</span>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "monospace" }}>Synced to DB</span>
        </div>
      )}

      {/* 2. Selection & Filter Toolbar */}
      <div className="student-card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {/* Subject */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Subject
            </label>
            <select
              value={selectedCourseCode}
              onChange={(e) => setSelectedCourseCode(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: "0.85rem",
                outline: "none",
                fontWeight: "600",
              }}
            >
              {todayClasses.length > 0 ? (
                todayClasses.map((c, idx) => (
                  <option key={`${c.subjectCode}-${idx}`} value={c.subjectCode}>
                    {c.subjectCode} - {c.subjectName || "Course"} ({c.classId || "Class"})
                  </option>
                ))
              ) : (
                <>
                  <option value="21CS601">21CS601 - Cloud Computing (CSE-A)</option>
                  <option value="21CS602">21CS602 - Artificial Intelligence & ML (CSE-B)</option>
                  <option value="21CS603">21CS603 - Compiler Design (CSE-A)</option>
                </>
              )}
            </select>
          </div>

          {/* Section */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: "0.85rem",
                outline: "none",
                fontWeight: "600",
              }}
            >
              <option value="All">All Enrolled Sections</option>
              {availableSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Period Slot */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Period Hour
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: "0.85rem",
                outline: "none",
                fontWeight: "600",
                fontFamily: "monospace",
              }}
            >
              {Object.entries(periodSlots).map(([p, label]) => (
                <option key={p} value={p}>
                  Period {p} ({label})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Session Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: "0.85rem",
                outline: "none",
                fontWeight: "600",
                fontFamily: "monospace",
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Live Session Metrics Counter */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
        {/* Total */}
        <div className="student-card" style={{ textAlign: "center", padding: "1rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Enrolled</span>
          <p style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", margin: "4px 0 0 0", fontFamily: "monospace" }}>{totalCount}</p>
        </div>

        {/* Present */}
        <div
          className="student-card"
          style={{
            textAlign: "center",
            padding: "1rem",
            backgroundColor: "rgba(22, 163, 74, 0.06)",
            border: "1px solid rgba(22, 163, 74, 0.25)",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#16a34a", textTransform: "uppercase" }}>Present</span>
          <p style={{ fontSize: "1.75rem", fontWeight: "800", color: "#16a34a", margin: "4px 0 0 0", fontFamily: "monospace" }}>{presentCount}</p>
        </div>

        {/* Absent */}
        <div
          className="student-card"
          style={{
            textAlign: "center",
            padding: "1rem",
            backgroundColor: "rgba(220, 38, 38, 0.06)",
            border: "1px solid rgba(220, 38, 38, 0.25)",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#dc2626", textTransform: "uppercase" }}>Absent</span>
          <p style={{ fontSize: "1.75rem", fontWeight: "800", color: "#dc2626", margin: "4px 0 0 0", fontFamily: "monospace" }}>{absentCount}</p>
        </div>

        {/* Late / OD */}
        <div
          className="student-card"
          style={{
            textAlign: "center",
            padding: "1rem",
            backgroundColor: "rgba(217, 119, 6, 0.06)",
            border: "1px solid rgba(217, 119, 6, 0.25)",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#d97706", textTransform: "uppercase" }}>Late / OD</span>
          <p style={{ fontSize: "1.75rem", fontWeight: "800", color: "#d97706", margin: "4px 0 0 0", fontFamily: "monospace" }}>{lateCount + odCount}</p>
        </div>

        {/* Session Rate */}
        <div
          className="student-card"
          style={{
            textAlign: "center",
            padding: "1rem",
            backgroundColor: "rgba(10, 102, 194, 0.06)",
            border: "1px solid rgba(10, 102, 194, 0.25)",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--royal-blue)", textTransform: "uppercase" }}>Session Rate</span>
          <p style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--royal-blue)", margin: "4px 0 0 0", fontFamily: "monospace" }}>{sessionRate}%</p>
        </div>
      </div>

      {/* 4. Student Roster Roll Call Matrix */}
      <div className="student-card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
              Roll Call Roster • Period {selectedPeriod} ({periodSlots[selectedPeriod] || "Hour"})
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              1-tap buttons to set Present, Absent, Late, or On-Duty (OD).
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            {/* Live Search Box */}
            <div style={{ position: "relative", minWidth: "220px" }}>
              <Search size={15} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search student or roll..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.75rem 0.45rem 2.2rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-main)",
                  fontSize: "0.82rem",
                  outline: "none",
                }}
              />
            </div>

            <button
              onClick={() => handleMarkAll("Present")}
              style={{
                borderRadius: "8px",
                border: "1px solid rgba(22, 163, 74, 0.4)",
                backgroundColor: "rgba(22, 163, 74, 0.08)",
                padding: "0.45rem 0.85rem",
                fontSize: "0.8rem",
                fontWeight: "700",
                color: "#16a34a",
                cursor: "pointer",
              }}
            >
              ✓ Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll("Absent")}
              style={{
                borderRadius: "8px",
                border: "1px solid rgba(220, 38, 38, 0.4)",
                backgroundColor: "rgba(220, 38, 38, 0.08)",
                padding: "0.45rem 0.85rem",
                fontSize: "0.8rem",
                fontWeight: "700",
                color: "#dc2626",
                cursor: "pointer",
              }}
            >
              ✕ Mark All Absent
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto", marginTop: "0.75rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ padding: "0.75rem 1rem" }}>Reg No / VM ID</th>
                <th style={{ padding: "0.75rem 1rem" }}>Student Name</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Aggregate Att %</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>1-Tap Roll Call Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    Loading student attendance roster...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    No students found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const currentStatus = attendanceRecords[student.id] || "Present";

                  return (
                    <tr
                      key={student.id || idx}
                      style={{
                        borderBottom: idx === filteredStudents.length - 1 ? "none" : "1px solid var(--border-subtle)",
                        backgroundColor: currentStatus === "Absent" ? "rgba(220, 38, 38, 0.03)" : "transparent",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontWeight: "700", color: "var(--text-main)" }}>
                        {student.rollNo || student.vmNo}
                      </td>

                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ fontWeight: "700", color: "var(--text-main)" }}>{student.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{student.email}</div>
                      </td>

                      <td style={{ padding: "0.75rem 1rem", textAlign: "center", fontFamily: "monospace" }}>
                        <span
                          style={{
                            display: "inline-block",
                            borderRadius: "4px",
                            padding: "0.2rem 0.5rem",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            backgroundColor: (student.attendancePercent || 85) >= 75 ? "rgba(22, 163, 74, 0.12)" : "rgba(220, 38, 38, 0.12)",
                            color: (student.attendancePercent || 85) >= 75 ? "#16a34a" : "#dc2626",
                          }}
                        >
                          {(student.attendancePercent || 85).toFixed(1)}%
                        </span>
                      </td>

                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                          {/* Present */}
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(student.id, "Present")}
                            style={{
                              borderRadius: "6px",
                              padding: "0.35rem 0.75rem",
                              fontSize: "0.78rem",
                              fontWeight: "700",
                              cursor: "pointer",
                              border: currentStatus === "Present" ? "1px solid #16a34a" : "1px solid var(--border-subtle)",
                              backgroundColor: currentStatus === "Present" ? "#16a34a" : "var(--bg-input)",
                              color: currentStatus === "Present" ? "white" : "var(--text-muted)",
                              transition: "all 0.15s ease",
                            }}
                          >
                            Present
                          </button>

                          {/* Absent */}
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(student.id, "Absent")}
                            style={{
                              borderRadius: "6px",
                              padding: "0.35rem 0.75rem",
                              fontSize: "0.78rem",
                              fontWeight: "700",
                              cursor: "pointer",
                              border: currentStatus === "Absent" ? "1px solid #dc2626" : "1px solid var(--border-subtle)",
                              backgroundColor: currentStatus === "Absent" ? "#dc2626" : "var(--bg-input)",
                              color: currentStatus === "Absent" ? "white" : "var(--text-muted)",
                              transition: "all 0.15s ease",
                            }}
                          >
                            Absent
                          </button>

                          {/* Late */}
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(student.id, "Late")}
                            style={{
                              borderRadius: "6px",
                              padding: "0.35rem 0.75rem",
                              fontSize: "0.78rem",
                              fontWeight: "700",
                              cursor: "pointer",
                              border: currentStatus === "Late" ? "1px solid #d97706" : "1px solid var(--border-subtle)",
                              backgroundColor: currentStatus === "Late" ? "#d97706" : "var(--bg-input)",
                              color: currentStatus === "Late" ? "white" : "var(--text-muted)",
                              transition: "all 0.15s ease",
                            }}
                          >
                            Late
                          </button>

                          {/* OD */}
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(student.id, "OD")}
                            style={{
                              borderRadius: "6px",
                              padding: "0.35rem 0.75rem",
                              fontSize: "0.78rem",
                              fontWeight: "700",
                              cursor: "pointer",
                              border: currentStatus === "OD" ? "1px solid #0284c7" : "1px solid var(--border-subtle)",
                              backgroundColor: currentStatus === "OD" ? "#0284c7" : "var(--bg-input)",
                              color: currentStatus === "OD" ? "white" : "var(--text-muted)",
                              transition: "all 0.15s ease",
                            }}
                          >
                            OD
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Submit Bottom Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)", marginTop: "1rem" }}>
          <button
            onClick={handleCommitSession}
            disabled={submitting}
            style={{
              borderRadius: "8px",
              border: "none",
              backgroundColor: "var(--royal-blue)",
              color: "white",
              padding: "0.6rem 1.5rem",
              fontSize: "0.85rem",
              fontWeight: "700",
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: "0 2px 6px rgba(10, 102, 194, 0.3)",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            ✓ Commit & Finalize Attendance Session
          </button>
        </div>
      </div>
    </div>
  );
}
