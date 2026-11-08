"use client";

import { useState } from "react";
import { LayoutGrid, Calendar } from "lucide-react";
import { TimetableEntry } from "./OverallTimetable";

interface TimetableCalendarViewProps {
  entries: TimetableEntry[];
}

export default function TimetableCalendarView({ entries }: TimetableCalendarViewProps) {
  // Calendar-style grid rendering
  const days = ["I", "II", "III", "IV", "V"];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  const onDragStart = (e: React.DragEvent, entry: TimetableEntry) => {
    e.dataTransfer.setData("text/plain", JSON.stringify(entry));
  };

  const onDrop = (e: React.DragEvent, dayOrder: string, period: number) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    // Implement reordering logic here
    console.log(`Dropped ${data.subjectName} onto Day ${dayOrder} Period ${period}`);
    alert(`Drag & Drop feature implementation: Logic for updating assignment to Day ${dayOrder} Period ${period} would go here.`);
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
        <thead>
          <tr>
            <th style={{ padding: "0.5rem", border: "1px solid var(--border-subtle)" }}>Day / Period</th>
            {periods.map(p => <th key={p} style={{ padding: "0.5rem", border: "1px solid var(--border-subtle)" }}>P{p}</th>)}
          </tr>
        </thead>
        <tbody>
          {days.map(day => (
            <tr key={day}>
              <td style={{ padding: "0.5rem", border: "1px solid var(--border-subtle)", fontWeight: "bold" }}>Day {day}</td>
              {periods.map(period => {
                const entry = entries.find(e => e.dayOrder === day && e.period === period);
                return (
                  <td
                    key={period}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDrop(e, day, period)}
                    style={{
                      padding: "0.5rem",
                      border: "1px solid var(--border-subtle)",
                      minWidth: "120px",
                      minHeight: "80px",
                      backgroundColor: entry ? "rgba(56, 189, 248, 0.1)" : "transparent"
                    }}
                  >
                    {entry ? (
                      <div
                        draggable
                        onDragStart={(e) => onDragStart(e, entry)}
                        style={{
                          padding: "0.5rem",
                          borderRadius: "4px",
                          backgroundColor: "var(--bg-card)",
                          cursor: "grab"
                        }}
                      >
                        <div style={{ fontWeight: "bold" }}>{entry.subjectCode}</div>
                        <div style={{ fontSize: "0.75rem" }}>{entry.subjectName}</div>
                      </div>
                    ) : (
                      <div style={{ color: "#aaa", textAlign: "center" }}>Empty</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
