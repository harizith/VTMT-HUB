"use client";

import { useEffect, useState } from "react";
import { FiMail, FiHash, FiCheckCircle, FiBook, FiAward, FiEdit2, FiX, FiSave } from "react-icons/fi";

export default function TeacherProfilePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editDesignation, setEditDesignation] = useState("");

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchProfile = () => {
    setLoading(true);
    fetch("/api/teacher/profile")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
          setEditName(json.data.name);
          setEditDepartment(json.data.profile.department);
          setEditDesignation(json.data.profile.designation);
        } else {
          setError(json.error || "Failed to load profile.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("An error occurred while fetching profile data.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);
    setError("");

    try {
      const res = await fetch("/api/teacher/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: editName, 
          password: editPassword || undefined,
          department: editDepartment,
          designation: editDesignation
        })
      });
      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        setIsEditing(false);
        setEditPassword("");
        fetchProfile(); // Refresh data
      } else {
        setError(json.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while saving.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="admin-layout">
        <div className="admin-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="student-main">
      <header className="student-header" style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1>Your Profile</h1>
          <p className="student-subtitle">Manage and view your faculty details.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", backgroundColor: "var(--royal-blue)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
          >
            <FiEdit2 /> Edit Profile
          </button>
        )}
      </header>

      {error && (
        <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "1rem", borderRadius: "8px", marginBottom: "2rem", border: "1px solid #fca5a5" }}>
          {error}
        </div>
      )}

      {saveSuccess && (
        <div style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "1rem", borderRadius: "8px", marginBottom: "2rem", border: "1px solid #6ee7b7" }}>
          Profile updated successfully!
        </div>
      )}

      {isEditing && (
        <div className="student-card premium-card" style={{ marginBottom: "2rem", border: "2px solid var(--royal-blue)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: 0, color: "var(--text-main)" }}>Edit Profile</h3>
            <button onClick={() => setIsEditing(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}>
              <FiX />
            </button>
          </div>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "var(--text-main)" }}>Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card-header)", color: "var(--text-main)" }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "var(--text-main)" }}>New Password (blank to keep)</label>
                <input 
                  type="password" 
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card-header)", color: "var(--text-main)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "var(--text-main)" }}>Department</label>
                <input 
                  type="text" 
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card-header)", color: "var(--text-main)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "var(--text-main)" }}>Designation</label>
                <input 
                  type="text" 
                  value={editDesignation}
                  onChange={(e) => setEditDesignation(e.target.value)}
                  style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card-header)", color: "var(--text-main)" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "0.5rem" }}>
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                style={{ padding: "0.8rem 1.5rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-muted)", fontWeight: "600", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={saveLoading}
                style={{ padding: "0.8rem 1.5rem", borderRadius: "8px", border: "none", backgroundColor: "var(--royal-blue)", color: "white", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", opacity: saveLoading ? 0.7 : 1 }}
              >
                {saveLoading ? "Saving..." : <><FiSave /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>
          {/* Identity Card */}
          <div className="student-card premium-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "3rem 2rem" }}>
            <div style={{ 
              width: "120px", 
              height: "120px", 
              borderRadius: "50%", 
              backgroundColor: "var(--bg-card-header)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              marginBottom: "1.5rem",
              fontSize: "3rem",
              color: "var(--royal-blue)",
              fontWeight: 700
            }}>
              {data.name.charAt(0).toUpperCase()}
            </div>
            <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem", color: "var(--text-main)" }}>{data.name}</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiMail /> {data.email}
            </p>
            
            <div style={{ marginTop: "2rem", width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem", backgroundColor: "var(--bg-card-header)", borderRadius: "8px" }}>
                <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}><FiHash /> MTS Number</span>
                <strong style={{ color: "var(--text-main)" }}>{data.vmNo}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem", backgroundColor: "var(--bg-card-header)", borderRadius: "8px" }}>
                <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}><FiCheckCircle /> Status</span>
                <strong style={{ color: "#10b981" }}>{data.status}</strong>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="student-card premium-card">
              <h3 style={{ margin: "0 0 1.5rem 0", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FiBook /> Faculty Information
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>DEPARTMENT</label>
                  <div style={{ fontSize: "1.1rem", color: "var(--text-main)", fontWeight: 500, marginTop: "0.25rem" }}>{data.profile.department}</div>
                </div>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>DESIGNATION</label>
                  <div style={{ fontSize: "1.1rem", color: "var(--text-main)", fontWeight: 500, marginTop: "0.25rem" }}>{data.profile.designation}</div>
                </div>
              </div>
            </div>

            <div className="student-card premium-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <h3 style={{ margin: 0, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FiBook /> Teaching Assignments
                </h3>
                <span style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: 600, 
                  padding: "0.25rem 0.6rem", 
                  borderRadius: "9999px", 
                  backgroundColor: "rgba(99, 102, 241, 0.12)", 
                  color: "var(--royal-blue)",
                  border: "1px solid rgba(99, 102, 241, 0.25)"
                }}>
                  Admin Managed • Read Only
                </span>
              </div>
              <p style={{ margin: "0 0 1.25rem 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                These columns are only visible in teacher mode and are maintained strictly by the administrator. Teachers cannot edit these assignments.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {[
                  { key: "subject1", label: "Subject 1", value: data.profile.subjects?.subject1 },
                  { key: "subject2", label: "Subject 2", value: data.profile.subjects?.subject2 },
                  { key: "lab1", label: "Lab 1", value: data.profile.subjects?.lab1 },
                  { key: "lab2", label: "Lab 2", value: data.profile.subjects?.lab2 },
                  { key: "additional1", label: "Additional 1", value: data.profile.subjects?.additional1 },
                  { key: "additional2", label: "Additional 2", value: data.profile.subjects?.additional2 },
                ].map(({ key, label, value }) => {
                  const assignedClasses: string[] = data.profile.subjectClasses?.[key] || [];
                  return (
                    <div key={key} style={{ padding: "0.9rem", borderRadius: "8px", backgroundColor: "var(--bg-card-header)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{label}</label>
                        <div style={{ marginTop: "0.25rem", color: "var(--text-main)", fontWeight: 600, fontSize: "0.95rem" }}>
                          {value || "Not assigned"}
                        </div>
                      </div>
                      <div style={{ marginTop: "0.6rem", paddingTop: "0.5rem", borderTop: "1px dashed var(--border-subtle)" }}>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                          Assigned Classes:
                        </span>
                        {assignedClasses.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                            {assignedClasses.map((cls) => (
                              <span
                                key={cls}
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "4px",
                                  backgroundColor: "rgba(59, 130, 246, 0.15)",
                                  color: "var(--royal-blue)",
                                  border: "1px solid rgba(59, 130, 246, 0.3)",
                                }}
                              >
                                {cls}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                            {value ? "No classes scheduled yet" : "—"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="student-card premium-card" style={{ background: "linear-gradient(135deg, var(--royal-blue) 0%, #3b82f6 100%)", color: "white", border: "none" }}>
              <h3 style={{ margin: "0 0 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "white" }}>
                <FiAward /> Highlights
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Classes Today</div>
                  <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.25rem" }}>--</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Total Students</div>
                  <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.25rem" }}>--</div>
                </div>
              </div>
              <div style={{ marginTop: "1.5rem", fontSize: "0.85rem", opacity: 0.8 }}>
                * Metrics will be synced automatically based on your assigned timetable.
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
