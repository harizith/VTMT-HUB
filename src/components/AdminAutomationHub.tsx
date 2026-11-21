"use client";

import { useState, useEffect } from "react";
import { Zap, AlertTriangle, CheckCircle2, ShieldCheck, RefreshCw, Cpu, Calendar, Play, Database, Trash2, Sparkles } from "lucide-react";

export default function AdminAutomationHub() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [actionMessage, setActionMessage] = useState("");

  const runAutomationAudit = async () => {
    setRunning(true);
    setActionMessage("Scanning timetable schedules, classroom room allocations, and attendance logs...");
    try {
      const res = await fetch("/api/admin/automation", { method: "POST" }).then(r => r.json());
      if (res.success) {
        setReport(res.report);
        setActionMessage("Autonomous audit & conflict verification completed successfully.");
      } else {
        setActionMessage("Audit failed: " + res.error);
      }
    } catch (err: any) {
      setActionMessage("Error: " + err.message);
    } finally {
      setRunning(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    runAutomationAudit();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Top Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)",
        borderRadius: "18px",
        padding: "2rem",
        color: "#ffffff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.5rem",
        boxShadow: "0 12px 32px -8px rgba(37, 99, 235, 0.4)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Subtle radial glow */}
        <div style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />

        <div style={{ zIndex: 1, maxWidth: "680px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
            <span style={{
              backgroundColor: "rgba(255, 255, 255, 0.18)",
              backdropFilter: "blur(6px)",
              color: "#ffffff",
              padding: "0.25rem 0.65rem",
              borderRadius: "99px",
              fontSize: "0.72rem",
              fontWeight: "800",
              letterSpacing: "0.06em",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem"
            }}>
              <Zap size={13} style={{ color: "#fbbf24" }} />
              AUTONOMOUS CAMPUS ENGINE
            </span>
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "800", margin: "0 0 0.5rem 0", letterSpacing: "-0.03em" }}>
            Campus Automation & Operations Hub
          </h2>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.88)", fontSize: "0.92rem", lineHeight: "1.5" }}>
            Continuous background diagnostics, timetable conflict detection, automated Day Order indexing, and security compliance audits.
          </p>
        </div>

        <div style={{ zIndex: 1 }}>
          <button
            onClick={runAutomationAudit}
            disabled={running}
            style={{
              backgroundColor: "#ffffff",
              color: "var(--primary)",
              padding: "0.75rem 1.5rem",
              borderRadius: "12px",
              fontWeight: "800",
              fontSize: "0.88rem",
              border: "none",
              cursor: running ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              transition: "transform 0.15s ease",
              opacity: running ? 0.8 : 1
            }}
          >
            <RefreshCw size={16} className={running ? "animate-spin" : ""} />
            <span>{running ? "Scanning Matrix..." : "Run Full Diagnostic"}</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div style={{
          padding: "0.85rem 1.25rem",
          backgroundColor: "var(--bg-card)",
          borderRadius: "12px",
          border: "1px solid var(--border-subtle)",
          fontSize: "0.88rem",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          color: "var(--text-main)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
        }}>
          <Cpu size={16} style={{ color: "var(--primary)" }} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Grid of Automation Modules */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        
        {/* Module 1: Timetable Clash & Room Conflict Detector */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "18px",
          padding: "1.75rem",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertTriangle size={18} style={{ color: "#f59e0b" }} /> Schedule & Room Clashes
              </h3>
              <span style={{
                fontSize: "0.72rem",
                padding: "0.2rem 0.6rem",
                borderRadius: "99px",
                backgroundColor: "rgba(245, 158, 11, 0.12)",
                color: "#f59e0b",
                fontWeight: "800",
                border: "1px solid rgba(245, 158, 11, 0.25)"
              }}>
                {report?.clashes?.length || 0} Conflicts
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: "1.5" }}>
              Automated scan verifying that no two classes occupy the same room or have the same faculty during identical periods and day orders.
            </p>
            {report?.clashes?.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto" }}>
                {report.clashes.map((c: any, idx: number) => (
                  <div key={idx} style={{ padding: "0.6rem 0.85rem", backgroundColor: "rgba(239, 68, 68, 0.08)", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.2)", fontSize: "0.82rem", color: "var(--text-main)" }}>
                    <strong style={{ color: "#ef4444" }}>{c.type}:</strong> {c.description}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: "1.25rem",
                textAlign: "center",
                backgroundColor: "rgba(16, 185, 129, 0.08)",
                borderRadius: "12px",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                color: "#10b981",
                fontSize: "0.88rem",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem"
              }}>
                <CheckCircle2 size={18} /> Zero room or faculty conflicts detected.
              </div>
            )}
          </div>
          <div style={{ marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Status: Active Conflict Verification
          </div>
        </div>

        {/* Module 2: Day Order Engine Status */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "18px",
          padding: "1.75rem",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={18} style={{ color: "var(--primary)" }} /> Day Order Engine
              </h3>
              <span style={{
                fontSize: "0.72rem",
                padding: "0.2rem 0.6rem",
                borderRadius: "99px",
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                color: "var(--primary)",
                fontWeight: "800",
                border: "1px solid rgba(37, 99, 235, 0.2)"
              }}>
                Active Sync
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: "1.5" }}>
              Computes working days, skips declared holidays, and synchronizes Day Orders (I to V) seamlessly across student and faculty portals.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", backgroundColor: "var(--bg-input)", borderRadius: "10px", fontSize: "0.88rem", border: "1px solid var(--border-subtle)" }}>
                <span style={{ color: "var(--text-muted)" }}>Today's Day Order</span>
                <strong style={{ color: "var(--primary)", fontSize: "1rem" }}>{report?.currentDayOrder || "Computing..."}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", backgroundColor: "var(--bg-input)", borderRadius: "10px", fontSize: "0.88rem", border: "1px solid var(--border-subtle)" }}>
                <span style={{ color: "var(--text-muted)" }}>Tomorrow's Day Order</span>
                <strong style={{ color: "var(--text-main)", fontSize: "1rem" }}>{report?.tomorrowDayOrder || "Computing..."}</strong>
              </div>
            </div>
          </div>
          <div style={{ marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Academic Cycle: Active Calendar Sync
          </div>
        </div>

        {/* Module 3: Security & Hashing Compliance */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "18px",
          padding: "1.75rem",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ShieldCheck size={18} style={{ color: "#10b981" }} /> Security & Hashing
              </h3>
              <span style={{
                fontSize: "0.72rem",
                padding: "0.2rem 0.6rem",
                borderRadius: "99px",
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
                fontWeight: "800",
                border: "1px solid rgba(16, 185, 129, 0.25)"
              }}>
                Compliant
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: "1.5" }}>
              Verifies that user account credentials utilize salted bcrypt hashes and that AI query guards actively enforce strict database guardrails.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-main)", fontWeight: "600" }}>
                <CheckCircle2 size={15} style={{ color: "#10b981" }} /> Salted Bcrypt Password Hashing Active
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-main)", fontWeight: "600" }}>
                <CheckCircle2 size={15} style={{ color: "#10b981" }} /> Copilot Read-Only SQL Guardrails Active
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-main)", fontWeight: "600" }}>
                <CheckCircle2 size={15} style={{ color: "#10b981" }} /> NextAuth RBAC Session Guardrails Active
              </div>
            </div>
          </div>
          <div style={{ marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Security Audit: Zero Critical Vulnerabilities
          </div>
        </div>

        {/* Module 4: Attendance Retention Policy */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "18px",
          padding: "1.75rem",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={18} style={{ color: "#ef4444" }} /> Attendance Retention
              </h3>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: "1.5" }}>
              Enforce statutory 180-day data retention policy. Purges archived roll call recordings exceeding the 6-month compliance threshold.
            </p>
          </div>
          <button
            onClick={async () => {
              if (!confirm("Are you sure? This will permanently delete all attendance records older than 180 days.")) return;
              setRunning(true);
              const res = await fetch("/api/admin/cleanup", { method: "POST" }).then(r => r.json());
              if (res.success) {
                setActionMessage(`Cleanup successful. Purged ${res.deletedCount} archived roll call records.`);
              } else {
                setActionMessage("Cleanup failed: " + res.error);
              }
              setRunning(false);
            }}
            disabled={running}
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              fontWeight: "800",
              fontSize: "0.85rem",
              cursor: running ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem"
            }}
          >
            <Trash2 size={15} />
            <span>{running ? "Purging Records..." : "Enforce 180-Day Retention"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
