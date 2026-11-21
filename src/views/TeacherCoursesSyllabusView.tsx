"use client";

import { useState, useEffect } from "react";
import { BookOpen, Users, Clock, MoreVertical, Plus, ChevronRight, Activity, Loader2 } from "lucide-react";

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teacher/courses")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setCourses(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading allocated subjects...</p>
        </div>
      </div>
    );
  }

  const totalStudents = courses.reduce((acc, curr) => acc + (curr.students || 0), 0);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.25rem 0" }}>Course & Subject Allocations</h2>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Assigned lecture subjects, laboratory batches, and syllabus completion governance.
          </p>
        </div>
        <div>
          <button className="btn-royal">
            <Plus size={16} /> <span>Request Course Change</span>
          </button>
        </div>
      </div>

      {/* Analytics Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        <div
          className="student-card premium-card"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem" }}
        >
          <div>
            <p style={{ margin: "0 0 0.35rem 0", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>
              ACTIVE ALLOCATIONS
            </p>
            <h3 style={{ fontSize: "1.85rem", fontWeight: 800, margin: 0, color: "var(--text-main)", fontVariantNumeric: "tabular-nums" }}>
              {courses.length}
            </h3>
          </div>
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "10px",
              backgroundColor: "var(--primary-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
            }}
          >
            <BookOpen size={22} />
          </div>
        </div>

        <div
          className="student-card premium-card"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem" }}
        >
          <div>
            <p style={{ margin: "0 0 0.35rem 0", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>
              TOTAL ENROLLED
            </p>
            <h3 style={{ fontSize: "1.85rem", fontWeight: 800, margin: 0, color: "var(--text-main)", fontVariantNumeric: "tabular-nums" }}>
              {totalStudents}
            </h3>
          </div>
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "10px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
            }}
          >
            <Users size={22} />
          </div>
        </div>

        <div
          className="student-card premium-card"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem" }}
        >
          <div>
            <p style={{ margin: "0 0 0.35rem 0", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>
              HOURLY WORKLOAD
            </p>
            <h3 style={{ fontSize: "1.85rem", fontWeight: 800, margin: 0, color: "var(--text-main)", fontVariantNumeric: "tabular-nums" }}>
              18 <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--text-muted)" }}>hrs/wk</span>
            </h3>
          </div>
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "10px",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f59e0b",
            }}
          >
            <Activity size={22} />
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {courses.map((course) => (
          <div
            key={course.id}
            className="student-card premium-card"
            style={{ display: "flex", flexDirection: "column", padding: "1.5rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    backgroundColor: "var(--primary-subtle)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <BookOpen size={20} />
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {course.code}
                  </span>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0.2rem 0 0 0", color: "var(--text-main)" }}>
                    {course.name}
                  </h3>
                </div>
              </div>
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                }}
                aria-label="Course options"
              >
                <MoreVertical size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <span
                style={{
                  backgroundColor: "var(--bg-input)",
                  padding: "0.25rem 0.65rem",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--text-main)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                Class: {course.class}
              </span>
              <span
                style={{
                  backgroundColor: "var(--bg-input)",
                  padding: "0.25rem 0.65rem",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--text-main)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {course.students} Enrolled
              </span>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  marginBottom: "0.45rem",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>Syllabus Completion</span>
                <span style={{ color: "var(--text-main)", fontVariantNumeric: "tabular-nums" }}>{course.progress}%</span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "7px",
                  backgroundColor: "var(--bg-input)",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${course.progress}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, var(--primary) 0%, #38bdf8 100%)",
                    borderRadius: "999px",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: "auto",
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "0.85rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  color: "var(--text-muted)",
                  fontSize: "0.825rem",
                  fontWeight: 500,
                }}
              >
                <Clock size={14} style={{ color: "var(--primary)" }} /> {course.nextClass}
              </div>
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.2rem",
                }}
              >
                Manage <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
