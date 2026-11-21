"use client";

import { useEffect, useState } from "react";
import { Users, Mail, User, Search, Loader2 } from "lucide-react";

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const facultyOnly = res.users.filter((u: any) => u.role === "FACULTY");
          setFaculty(facultyOnly);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = faculty.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.25rem 0" }}>Department Faculty Directory</h2>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.85rem" }}>
          Faculty staffing, workload allocation, and instructional coverage overview.
        </p>
      </div>

      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "420px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Search faculty by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="premium-input"
            style={{ paddingLeft: "36px" }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading faculty profiles...</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {filtered.map((f) => (
            <div
              key={f.id}
              className="student-card premium-card"
              style={{ padding: "1.5rem" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--primary) 0%, #06b6d4 100%)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
                    flexShrink: 0,
                  }}
                >
                  {f.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)" }}>{f.name}</h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>
                    {f.facultyProfile?.designation || "Assistant Professor"}
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  fontSize: "0.825rem",
                  color: "var(--text-muted)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Mail size={14} style={{ color: "var(--primary)" }} /> {f.email}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <User size={14} style={{ color: "var(--primary)" }} /> MTS No: {f.facultyProfile?.vmNo || f.vmNo || "N/A"}
                </div>
              </div>

              {/* Mapped Subjects in Faculty Profile */}
              {(() => {
                const fp = f.facultyProfile;
                const subs = [fp?.subject1, fp?.subject2, fp?.lab1, fp?.additional1, fp?.additional2].filter(Boolean);
                if (subs.length === 0) return null;

                return (
                  <div
                    style={{
                      marginTop: "1rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px dashed var(--border-subtle)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        display: "block",
                        marginBottom: "0.4rem",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      Allocated Subjects:
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {subs.map((s: string, sIdx: number) => {
                        const isLab = s.toLowerCase().includes("lab");
                        return (
                          <span
                            key={sIdx}
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              padding: "0.15rem 0.5rem",
                              borderRadius: "4px",
                              backgroundColor: isLab ? "rgba(245, 158, 11, 0.12)" : "var(--primary-subtle)",
                              color: isLab ? "#d97706" : "var(--primary)",
                              border: `1px solid ${isLab ? "rgba(245, 158, 11, 0.25)" : "rgba(37, 99, 235, 0.2)"}`,
                            }}
                          >
                            {s}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
