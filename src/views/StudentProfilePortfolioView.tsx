"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiHome, FiCalendar, FiBell, FiUser, FiLogOut, FiMail, FiHash, FiBook, FiAward, FiCheckCircle, FiEdit2, FiX, FiSave } from "react-icons/fi";
import { signOut } from "next-auth/react";

export default function StudentProfilePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editSemester, setEditSemester] = useState("");
  const [editBatch, setEditBatch] = useState("");

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchProfile = () => {
    setLoading(true);
    fetch("/api/student/profile")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
          setEditName(json.data.name);
          setEditDepartment(json.data.profile.department);
          setEditSemester(json.data.profile.semester.toString());
          setEditBatch(json.data.profile.batch);
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
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: editName, 
          password: editPassword || undefined,
          department: editDepartment,
          semester: editSemester,
          batch: editBatch
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
          <p className="student-subtitle">Manage and view your student details.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="btn-royal"
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
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "var(--text-main)" }}>Semester</label>
                <input 
                  type="number" 
                  value={editSemester}
                  onChange={(e) => setEditSemester(e.target.value)}
                  style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card-header)", color: "var(--text-main)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "var(--text-main)" }}>Batch</label>
                <input 
                  type="text" 
                  value={editBatch}
                  onChange={(e) => setEditBatch(e.target.value)}
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
              width: "110px", 
              height: "110px", 
              borderRadius: "50%", 
              backgroundColor: "var(--royal-blue)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              marginBottom: "1.25rem",
              fontSize: "2.8rem",
              color: "white",
              fontWeight: 700,
              border: "4px solid var(--bg-card)",
              boxShadow: "0 2px 8px rgba(10, 102, 194, 0.25)"
            }}>
              {data.name.charAt(0).toUpperCase()}
            </div>
            <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem", color: "var(--text-main)" }}>{data.name}</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiMail /> {data.email}
            </p>
            
            <div style={{ marginTop: "2rem", width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem", backgroundColor: "var(--bg-card-header)", borderRadius: "8px" }}>
                <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}><FiHash /> VM Number</span>
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
                <FiBook /> Academic Information
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>DEPARTMENT</label>
                  <div style={{ fontSize: "1.1rem", color: "var(--text-main)", fontWeight: 500, marginTop: "0.25rem" }}>{data.profile.department}</div>
                </div>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>YEAR & SEMESTER</label>
                  <div style={{ fontSize: "1.1rem", color: "var(--text-main)", fontWeight: 500, marginTop: "0.25rem" }}>{data.profile.year} (Sem {data.profile.semester})</div>
                </div>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>SECTION</label>
                  <div style={{ fontSize: "1.1rem", color: "var(--text-main)", fontWeight: 500, marginTop: "0.25rem" }}>{data.profile.section}</div>
                </div>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>BATCH</label>
                  <div style={{ fontSize: "1.1rem", color: "var(--text-main)", fontWeight: 500, marginTop: "0.25rem" }}>{data.profile.batch}</div>
                </div>
              </div>
            </div>

            <div className="student-card premium-card" style={{ background: "linear-gradient(135deg, var(--royal-blue) 0%, #3b82f6 100%)", color: "white", border: "none" }}>
              <h3 style={{ margin: "0 0 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "white" }}>
                <FiAward /> Performance Overview
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Overall Attendance</div>
                  <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.25rem" }}>87.5%</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>CGPA</div>
                  <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.25rem" }}>8.42</div>
                </div>
              </div>
              <div style={{ marginTop: "1.5rem", fontSize: "0.85rem", opacity: 0.8 }}>
                * This data is a mock representation until grades are synced.
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
