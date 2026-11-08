"use client";

import { UserCircle, Mail, Phone, Shield } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(data => {
        setSession(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", margin: "0 0 0.5rem 0", background: "linear-gradient(90deg, var(--royal-blue), var(--sky-blue))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          My Profile
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>View and manage your personal details.</p>
      </header>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>Loading profile...</div>
      ) : (
      <div className="student-card premium-card" style={{ padding: "2rem", borderRadius: "16px", border: "1px solid var(--border-subtle)", maxWidth: "800px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "2rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "2rem" }}>
          <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "linear-gradient(135deg, var(--royal-blue), var(--sky-blue))", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "2.5rem", fontWeight: "bold" }}>
            {session?.user?.name ? session.user.name.charAt(0) : "H"}
          </div>
          <div>
            <h2 style={{ fontSize: "1.8rem", margin: "0 0 0.3rem 0" }}>{session?.user?.name || "HOD User"}</h2>
            <span style={{ backgroundColor: "rgba(56, 189, 248, 0.1)", color: "var(--sky-blue)", padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold" }}>HEAD OF DEPARTMENT</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Email Address</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.3rem", fontSize: "1rem" }}>
              <Mail size={16} color="var(--sky-blue)" /> {session?.user?.email || "hod@veltech.edu.in"}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Department</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.3rem", fontSize: "1rem" }}>
              <Shield size={16} color="var(--sky-blue)" /> Computer Science & Engineering
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Account Type</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.3rem", fontSize: "1rem" }}>
              <UserCircle size={16} color="var(--sky-blue)" /> Executive
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
