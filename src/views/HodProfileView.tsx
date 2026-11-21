"use client";

import { UserCircle, Mail, Phone, Shield, Building2, Key, CheckCircle2, Award } from "lucide-react";
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

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)", fontSize: "0.95rem" }}>
          <div style={{ width: "20px", height: "20px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span>Loading executive profile...</span>
        </div>
      </div>
    );
  }

  const userName = session?.user?.name || "Department Head";
  const userEmail = session?.user?.email || "hod@veltech.edu.in";

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Header */}
      <div style={{
        padding: "1.5rem 1.75rem",
        borderRadius: "16px",
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
          <span style={{
            backgroundColor: "rgba(37, 99, 235, 0.1)",
            color: "var(--primary)",
            padding: "0.2rem 0.65rem",
            borderRadius: "99px",
            fontWeight: "700",
            fontSize: "0.75rem",
            border: "1px solid rgba(37, 99, 235, 0.2)"
          }}>
            DEPARTMENT LEADERSHIP
          </span>
        </div>
        <h1 style={{ fontSize: "1.65rem", fontWeight: "800", letterSpacing: "-0.03em", margin: 0, color: "var(--text-main)" }}>
          Executive Profile & Settings
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: "0.35rem 0 0 0" }}>
          Administrative privileges, departmental credentials, and academic governance identity.
        </p>
      </div>

      {/* Main Profile Card */}
      <div style={{
        backgroundColor: "var(--bg-card)",
        borderRadius: "18px",
        border: "1px solid var(--border-subtle)",
        padding: "2rem",
        boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)"
      }}>
        {/* Avatar & Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1.75rem",
          paddingBottom: "2rem",
          borderBottom: "1px solid var(--border-subtle)",
          flexWrap: "wrap"
        }}>
          <div style={{
            width: "90px",
            height: "90px",
            borderRadius: "24px",
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: "2.25rem",
            fontWeight: "800",
            boxShadow: "0 8px 24px -4px rgba(37, 99, 235, 0.45)",
            border: "2px solid rgba(255,255,255,0.15)"
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
              <h2 style={{ fontSize: "1.65rem", fontWeight: "800", letterSpacing: "-0.02em", margin: 0, color: "var(--text-main)" }}>
                {userName}
              </h2>
              <span style={{
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
                padding: "0.2rem 0.65rem",
                borderRadius: "99px",
                fontSize: "0.75rem",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                border: "1px solid rgba(16, 185, 129, 0.25)"
              }}>
                <CheckCircle2 size={13} /> Active Executive
              </span>
            </div>
            <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "600" }}>
              Head of Department • School of Computing
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.5rem",
          paddingTop: "2rem"
        }}>
          <div style={{
            padding: "1.25rem",
            borderRadius: "14px",
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-subtle)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              <Mail size={15} style={{ color: "var(--primary)" }} /> Email Address
            </div>
            <div style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-main)" }}>
              {userEmail}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Official institutional inbox
            </div>
          </div>

          <div style={{
            padding: "1.25rem",
            borderRadius: "14px",
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-subtle)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              <Building2 size={15} style={{ color: "var(--primary)" }} /> Department Code
            </div>
            <div style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-main)" }}>
              Computer Science & Engineering (CSE)
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Primary governance purview
            </div>
          </div>

          <div style={{
            padding: "1.25rem",
            borderRadius: "14px",
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-subtle)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              <Shield size={15} style={{ color: "var(--primary)" }} /> Access Tier
            </div>
            <div style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-main)" }}>
              Department Administrator
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Full course & faculty approval rights
            </div>
          </div>

          <div style={{
            padding: "1.25rem",
            borderRadius: "14px",
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-subtle)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              <Award size={15} style={{ color: "var(--primary)" }} /> Institution
            </div>
            <div style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-main)" }}>
              Vel Tech Multi Tech
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Autonomous • NAAC A++ Accredited
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
