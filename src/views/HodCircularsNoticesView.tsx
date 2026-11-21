"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, ArrowLeft, Plus, Users, Check, Search, Filter, AlertCircle, Info, Calendar, X } from "lucide-react";

interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  audience?: string;
  targetStudentId?: string | null;
  postedBy: string;
  createdAt: string;
}

interface StudentOption {
  id: string;
  name: string;
  email: string;
  vmNo?: string | null;
  rollNumber?: string;
  department?: string;
  classId?: string;
}

export default function HodNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Post Notice Form
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeAudience, setNoticeAudience] = useState<"ALL" | "FACULTY" | "STUDENT" | "SPECIFIC_STUDENT">("ALL");
  const [noticeCategory, setNoticeCategory] = useState("GENERAL");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentsList, setStudentsList] = useState<StudentOption[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [postingNotice, setPostingNotice] = useState(false);

  const fetchNotices = () => {
    fetch("/api/hod/notices")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setNotices(json.data || []);
        } else {
          setError(json.error || "Failed to load notices.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("An error occurred while fetching notices.");
        setLoading(false);
      });
  };

  const fetchStudents = () => {
    fetch("/api/hod/students")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setStudentsList(json.data);
        }
      })
      .catch((err) => console.error("Could not fetch students list", err));
  };

  useEffect(() => {
    fetchNotices();
    fetchStudents();
  }, []);

  const toggleStudentSelection = (val: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(val) ? prev.filter((id) => id !== val) : [...prev, val]
    );
  };

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      alert("Please enter title and content.");
      return;
    }

    if (noticeAudience === "SPECIFIC_STUDENT" && selectedStudentIds.length === 0) {
      alert("Please select at least one student from the list.");
      return;
    }

    setPostingNotice(true);
    try {
      const res = await fetch("/api/hod/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noticeTitle,
          content: noticeContent,
          audience: noticeAudience,
          category: noticeCategory,
          targetStudentIds: selectedStudentIds
        })
      });
      const resData = await res.json();
      if (resData.success) {
        setNoticeTitle("");
        setNoticeContent("");
        setSelectedStudentIds([]);
        setShowNoticeForm(false);
        fetchNotices();
      } else {
        alert(resData.error || "Failed to post notice");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setPostingNotice(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)", fontSize: "0.95rem" }}>
          <div style={{ width: "20px", height: "20px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span>Loading announcements & circulars...</span>
        </div>
      </div>
    );
  }

  const getCategoryTheme = (cat: string) => {
    switch ((cat || "").toUpperCase()) {
      case "URGENT":
        return {
          bg: "rgba(239, 68, 68, 0.12)",
          text: "#ef4444",
          border: "rgba(239, 68, 68, 0.25)",
          icon: <AlertCircle size={15} style={{ color: "#ef4444" }} />
        };
      case "EXAM":
        return {
          bg: "rgba(245, 158, 11, 0.12)",
          text: "#f59e0b",
          border: "rgba(245, 158, 11, 0.25)",
          icon: <Calendar size={15} style={{ color: "#f59e0b" }} />
        };
      default:
        return {
          bg: "rgba(37, 99, 235, 0.1)",
          text: "var(--primary)",
          border: "rgba(37, 99, 235, 0.25)",
          icon: <Info size={15} style={{ color: "var(--primary)" }} />
        };
    }
  };

  const filteredStudents = studentsList.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
      (s.vmNo && s.vmNo.toLowerCase().includes(q)) ||
      (s.classId && s.classId.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q))
    );
  });

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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Link href="/hod" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--text-muted)", fontSize: "0.85rem", textDecoration: "none", fontWeight: 600 }}>
              <ArrowLeft size={14} /> Back to Department Dashboard
            </Link>
          </div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: "800", letterSpacing: "-0.03em", margin: 0, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Megaphone size={24} style={{ color: "var(--primary)" }} /> Department & Circular Broadcasts
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: "0.35rem 0 0 0" }}>
            Broadcast academic circulars and administrative alerts across faculty, students, or targeted cohorts.
          </p>
        </div>

        <button
          onClick={() => setShowNoticeForm(!showNoticeForm)}
          className="btn-royal"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1.25rem", borderRadius: "10px", fontSize: "0.88rem", fontWeight: 700 }}
        >
          {showNoticeForm ? <X size={16} /> : <Plus size={16} />}
          <span>{showNoticeForm ? "Close Composer" : "Compose Broadcast"}</span>
        </button>
      </div>

      {/* Notice Broadcast Form */}
      {showNoticeForm && (
        <div style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "16px",
          border: "1px solid var(--primary)",
          padding: "1.75rem",
          boxShadow: "0 8px 24px -4px rgba(37, 99, 235, 0.15)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
              Publish Institutional Announcement
            </h3>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>HOD Priority Dispatch</span>
          </div>

          <form onSubmit={handlePostNotice} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ fontSize: "0.82rem", color: "var(--text-main)", marginBottom: "0.4rem", display: "block", fontWeight: 700 }}>
                Announcement Headline
              </label>
              <input
                type="text"
                placeholder="e.g. Autonomous Semester Examination Timetable & Hall Allocations 2026"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                required
                className="admin-input"
                style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.92rem" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", color: "var(--text-main)", marginBottom: "0.4rem", display: "block", fontWeight: 700 }}>
                Circular Details & Instructions
              </label>
              <textarea
                placeholder="Provide complete guidelines, dates, room details, or required student action items..."
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                required
                className="admin-input"
                style={{ minHeight: "120px", resize: "vertical", width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.92rem" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.82rem", color: "var(--text-main)", marginBottom: "0.4rem", display: "block", fontWeight: 700 }}>
                  Target Audience
                </label>
                <select
                  value={noticeAudience}
                  onChange={(e) => setNoticeAudience(e.target.value as any)}
                  className="admin-input"
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.9rem" }}
                >
                  <option value="ALL">All (Faculty & Students)</option>
                  <option value="FACULTY">Faculty Only (Teaching Staff)</option>
                  <option value="STUDENT">Students Only</option>
                  <option value="SPECIFIC_STUDENT">Specific Individual Students</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", color: "var(--text-main)", marginBottom: "0.4rem", display: "block", fontWeight: 700 }}>
                  Priority Category
                </label>
                <select
                  value={noticeCategory}
                  onChange={(e) => setNoticeCategory(e.target.value)}
                  className="admin-input"
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.9rem" }}
                >
                  <option value="GENERAL">General Notice</option>
                  <option value="URGENT">Urgent / Immediate Action</option>
                  <option value="EXAM">Examination / Assessment</option>
                </select>
              </div>
            </div>

            {/* Specific Student Selector */}
            {noticeAudience === "SPECIFIC_STUDENT" && (
              <div style={{
                border: "1px solid var(--border-subtle)",
                borderRadius: "12px",
                padding: "1.25rem",
                backgroundColor: "var(--bg-input)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
                    Targeted Students ({selectedStudentIds.length} selected)
                  </span>
                  <div style={{ display: "flex", gap: "0.6rem" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds(filteredStudents.map(s => s.rollNumber || s.vmNo || s.email))}
                      style={{ fontSize: "0.75rem", background: "transparent", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: 700 }}
                    >
                      Select All Filtered
                    </button>
                    <span style={{ color: "var(--border-subtle)" }}>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds([])}
                      style={{ fontSize: "0.75rem", background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 700 }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div style={{ position: "relative", marginBottom: "0.75rem" }}>
                  <Search size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    placeholder="Search students by name, roll no, VM no, or class..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="admin-input"
                    style={{ paddingLeft: "2.5rem", width: "100%", fontSize: "0.85rem", borderRadius: "8px" }}
                  />
                </div>

                <div style={{ maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem", paddingRight: "0.35rem" }}>
                  {filteredStudents.length === 0 ? (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "1.5rem" }}>
                      No students found matching your search.
                    </div>
                  ) : (
                    filteredStudents.map((s) => {
                      const idVal = s.rollNumber || s.vmNo || s.email;
                      const isSelected = selectedStudentIds.includes(idVal);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleStudentSelection(idVal)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.6rem 0.85rem",
                            borderRadius: "8px",
                            cursor: "pointer",
                            backgroundColor: isSelected ? "rgba(37, 99, 235, 0.1)" : "var(--bg-card)",
                            border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border-subtle)",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>{s.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {s.rollNumber ? `Roll: ${s.rollNumber}` : s.vmNo ? `VM: ${s.vmNo}` : s.email}
                              {s.classId ? ` • Class: ${s.classId}` : ""}
                            </div>
                          </div>
                          <div style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "6px",
                            border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border-subtle)",
                            backgroundColor: isSelected ? "var(--primary)" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff"
                          }}>
                            {isSelected && <Check size={14} />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setShowNoticeForm(false)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-subtle)",
                  padding: "0.65rem 1.25rem",
                  borderRadius: "10px",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "0.88rem",
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-royal"
                disabled={postingNotice}
                style={{ padding: "0.65rem 1.5rem", borderRadius: "10px", fontSize: "0.88rem", fontWeight: 700 }}
              >
                {postingNotice ? "Dispatching Broadcast..." : "Publish Broadcast"}
              </button>
            </div>
          </form>
        </div>
      )}

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

      {/* Notices Stream */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {notices.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "4rem 2rem",
            backgroundColor: "var(--bg-card)",
            borderRadius: "16px",
            border: "1px dashed var(--border-subtle)"
          }}>
            <Megaphone size={40} style={{ opacity: 0.25, margin: "0 auto 1rem auto" }} />
            <h3 style={{ color: "var(--text-main)", fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.4rem 0" }}>
              No Circulars Published Yet
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
              Use the "Compose Broadcast" button above to publish announcements to department faculty and students.
            </p>
          </div>
        ) : (
          notices.map((notice) => {
            const theme = getCategoryTheme(notice.category);
            return (
              <div
                key={notice.id}
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderRadius: "16px",
                  border: "1px solid var(--border-subtle)",
                  borderLeft: `4px solid ${theme.text}`,
                  padding: "1.5rem",
                  boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                  transition: "transform 0.15s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                      padding: "0.45rem",
                      borderRadius: "10px",
                      backgroundColor: theme.bg,
                      border: `1px solid ${theme.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {theme.icon}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.01em" }}>
                        {notice.title}
                      </h3>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    {notice.audience && (
                      <span style={{
                        fontSize: "0.72rem",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "99px",
                        backgroundColor: "var(--bg-input)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border-subtle)",
                        fontWeight: 700
                      }}>
                        {notice.audience === "ALL" ? "ALL FACULTY & STUDENTS" : notice.audience === "FACULTY" ? "FACULTY ONLY" : notice.audience === "STUDENT" ? "STUDENTS ONLY" : "TARGETED COHORT"}
                      </span>
                    )}
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      padding: "0.2rem 0.6rem",
                      borderRadius: "99px",
                      backgroundColor: theme.bg,
                      color: theme.text,
                      border: `1px solid ${theme.border}`
                    }}>
                      {(notice.category || "GENERAL").toUpperCase()}
                    </span>
                  </div>
                </div>

                <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: "1.6", whiteSpace: "pre-line", fontSize: "0.92rem" }}>
                  {notice.content}
                </p>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "0.75rem",
                  flexWrap: "wrap",
                  gap: "0.5rem"
                }}>
                  <span>Issued by: <strong style={{ color: "var(--text-main)" }}>{notice.postedBy}</strong></span>
                  <span>{new Date(notice.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
