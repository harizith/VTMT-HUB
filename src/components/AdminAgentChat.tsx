"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Database, Loader2, Paperclip, Sparkles, Terminal, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";

export default function AdminAgentChat({ onTimetableUpdated }: { onTimetableUpdated?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "agent"; content: string; data?: any }[]>([
    { role: "agent", content: "Autonomous Academic Copilot online. Query or mutate institution records, faculty allocations, timetable conflicts, or upload an Excel dataset to analyze." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedData, setAttachedData] = useState<any[] | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setAttachedFileName(file.name);
    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        if (bstr) {
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          setAttachedData(data);
          setMessages(prev => [...prev, { role: "agent", content: `(Attached ${file.name} with ${data.length} records. Ask me to parse, import, or audit this spreadsheet!)` }]);
        }
        setIsLoading(false);
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      setMessages(prev => [...prev, { role: "agent", content: "Failed to parse excel file." }]);
      setIsLoading(false);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const payload: any = { 
        query: userMessage,
        history: messages
          .filter(m => !m.content.startsWith("(Attached") && !m.content.startsWith("Autonomous Academic Copilot"))
          .slice(-2)
          .map(m => ({
            role: m.role === "agent" ? "assistant" : "user",
            content: m.content.length > 200 ? m.content.substring(0, 200) : m.content
          }))
      };
      if (attachedData) {
        payload.attachedData = attachedData.slice(0, 5); // only send first 5 sample rows to prevent token floods
      }

      const res = await fetch("/api/admin/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        role: "agent", 
        content: data.reply || "Done.", 
        data: data.data 
      }]);
      
      // Clear attached data after sending
      if (attachedData) {
        setAttachedData(null);
        setAttachedFileName(null);
      }
      
      if (data.success && onTimetableUpdated && data.data?.isWrite) {
        onTimetableUpdated();
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "agent", content: "Error connecting to local agent." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          backgroundColor: "var(--primary)",
          color: "#ffffff",
          borderRadius: "50%",
          width: "56px",
          height: "56px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 10px 25px -4px rgba(37, 99, 235, 0.45)",
          cursor: "pointer",
          border: "2px solid rgba(255,255,255,0.2)",
          zIndex: 9999,
          transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
        aria-label="Open Academic Copilot"
      >
        <Sparkles size={24} />
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed",
      bottom: "2rem",
      right: "2rem",
      width: "400px",
      maxWidth: "calc(100vw - 2rem)",
      height: "580px",
      maxHeight: "calc(100vh - 4rem)",
      backgroundColor: "var(--bg-card)",
      borderRadius: "20px",
      boxShadow: "0 20px 48px -12px rgba(0, 0, 0, 0.3)",
      display: "flex",
      flexDirection: "column",
      border: "1px solid var(--border-subtle)",
      zIndex: 9999,
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        padding: "1rem 1.25rem",
        backgroundColor: "var(--bg-card-header)",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            backgroundColor: "rgba(37, 99, 235, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--primary)"
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.01em" }}>
              Academic Copilot
            </div>
            <div style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981", display: "inline-block" }} />
              Autonomous Engine Active
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "0.35rem 0.45rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Quick Suggestion Chips */}
      <div style={{
        padding: "0.6rem 0.85rem",
        backgroundColor: "var(--bg-input)",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        gap: "0.4rem",
        overflowX: "auto"
      }}>
        {[
          "List all departments",
          "Show recent notices",
          "Count students",
          "Audit timetable"
        ].map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => setInput(prompt)}
            style={{
              padding: "0.25rem 0.65rem",
              borderRadius: "99px",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-muted)",
              fontSize: "0.72rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--primary)";
              e.currentTarget.style.color = "var(--primary)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem", backgroundColor: "var(--bg-main)" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ 
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "88%"
          }}>
            <div style={{
              padding: "0.75rem 1rem",
              borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              backgroundColor: m.role === "user" ? "var(--primary)" : "var(--bg-card)",
              color: m.role === "user" ? "#ffffff" : "var(--text-main)",
              border: m.role === "agent" ? "1px solid var(--border-subtle)" : "none",
              fontSize: "0.88rem",
              lineHeight: "1.45",
              whiteSpace: "pre-wrap",
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
            }}>
              {m.content}
            </div>
            {m.data && m.data.sqlQuery && (
              <div style={{ 
                marginTop: "0.5rem", 
                display: "flex", 
                flexDirection: "column", 
                gap: "0.4rem",
                maxHeight: "240px",
                overflowY: "auto"
              }}>
                <div style={{
                  padding: "0.6rem 0.85rem",
                  backgroundColor: "var(--bg-card)",
                  borderRadius: "10px",
                  border: "1px solid var(--border-subtle)"
                }}>
                  <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono, monospace)", color: "var(--text-muted)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Terminal size={12} /> Executed SQL Query:
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--primary)", fontFamily: "var(--font-mono, monospace)", wordBreak: "break-all" }}>
                    {m.data.sqlQuery}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: "flex-start", padding: "0.5rem 1rem", backgroundColor: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
            <span>Consulting institutional schema...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attached File Pill */}
      {attachedFileName && (
        <div style={{ padding: "0.5rem 1rem", backgroundColor: "var(--bg-input)", borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700 }}>
            <Paperclip size={14} /> Attached: {attachedFileName}
          </div>
          <button onClick={() => { setAttachedData(null); setAttachedFileName(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "0.85rem 1rem", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: "0.5rem", backgroundColor: "var(--bg-card)" }}>
        <label style={{
            padding: "0.65rem",
            borderRadius: "10px",
            backgroundColor: "var(--bg-input)",
            color: "var(--text-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--border-subtle)",
            transition: "all 0.15s ease"
          }}>
          <Paperclip size={16} />
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: "none" }} />
        </label>
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Ask me to mutate, count, or inspect records..."
          style={{
            flex: 1,
            padding: "0.65rem 0.85rem",
            borderRadius: "10px",
            border: "1px solid var(--border-subtle)",
            backgroundColor: "var(--bg-input)",
            color: "var(--text-main)",
            outline: "none",
            fontSize: "0.85rem"
          }}
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          style={{
            padding: "0.65rem 0.95rem",
            borderRadius: "10px",
            backgroundColor: "var(--primary)",
            color: "white",
            border: "none",
            cursor: (!input.trim() || isLoading) ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: (!input.trim() || isLoading) ? 0.6 : 1,
            transition: "all 0.15s ease"
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
