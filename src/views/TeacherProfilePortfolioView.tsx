"use client";

import { useEffect, useState } from "react";
import { FiMail, FiHash, FiCheckCircle, FiBook, FiAward, FiEdit2, FiX, FiSave } from "react-icons/fi";
import { Loader2 } from "lucide-react";

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
          setEditDepartment(json.data.profile?.department || "");
          setEditDesignation(json.data.profile?.designation || "");
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
          designation: editDesignation,
        }),
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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading faculty profile...</p>
        </div>
      </div>
    );
  }

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
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.25rem 0" }}>Faculty Profile</h2>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Academic credentials, department designation, and verified institutional record.
          </p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn-royal">
            <FiEdit2 /> <span>Edit Profile</span>
          </button>
        )}
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

      {saveSuccess && (
        <div
          style={{
            backgroundColor: "var(--success-bg)",
            color: "var(--success)",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-sm)",
            marginBottom: "1.5rem",
            border: "1px solid var(--success-border)",
            fontSize: "0.875rem",
          }}
        >
          Profile updated successfully!
        </div>
      )}

      {isEditing && (
        <div
          className="student-card premium-card"
          style={{ marginBottom: "2rem", border: "1px solid var(--primary)", boxShadow: "var(--shadow-elevation)" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
              paddingBottom: "0.75rem",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <h3 style={{ margin: 0, color: "var(--text-main)", fontSize: "1.1rem", fontWeight: 700 }}>
              Edit Faculty Profile Details
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "4px",
              }}
              aria-label="Cancel editing"
            >
              <FiX size={18} />
            </button>
          </div>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "600", fontSize: "0.825rem", color: "var(--text-main)" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="premium-input"
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "600", fontSize: "0.825rem", color: "var(--text-main)" }}>
                  New Password (blank to keep current)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="premium-input"
                  placeholder="••••••••••••"
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "600", fontSize: "0.825rem", color: "var(--text-main)" }}>
                  Department
                </label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="premium-input"
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "600", fontSize: "0.825rem", color: "var(--text-main)" }}>
                  Designation
                </label>
                <input
                  type="text"
                  value={editDesignation}
                  onChange={(e) => setEditDesignation(e.target.value)}
                  className="premium-input"
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="btn-royal"
                style={{ opacity: saveLoading ? 0.7 : 1 }}
              >
                {saveLoading ? "Saving..." : <><FiSave /> <span>Save Changes</span></>}
              </button>
            </div>
          </form>
        </div>
      )}

      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
          {/* Identity Card */}
          <div
            className="student-card premium-card"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "2.5rem 1.75rem" }}
          >
            <div
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--primary) 0%, #06b6d4 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
                fontSize: "2.4rem",
                color: "white",
                fontWeight: 800,
                boxShadow: "0 8px 24px -4px rgba(37, 99, 235, 0.4)",
              }}
            >
              {data.name?.charAt(0).toUpperCase()}
            </div>
            <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.35rem", fontWeight: 800, color: "var(--text-main)" }}>
              {data.name}
            </h3>
            <p
              style={{
                margin: 0,
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.85rem",
              }}
            >
              <FiMail size={14} /> {data.email}
            </p>

            <div style={{ marginTop: "1.75rem", width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.85rem 1rem",
                  backgroundColor: "var(--bg-input)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.825rem" }}>
                  <FiHash /> MTS ID
                </span>
                <strong style={{ color: "var(--text-main)", fontVariantNumeric: "tabular-nums" }}>{data.vmNo}</strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.85rem 1rem",
                  backgroundColor: "var(--bg-input)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.825rem" }}>
                  <FiCheckCircle /> Status
                </span>
                <strong style={{ color: "#10b981", fontSize: "0.85rem" }}>● {data.status}</strong>
              </div>
            </div>
          </div>

          {/* Academic Profile Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="student-card premium-card">
              <h3
                style={{
                  margin: "0 0 1.25rem 0",
                  color: "var(--text-main)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                }}
              >
                <FiBook size={17} style={{ color: "var(--primary)" }} /> Faculty Assignment Information
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.04em" }}>
                    DEPARTMENT
                  </label>
                  <div style={{ fontSize: "1.05rem", color: "var(--text-main)", fontWeight: 600, marginTop: "0.2rem" }}>
                    Department of {data.profile?.department || "CSE"}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.04em" }}>
                    DESIGNATION
                  </label>
                  <div style={{ fontSize: "1.05rem", color: "var(--text-main)", fontWeight: 600, marginTop: "0.2rem" }}>
                    {data.profile?.designation || "Assistant Professor"}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.04em" }}>
                    SYSTEM ROLE
                  </label>
                  <div style={{ fontSize: "1.05rem", color: "var(--primary)", fontWeight: 600, marginTop: "0.2rem" }}>
                    Faculty / Teacher
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.04em" }}>
                    SECURITY CLEARANCE
                  </label>
                  <div style={{ fontSize: "1.05rem", color: "var(--text-main)", fontWeight: 600, marginTop: "0.2rem" }}>
                    Standard Instructor
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Overview Banner */}
            <div
              className="student-card premium-card"
              style={{
                background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #06b6d4 100%)",
                color: "white",
                border: "none",
                boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)",
              }}
            >
              <h3 style={{ margin: "0 0 1.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "white", fontSize: "1.1rem" }}>
                <FiAward size={18} /> Instructional Activity
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.825rem", opacity: 0.85, fontWeight: 500 }}>Active Classes</div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.25rem", letterSpacing: "-0.02em" }}>Daily</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.825rem", opacity: 0.85, fontWeight: 500 }}>Attendance Marked</div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.25rem", letterSpacing: "-0.02em" }}>Active</div>
                </div>
              </div>
              <div style={{ marginTop: "1.25rem", fontSize: "0.78rem", opacity: 0.75, borderTop: "1px solid rgba(255, 255, 255, 0.15)", paddingTop: "0.75rem" }}>
                Vel Tech Multi Tech Autonomous ERP • Verified Staff Credentials
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
