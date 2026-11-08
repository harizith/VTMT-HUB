"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Database, Loader2, Paperclip } from "lucide-react";
import * as XLSX from "xlsx";

export default function AdminAgentChat({ onTimetableUpdated }: { onTimetableUpdated?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "agent"; content: string; data?: any }[]>([
    { role: "agent", content: "Hello! I am your fully autonomous AI agent. Ask me to add, edit, update, delete, or search data (e.g., 'Update John to be an ADMIN', 'Delete all notices from yesterday')." }
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
          setMessages(prev => [...prev, { role: "agent", content: `(Attached ${file.name} with ${data.length} rows. You can now ask me to import or process this data!)` }]);
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
          .filter(m => !m.content.startsWith("(Attached") && !m.content.startsWith("Hello! I am your"))
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
          backgroundColor: "var(--royal-blue)",
          color: "white",
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          cursor: "pointer",
          border: "none",
          zIndex: 9999
        }}
      >
        <Database size={28} />
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed",
      bottom: "2rem",
      right: "2rem",
      width: "380px",
      height: "550px",
      backgroundColor: "var(--bg-card)",
      borderRadius: "16px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
      display: "flex",
      flexDirection: "column",
      border: "1px solid var(--border-subtle)",
      zIndex: 9999,
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        padding: "0.85rem 1rem",
        backgroundColor: "var(--royal-blue)",
        color: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600" }}>
          <Database size={18} />
          <span>Academic Copilot</span>
          <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.2)", fontWeight: "500" }}>Fast & Efficient</span>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          style={{ background: "transparent", border: "none", color: "white", cursor: "pointer" }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Quick Suggestion Chips */}
      <div style={{ padding: "0.5rem 0.75rem", backgroundColor: "var(--bg-input)", borderBottom: "1px solid var(--border-subtle)", display: "flex", gap: "0.4rem", overflowX: "auto" }}>
        {[
          "List all departments",
          "Show recent notices",
          "Count students",
          "Reset user password"
        ].map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => setInput(prompt)}
            style={{
              padding: "0.25rem 0.6rem",
              borderRadius: "12px",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-muted)",
              fontSize: "0.72rem",
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--sky-blue)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem", backgroundColor: "var(--bg-main)" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ 
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%"
          }}>
            <div style={{
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              backgroundColor: m.role === "user" ? "var(--sky-blue)" : "var(--bg-input)",
              color: m.role === "user" ? "white" : "var(--text-main)",
              border: m.role === "agent" ? "1px solid var(--border-subtle)" : "none",
              fontSize: "0.9rem",
              lineHeight: "1.4",
              whiteSpace: "pre-wrap"
            }}>
              {m.content}
            </div>
            {m.data && m.data.sqlQuery && (
              <div style={{ 
                marginTop: "0.5rem", 
                display: "flex", 
                flexDirection: "column", 
                gap: "0.5rem",
                maxHeight: "300px",
                overflowY: "auto",
                paddingRight: "0.25rem"
              }}>
                <div style={{ padding: "0.5rem", backgroundColor: "var(--bg-input)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                   <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-muted)", marginBottom: "4px" }}>SQL Executed:</div>
                   <div style={{ fontSize: "0.8rem", color: "var(--royal-blue)", fontFamily: "monospace" }}>{m.data.sqlQuery}</div>
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: "flex-start", padding: "0.75rem", color: "var(--text-muted)" }}>
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attached File Pill */}
      {attachedFileName && (
        <div style={{ padding: "0.5rem 1rem", backgroundColor: "var(--bg-main)", borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--royal-blue)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Paperclip size={14} /> Attached: {attachedFileName}
          </div>
          <button onClick={() => { setAttachedData(null); setAttachedFileName(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "1rem", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: "0.5rem", backgroundColor: "var(--bg-card)" }}>
        <label style={{
            padding: "0.75rem",
            borderRadius: "8px",
            backgroundColor: "var(--bg-input)",
            color: "var(--text-main)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--border-subtle)",
          }}>
          <Paperclip size={18} />
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: "none" }} />
        </label>
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Ask me to add, update, delete, or fetch data..."
          style={{
            flex: 1,
            padding: "0.75rem",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)",
            backgroundColor: "var(--bg-input)",
            color: "var(--text-main)",
            outline: "none"
          }}
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          style={{
            padding: "0.75rem",
            borderRadius: "8px",
            backgroundColor: "var(--royal-blue)",
            color: "white",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: (!input.trim() || isLoading) ? 0.6 : 1
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
