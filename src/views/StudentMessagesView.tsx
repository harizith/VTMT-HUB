"use client";

import { useEffect, useState } from "react";
import { FiMessageSquare, FiAlertCircle, FiInfo, FiCalendar } from "react-icons/fi";
import { Loader2, Bell } from "lucide-react";

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

export default function MessagesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/student/notices")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setNotices(json.data);
        } else {
          setError(json.error || "Failed to load messages.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("An error occurred while fetching messages.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading notices and circulars...</p>
        </div>
      </div>
    );
  }

  const getCategoryTheme = (cat: string) => {
    switch (cat.toUpperCase()) {
      case "URGENT":
        return {
          icon: <FiAlertCircle size={17} style={{ color: "var(--danger)" }} />,
          bg: "var(--danger-bg)",
          text: "var(--danger)",
          border: "var(--danger-border)",
          accent: "var(--danger)",
        };
      case "EXAM":
        return {
          icon: <FiCalendar size={17} style={{ color: "var(--warning)" }} />,
          bg: "var(--warning-bg)",
          text: "var(--warning)",
          border: "var(--warning-border)",
          accent: "var(--warning)",
        };
      default:
        return {
          icon: <FiInfo size={17} style={{ color: "var(--primary)" }} />,
          bg: "var(--primary-subtle)",
          text: "var(--primary)",
          border: "rgba(37, 99, 235, 0.2)",
          accent: "var(--primary)",
        };
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.25rem 0" }}>
          Campus Notices & Announcements
        </h2>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Official circulars, academic notifications, and direct department broadcasts.
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

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {notices.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              backgroundColor: "var(--bg-card)",
              borderRadius: "var(--radius-card)",
              border: "1px dashed var(--border-subtle)",
            }}
          >
            <FiMessageSquare style={{ fontSize: "2.75rem", color: "var(--text-tertiary)", marginBottom: "0.75rem" }} />
            <h3 style={{ color: "var(--text-main)", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.25rem 0" }}>
              No announcements yet
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
              All official circulars and notices will appear here.
            </p>
          </div>
        ) : (
          notices.map((notice) => {
            const catTheme = getCategoryTheme(notice.category);
            return (
              <div
                key={notice.id}
                className="student-card premium-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                  borderLeft: `4px solid ${catTheme.accent}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: catTheme.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {catTheme.icon}
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "1.15rem",
                          fontWeight: 700,
                          color: "var(--text-main)",
                          lineHeight: 1.3,
                        }}
                      >
                        {notice.title}
                      </h3>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    {notice.audience === "SPECIFIC_STUDENT" && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.55rem",
                          borderRadius: "999px",
                          backgroundColor: "rgba(168, 85, 247, 0.15)",
                          color: "#a855f7",
                          border: "1px solid rgba(168, 85, 247, 0.3)",
                        }}
                      >
                        DIRECT MESSAGE
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "0.2rem 0.6rem",
                        borderRadius: "999px",
                        backgroundColor: catTheme.bg,
                        color: catTheme.text,
                        border: `1px solid ${catTheme.border}`,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {(notice.category || "GENERAL").toUpperCase()}
                    </span>
                  </div>
                </div>

                <p
                  style={{
                    margin: "0.25rem 0",
                    color: "var(--text-main)",
                    lineHeight: 1.6,
                    whiteSpace: "pre-line",
                    fontSize: "0.925rem",
                  }}
                >
                  {notice.content}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "0.25rem",
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    borderTop: "1px solid var(--border-subtle)",
                    paddingTop: "0.75rem",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <span>
                    Issued by: <strong style={{ color: "var(--text-main)" }}>{notice.postedBy}</strong>
                  </span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>
                    {new Date(notice.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
