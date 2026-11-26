"use client";

import { useState, useEffect } from "react";
import { UserCheck, Send, Check, X, Trash2, Calendar, Clock } from "lucide-react";

interface TeacherOption {
  id: string;
  name: string;
  vmNo: string;
  department: string;
}

interface TimetableSlot {
  classId: string;
  subjectCode: string;
  subjectName: string | null;
  dayOrder: string;
  period: number;
}

interface SubRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  substituteId: string;
  substituteName: string;
  classId: string;
  subjectCode: string;
  subjectName: string | null;
  dateString: string;
  dayOrder: string;
  period: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  reason: string | null;
}

export default function TeacherSubstituteView() {
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [myTimetable, setMyTimetable] = useState<TimetableSlot[]>([]);
  const [sentRequests, setSentRequests] = useState<SubRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<SubRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Form state
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<string>("");
  const [classId, setClassId] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [dayOrder, setDayOrder] = useState("I");
  const [period, setPeriod] = useState(1);
  const [dateString, setDateString] = useState(() => new Date().toISOString().slice(0, 10));
  const [substituteId, setSubstituteId] = useState("");
  const [reason, setReason] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch("/api/teacher/substitute").then((r) => r.json());
      if (res.success && res.data) {
        setTeachers(res.data.teachers || []);
        setMyTimetable(res.data.myTimetable || []);
        setSentRequests(res.data.sentRequests || []);
        setIncomingRequests(res.data.incomingRequests || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSlotSelect = (idx: string) => {
    setSelectedSlotIdx(idx);
    if (idx === "") return;
    const slot = myTimetable[Number(idx)];
    if (slot) {
      setClassId(slot.classId);
      setSubjectCode(slot.subjectCode);
      setSubjectName(slot.subjectName || "");
      setDayOrder(slot.dayOrder || "I");
      setPeriod(slot.period || 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/teacher/substitute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          substituteId,
          classId,
          subjectCode,
          subjectName,
          dateString,
          dayOrder,
          period,
          reason,
        }),
      }).then((r) => r.json());

      if (res.success) {
        setMessage({ type: "ok", text: "Substitute request sent! Students will see it only for that day once accepted." });
        setReason("");
        setSelectedSlotIdx("");
        await loadData();
      } else {
        setMessage({ type: "err", text: res.error || "Failed to send request" });
      }
    } catch (err: any) {
      setMessage({ type: "err", text: err.message || "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (id: string, status: "ACCEPTED" | "REJECTED") => {
    const res = await fetch("/api/teacher/substitute", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).then((r) => r.json());
    if (res.success) await loadData();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/teacher/substitute?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).then((r) => r.json());
    if (res.success) await loadData();
  };

  const statusColor = (s: string) =>
    s === "ACCEPTED" ? "#10b981" : s === "REJECTED" ? "#ef4444" : "#f59e0b";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
          Substitute Teacher Requests
        </h1>
        <p style={{ margin: "0.25rem 0 0", opacity: 0.7, fontSize: "0.9rem" }}>
          Request another teacher to cover your class for a single day. Once accepted, students see the substitute only for that specific day.
        </p>
      </div>

      {/* Request Form */}
      <form onSubmit={handleSubmit} className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <UserCheck size={18} /> Request a Substitute
        </h2>

        {myTimetable.length > 0 && (
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem", opacity: 0.8 }}>
              Quick-fill from your timetable (optional)
            </label>
            <select
              value={selectedSlotIdx}
              onChange={(e) => handleSlotSelect(e.target.value)}
              className="input"
              style={{ width: "100%" }}
            >
              <option value="">-- Select a class slot --</option>
              {myTimetable.map((slot, idx) => (
                <option key={`${slot.classId}-${slot.dayOrder}-${slot.period}-${idx}`} value={idx}>
                  Day {slot.dayOrder} • Period {slot.period} • {slot.classId} • {slot.subjectCode}
                  {slot.subjectName ? ` (${slot.subjectName})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", marginBottom: "0.25rem", opacity: 0.8 }}>
              Date (Single Day Only) *
            </label>
            <input
              type="date"
              required
              value={dateString}
              onChange={(e) => setDateString(e.target.value)}
              className="input"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", marginBottom: "0.25rem", opacity: 0.8 }}>
              Day Order *
            </label>
            <select
              value={dayOrder}
              onChange={(e) => setDayOrder(e.target.value)}
              className="input"
              style={{ width: "100%" }}
            >
              {["I", "II", "III", "IV", "V"].map((d) => (
                <option key={d} value={d}>
                  Day {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", marginBottom: "0.25rem", opacity: 0.8 }}>
              Period *
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="input"
              style={{ width: "100%" }}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                <option key={p} value={p}>
                  Period {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", marginBottom: "0.25rem", opacity: 0.8 }}>
              Class ID *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. II-CSE-A"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="input"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", marginBottom: "0.25rem", opacity: 0.8 }}>
              Subject Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CS3401"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              className="input"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", marginBottom: "0.25rem", opacity: 0.8 }}>
              Substitute Teacher *
            </label>
            <select
              required
              value={substituteId}
              onChange={(e) => setSubstituteId(e.target.value)}
              className="input"
              style={{ width: "100%" }}
            >
              <option value="">-- Select 1 Teacher --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.department ? `(${t.department})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.82rem", marginBottom: "0.25rem", opacity: 0.8 }}>
            Reason / Note (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Attending conference / medical leave"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input"
            style={{ width: "100%" }}
          />
        </div>

        {message && (
          <div
            style={{
              padding: "0.65rem 0.9rem",
              borderRadius: "8px",
              fontSize: "0.88rem",
              backgroundColor: message.type === "ok" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
              color: message.type === "ok" ? "#10b981" : "#ef4444",
            }}
          >
            {message.text}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Send size={16} /> {submitting ? "Sending..." : "Send Substitute Request"}
          </button>
        </div>
      </form>

      {/* Incoming Requests */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.75rem" }}>
          Incoming Requests ({incomingRequests.length})
        </h2>
        {loading ? (
          <p style={{ opacity: 0.7 }}>Loading...</p>
        ) : incomingRequests.length === 0 ? (
          <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>No incoming substitute requests.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.85rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border-subtle, rgba(255,255,255,0.1))",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {req.requesterName} • {req.classId} ({req.subjectCode})
                  </div>
                  <div style={{ fontSize: "0.85rem", opacity: 0.75, display: "flex", gap: "0.75rem", marginTop: "0.2rem" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      <Calendar size={14} /> {req.dateString} (Day {req.dayOrder})
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      <Clock size={14} /> Period {req.period}
                    </span>
                  </div>
                  {req.reason && (
                    <div style={{ fontSize: "0.82rem", opacity: 0.7, marginTop: "0.2rem" }}>
                      Note: {req.reason}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {req.status === "PENDING" ? (
                    <>
                      <button
                        onClick={() => handleRespond(req.id, "ACCEPTED")}
                        className="btn"
                        style={{ backgroundColor: "#10b981", color: "#fff", display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.4rem 0.75rem" }}
                      >
                        <Check size={15} /> Accept
                      </button>
                      <button
                        onClick={() => handleRespond(req.id, "REJECTED")}
                        className="btn"
                        style={{ backgroundColor: "#ef4444", color: "#fff", display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.4rem 0.75rem" }}
                      >
                        <X size={15} /> Reject
                      </button>
                    </>
                  ) : (
                    <span
                      style={{
                        padding: "0.25rem 0.65rem",
                        borderRadius: "999px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        backgroundColor: `${statusColor(req.status)}20`,
                        color: statusColor(req.status),
                      }}
                    >
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sent Requests */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.75rem" }}>
          Sent Requests ({sentRequests.length})
        </h2>
        {loading ? (
          <p style={{ opacity: 0.7 }}>Loading...</p>
        ) : sentRequests.length === 0 ? (
          <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>You haven&apos;t sent any substitute requests yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {sentRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.85rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border-subtle, rgba(255,255,255,0.1))",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    To: {req.substituteName} • {req.classId} ({req.subjectCode})
                  </div>
                  <div style={{ fontSize: "0.85rem", opacity: 0.75 }}>
                    {req.dateString} • Day {req.dayOrder} • Period {req.period}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      padding: "0.25rem 0.65rem",
                      borderRadius: "999px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      backgroundColor: `${statusColor(req.status)}20`,
                      color: statusColor(req.status),
                    }}
                  >
                    {req.status}
                  </span>
                  {req.status === "PENDING" && (
                    <button
                      onClick={() => handleDelete(req.id)}
                      title="Cancel request"
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", padding: "0.25rem" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
