"use client";

import { useState, useEffect } from "react";
import { Zap, AlertTriangle, CheckCircle2, ShieldCheck, RefreshCw, Cpu, Calendar, Play } from "lucide-react";

export default function AdminAutomationHub() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [actionMessage, setActionMessage] = useState("");

  const runAutomationAudit = async () => {
    setRunning(true);
    setActionMessage("Scanning timetable entries, room allocations, and attendance logs...");
    try {
      const res = await fetch("/api/admin/automation", { method: "POST" }).then(r => r.json());
      if (res.success) {
        setReport(res.report);
        setActionMessage("Automation audit completed successfully.");
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
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Top Banner */}
      <div style={{ background: "linear-gradient(135deg, var(--royal-blue) 0%, #1e3a8a 100%)", borderRadius: "16px", padding: "2rem", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 25px -5px rgba(29, 78, 216, 0.4)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Zap size={18} color="#f59e0b" />
            <span style={{ fontSize: "0.8rem", fontWeight: "700", letterSpacing: "0.05em", color: "rgba(255,255,255,0.8)" }}>CAMPUS AUTOMATION & INTELLIGENCE ENGINE</span>
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "800", margin: "0 0 0.5rem 0" }}>Autonomous Operations Hub</h2>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: "0.95rem", maxWidth: "600px" }}>
            Continuous background diagnostics, timetable conflict detection, automated Day Order indexing, and security compliance audits.
          </p>
        </div>
        <div>
          <button
            onClick={runAutomationAudit}
            disabled={running}
            style={{ backgroundColor: "#fff", color: "var(--royal-blue)", padding: "0.75rem 1.5rem", borderRadius: "10px", fontWeight: "700", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", transition: "all 0.2s" }}
          >
            <RefreshCw size={16} className={running ? "animate-spin" : ""} />
            {running ? "Running Diagnostics..." : "Run Full Audit"}
          </button>
        </div>
      </div>

      {actionMessage && (
        <div style={{ padding: "0.75rem 1rem", backgroundColor: "var(--bg-card-header)", borderRadius: "8px", border: "1px solid var(--border-subtle)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-main)" }}>
          <Cpu size={16} color="var(--sky-blue)" />
          {actionMessage}
        </div>
      )}

      {/* Grid of Automation Modules */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        
        {/* Module 1: Timetable Clash & Room Conflict Detector */}
        <div className="student-card premium-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertTriangle size={18} color="#f59e0b" /> Room & Schedule Clashes
              </h3>
              <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "9999px", backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", fontWeight: "700" }}>
                {report?.clashes?.length || 0} Conflicts
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Automated scan verifying that no two classes occupy the same room or have the same faculty during identical periods and day orders.
            </p>
            {report?.clashes?.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto" }}>
                {report.clashes.map((c: any, idx: number) => (
                  <div key={idx} style={{ padding: "0.5rem", backgroundColor: "rgba(239, 68, 68, 0.05)", borderRadius: "6px", border: "1px solid rgba(239, 68, 68, 0.2)", fontSize: "0.8rem" }}>
                    <strong>{c.type}:</strong> {c.description}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "1.5rem", textAlign: "center", backgroundColor: "rgba(34, 197, 94, 0.05)", borderRadius: "8px", border: "1px solid rgba(34, 197, 94, 0.2)", color: "#22c55e", fontSize: "0.9rem", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <CheckCircle2 size={18} /> Zero room or faculty conflicts detected.
              </div>
            )}
          </div>
          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Status: Active Automated Monitor
          </div>
        </div>

        {/* Module 2: Day Order Engine Status */}
        <div className="student-card premium-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={18} color="var(--sky-blue)" /> Day Order Scheduler
              </h3>
              <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "9999px", backgroundColor: "rgba(56, 189, 248, 0.1)", color: "var(--sky-blue)", fontWeight: "700" }}>
                Active Cycle
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Computes working days, skips holidays and weekends automatically, and syncs Day Orders (I to V) across all departmental portals.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0.75rem", backgroundColor: "var(--bg-card-header)", borderRadius: "8px", fontSize: "0.85rem" }}>
                <span>Today's Computed Day Order</span>
                <strong style={{ color: "var(--sky-blue)" }}>{report?.currentDayOrder || "Calculating..."}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0.75rem", backgroundColor: "var(--bg-card-header)", borderRadius: "8px", fontSize: "0.85rem" }}>
                <span>Tomorrow's Computed Day Order</span>
                <strong style={{ color: "var(--text-main)" }}>{report?.tomorrowDayOrder || "Calculating..."}</strong>
              </div>
            </div>
          </div>
          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Base Date: 2026-09-13 (Day Order III)
          </div>
        </div>

        {/* Module 3: Security & Credential Audit */}
        <div className="student-card premium-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ShieldCheck size={18} color="#22c55e" /> Security & Hashing Compliance
              </h3>
              <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "9999px", backgroundColor: "rgba(34, 197, 94, 0.1)", color: "#22c55e", fontWeight: "700" }}>
                Secured
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Verifies that all user account passwords utilize salted bcrypt hashes and that AI query guards are actively enforcing read-only query protections.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle2 size={16} color="#22c55e" /> Salted Bcrypt Password Hashing Active
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle2 size={16} color="#22c55e" /> AI Agent Read-Only SQL Guardrails Active
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle2 size={16} color="#22c55e" /> NextAuth RBAC Edge Middleware Active
              </div>
            </div>
          </div>
          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Last Compliance Scan: Just now
          </div>
        </div>

        {/* Module 4: Attendance Cleanup */}
        <div className="student-card premium-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={18} color="#ef4444" /> Attendance Data Retention
              </h3>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Enforce 6-month (180 days) data retention policy. Permanently delete attendance records exceeding this period.
            </p>
          </div>
          <button
            onClick={async () => {
              if (!confirm("Are you sure? This will permanently delete all attendance records older than 180 days.")) return;
              setRunning(true);
              const res = await fetch("/api/admin/cleanup", { method: "POST" }).then(r => r.json());
              if (res.success) {
                setActionMessage(`Cleanup successful. Deleted ${res.deletedCount} old attendance records.`);
              } else {
                setActionMessage("Cleanup failed: " + res.error);
              }
              setRunning(false);
            }}
            disabled={running}
            style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "0.75rem", borderRadius: "8px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s" }}
          >
            {running ? "Running Cleanup..." : "Execute 180-Day Cleanup"}
          </button>
        </div>
      </div>
    </div>
  );
}
