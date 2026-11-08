"use client";

import { useEffect, useState } from "react";
import { Users, Mail, Phone, MapPin, User, Search } from "lucide-react";

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          const facultyOnly = res.users.filter((u: any) => u.role === "FACULTY");
          setFaculty(facultyOnly);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = faculty.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ padding: "2rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", margin: "0 0 0.5rem 0", background: "linear-gradient(90deg, var(--royal-blue), var(--sky-blue))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Department Faculty
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>Manage and view all faculty members in your department.</p>
      </header>

      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input 
            type="text" 
            placeholder="Search faculty by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "0.8rem 1rem 0.8rem 2.5rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-input)", color: "var(--text-main)" }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>Loading faculty...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {filtered.map(f => (
            <div key={f.id} className="student-card premium-card" style={{ padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "rgba(29, 78, 216, 0.1)", color: "var(--royal-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: "bold" }}>
                  {f.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{f.name}</h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{f.facultyProfile?.designation || "Faculty"}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Mail size={14} /> {f.email}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><User size={14} /> VM No: {f.facultyProfile?.vmNo || f.vmNo || "N/A"}</div>
              </div>

              {/* Mapped Subjects in Faculty Profile */}
              {(() => {
                const fp = f.facultyProfile;
                const subs = [fp?.subject1, fp?.subject2, fp?.lab1, fp?.additional1, fp?.additional2].filter(Boolean);
                if (subs.length === 0) return null;

                return (
                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed var(--border-subtle)" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>
                      Allocated Subjects:
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {subs.map((s: string, sIdx: number) => (
                        <span
                          key={sIdx}
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: "600",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "4px",
                            backgroundColor: s.toLowerCase().includes("lab") ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)",
                            color: s.toLowerCase().includes("lab") ? "#f59e0b" : "var(--royal-blue)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          {s}
                        </span>
                      ))}
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
