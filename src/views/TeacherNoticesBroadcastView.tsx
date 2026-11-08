"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiHome, FiCalendar, FiBell, FiUser, FiLogOut, FiMessageSquare, FiAlertCircle, FiInfo } from "react-icons/fi";
import { Megaphone, ArrowLeft, Plus, Users, Check, X, Search } from "lucide-react";

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
  vmNo?: string | null;
  email: string;
  rollNumber?: string | null;
  department?: string | null;
  computedClassId?: string;
}

export default function TeacherNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Post Notice Form
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeAudience, setNoticeAudience] = useState<"STUDENT" | "SPECIFIC_STUDENT">("STUDENT");
  const [noticeCategory, setNoticeCategory] = useState("GENERAL");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentsList, setStudentsList] = useState<StudentOption[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [postingNotice, setPostingNotice] = useState(false);

  const fetchNotices = () => {
    fetch("/api/teacher/notices")
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
    fetch("/api/teacher/students")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.students) {
          const mapped: StudentOption[] = json.data.students.map((s: any) => ({
            id: s.id,
            name: s.name,
            vmNo: s.vmNo,
            email: s.email,
            rollNumber: s.studentProfile?.rollNumber,
            department: s.studentProfile?.department,
            computedClassId: s.computedClassId
          }));
          setStudentsList(mapped);
        }
      })
      .catch((err) => console.error("Could not fetch students for selection", err));
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
      const res = await fetch("/api/teacher/notices", {
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
        alert("Announcement sent successfully!");
      } else {
        alert(resData.error || "Failed to post announcement");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setPostingNotice(false);
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <div className="admin-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  const getCategoryIcon = (cat: string) => {
    switch ((cat || "").toUpperCase()) {
      case "URGENT": return <FiAlertCircle style={{ color: "#ef4444" }} />;
      case "EXAM": return <FiCalendar style={{ color: "#f59e0b" }} />;
      default: return <FiInfo style={{ color: "#3b82f6" }} />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch ((cat || "").toUpperCase()) {
      case "URGENT": return { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444", border: "rgba(239, 68, 68, 0.3)" };
      case "EXAM": return { bg: "rgba(245, 158, 11, 0.15)", text: "#d97706", border: "rgba(245, 158, 11, 0.3)" };
      default: return { bg: "rgba(59, 130, 246, 0.15)", text: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" };
    }
  };

  const filteredStudents = studentsList.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.vmNo && s.vmNo.toLowerCase().includes(q)) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
      (s.computedClassId && s.computedClassId.toLowerCase().includes(q))
    );
  });

  return (
    <main className="student-main">
      <header className="student-header" style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Link href="/teacher" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--text-muted)", fontSize: "0.85rem", textDecoration: "none" }}>
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          </div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Megaphone size={24} style={{ color: "var(--royal-blue)" }} /> Staff & Student Announcements
          </h1>
          <p className="student-subtitle">Publish announcements to your students or view circulars from HOD & Admin.</p>
        </div>

        <button 
          onClick={() => setShowNoticeForm(!showNoticeForm)} 
          className="btn-sky"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Plus size={16} /> {showNoticeForm ? "Close Form" : "Send Announcement"}
        </button>
      </header>

      {/* Broadcast Form */}
      {showNoticeForm && (
        <div className="student-card premium-card" style={{ marginBottom: "2rem", border: "1px solid var(--royal-blue)" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-main)" }}>Send Announcement</h3>
          <form onSubmit={handlePostNotice} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.35rem", display: "block", fontWeight: 600 }}>
                Announcement Heading / Title
              </label>
              <input
                type="text"
                placeholder="e.g. Lab Record Submission Due Date"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                required
                className="premium-input"
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.35rem", display: "block", fontWeight: 600 }}>
                Details & Content
              </label>
              <textarea
                placeholder="Write announcement details, guidelines, or instructions..."
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                required
                className="premium-input"
                style={{ minHeight: "100px", resize: "vertical", width: "100%" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem", display: "block", fontWeight: 600 }}>
                  Target Audience
                </label>
                <select
                  value={noticeAudience}
                  onChange={(e) => setNoticeAudience(e.target.value as any)}
                  className="premium-input"
                  style={{ width: "100%" }}
                >
                  <option value="STUDENT">All My Students</option>
                  <option value="SPECIFIC_STUDENT">Selected Students Only (Choose Below)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem", display: "block", fontWeight: 600 }}>
                  Category
                </label>
                <select
                  value={noticeCategory}
                  onChange={(e) => setNoticeCategory(e.target.value)}
                  className="premium-input"
                  style={{ width: "100%" }}
                >
                  <option value="GENERAL">General</option>
                  <option value="URGENT">Urgent</option>
                  <option value="EXAM">Exam / Assignment</option>
                </select>
              </div>
            </div>

            {/* Select Specific Students Section */}
            {noticeAudience === "SPECIFIC_STUDENT" && (
              <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "1rem", backgroundColor: "var(--bg-input)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
                    Select Students ({selectedStudentIds.length} selected)
                  </span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button 
                      type="button" 
                      onClick={() => setSelectedStudentIds(filteredStudents.map(s => s.rollNumber || s.vmNo || s.email))}
                      style={{ fontSize: "0.75rem", background: "transparent", border: "none", color: "var(--sky-blue)", cursor: "pointer", fontWeight: 600 }}
                    >
                      Select All Filtered
                    </button>
                    <span style={{ color: "var(--border-subtle)" }}>•</span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedStudentIds([])}
                      style={{ fontSize: "0.75rem", background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 600 }}
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                <div style={{ position: "relative", marginBottom: "0.75rem" }}>
                  <Search size={16} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    placeholder="Search student by name, roll no, VM no, or class..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="premium-input"
                    style={{ paddingLeft: "2.25rem", width: "100%", fontSize: "0.85rem" }}
                  />
                </div>

                <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem", paddingRight: "0.25rem" }}>
                  {filteredStudents.length === 0 ? (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", padding: "1rem" }}>
                      No matching students found
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
                            padding: "0.5rem 0.75rem",
                            borderRadius: "8px",
                            cursor: "pointer",
                            backgroundColor: isSelected ? "rgba(56, 189, 248, 0.15)" : "var(--bg-card)",
                            border: isSelected ? "1px solid var(--sky-blue)" : "1px solid var(--border-subtle)",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>{s.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {s.rollNumber ? `Roll: ${s.rollNumber}` : s.vmNo ? `VM: ${s.vmNo}` : s.email}
                              {s.computedClassId ? ` • Class: ${s.computedClassId}` : ""}
                            </div>
                          </div>
                          <div style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "4px",
                            border: isSelected ? "1px solid var(--sky-blue)" : "1px solid var(--border-subtle)",
                            backgroundColor: isSelected ? "var(--sky-blue)" : "transparent",
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
                style={{ background: "transparent", border: "1px solid var(--border-subtle)", padding: "0.6rem 1.2rem", borderRadius: "8px", color: "var(--text-muted)", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-sky" disabled={postingNotice}>
                {postingNotice ? "Sending..." : "Send Announcement"}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: "var(--bg-card)", color: "#ef4444", padding: "1rem", borderRadius: "8px", marginBottom: "2rem", border: "1px solid #fca5a5" }}>
          {error}
        </div>
      )}

      {/* Announcements List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {notices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", backgroundColor: "var(--bg-card)", borderRadius: "16px", border: "1px dashed var(--border-subtle)" }}>
            <FiMessageSquare style={{ fontSize: "3rem", color: "var(--text-muted)", marginBottom: "1rem" }} />
            <h3 style={{ color: "var(--text-main)" }}>No announcements yet</h3>
            <p style={{ color: "var(--text-muted)" }}>Published circulars and sent announcements will appear here.</p>
          </div>
        ) : (
          notices.map((notice) => {
            const colors = getCategoryColor(notice.category);
            return (
              <div key={notice.id} className="student-card premium-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderLeft: `4px solid ${colors.text}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {getCategoryIcon(notice.category)}
                    <div>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--sky-blue)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Announcement Heading</span>
                      <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)" }}>{notice.title}</h3>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    {notice.audience && (
                      <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "4px", backgroundColor: "var(--bg-body)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)", fontWeight: 700 }}>
                        {notice.audience === "SPECIFIC_STUDENT" ? "SPECIFIC STUDENT" : notice.audience}
                      </span>
                    )}
                    <span style={{ 
                      fontSize: "0.75rem", 
                      fontWeight: 700, 
                      padding: "0.25rem 0.6rem", 
                      borderRadius: "6px",
                      backgroundColor: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`
                    }}>
                      {(notice.category || "GENERAL").toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <p style={{ margin: "0.25rem 0", color: "var(--text-muted)", lineHeight: "1.6", whiteSpace: "pre-line", fontSize: "0.95rem" }}>
                  {notice.content}
                </p>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
                  <span>Posted by: <strong style={{ color: "var(--text-main)" }}>{notice.postedBy}</strong></span>
                  <span>{new Date(notice.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
