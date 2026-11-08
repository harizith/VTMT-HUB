"use client";

import { useState, useEffect } from "react";
import { BookOpen, Users, Clock, MoreVertical, Plus, ChevronRight, Activity } from "lucide-react";

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teacher/courses")
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setCourses(res.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="student-main" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div className="loading-spinner"></div>
      </main>
    );
  }

  return (
    <main className="student-main">
      <header className="student-header">
        <div>
          <h1>My Courses</h1>
          <p className="student-subtitle">Manage your assigned subjects and classes</p>
        </div>
        <div>
          <button style={{ backgroundColor: "var(--royal-blue)", color: "white", padding: "0.6rem 1.2rem", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Plus size={16} /> Request Course Change
          </button>
        </div>
      </header>

      {/* Analytics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <div className="student-card premium-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "700", letterSpacing: "0.05em" }}>TOTAL COURSES</p>
            <h3 style={{ fontSize: "2rem", fontWeight: "800", margin: 0, color: "var(--text-main)" }}>{courses.length}</h3>
          </div>
          <div style={{ width: "50px", height: "50px", borderRadius: "12px", backgroundColor: "var(--bg-body)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-main)" }}>
            <BookOpen size={24} />
          </div>
        </div>
        <div className="student-card premium-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "700", letterSpacing: "0.05em" }}>TOTAL STUDENTS</p>
            <h3 style={{ fontSize: "2rem", fontWeight: "800", margin: 0, color: "var(--text-main)" }}>
              {courses.reduce((acc, curr) => acc + curr.students, 0)}
            </h3>
          </div>
          <div style={{ width: "50px", height: "50px", borderRadius: "12px", backgroundColor: "var(--bg-body)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-main)" }}>
            <Users size={24} />
          </div>
        </div>
        <div className="student-card premium-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "700", letterSpacing: "0.05em" }}>HOURS THIS WEEK</p>
            <h3 style={{ fontSize: "2rem", fontWeight: "800", margin: 0, color: "var(--text-main)" }}>18</h3>
          </div>
          <div style={{ width: "50px", height: "50px", borderRadius: "12px", backgroundColor: "var(--bg-body)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-main)" }}>
            <Activity size={24} />
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {courses.map(course => (
          <div key={course.id} className="student-card premium-card" style={{ display: "flex", flexDirection: "column", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: course.color, color: course.iconColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={24} />
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: "700", color: course.iconColor, letterSpacing: "0.05em" }}>{course.code}</span>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: "0.2rem 0 0 0", color: "var(--text-main)" }}>{course.name}</h3>
                </div>
              </div>
              <button style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <MoreVertical size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <span style={{ backgroundColor: "var(--bg-body)", padding: "0.3rem 0.7rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600", color: "var(--text-main)" }}>
                Class: {course.class}
              </span>
              <span style={{ backgroundColor: "var(--bg-body)", padding: "0.3rem 0.7rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600", color: "var(--text-main)" }}>
                {course.students} Students
              </span>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Syllabus Progress</span>
                <span style={{ color: "var(--text-main)" }}>{course.progress}%</span>
              </div>
              <div style={{ width: "100%", height: "8px", backgroundColor: "var(--bg-body)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${course.progress}%`, height: "100%", backgroundColor: course.iconColor, borderRadius: "4px" }}></div>
              </div>
            </div>

            <div style={{ marginTop: "auto", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "500" }}>
                <Clock size={16} /> {course.nextClass}
              </div>
              <button style={{ background: "none", border: "none", color: "var(--royal-blue)", fontWeight: "600", fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                Manage <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
