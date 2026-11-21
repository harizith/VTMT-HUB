"use client";

import { useEffect, useState } from "react";

interface ClockProps {
  size?: number | "sm" | "md" | "lg";
  subtext?: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function Clock({ size, subtext, style, className }: ClockProps = {}) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  let pixelSize: number | undefined;
  let fontSize: string | undefined;
  let subFontSize: string = "0.62rem";

  if (typeof size === "number") {
    pixelSize = size;
    fontSize = `${Math.round(size * 0.22)}px`;
    subFontSize = `${Math.max(9, Math.round(size * 0.08))}px`;
  } else if (size === "sm") {
    pixelSize = 100;
    fontSize = "1.15rem";
    subFontSize = "0.6rem";
  } else if (size === "md") {
    pixelSize = 140;
    fontSize = "1.5rem";
    subFontSize = "0.68rem";
  } else if (size === "lg") {
    pixelSize = 200;
    fontSize = "2.1rem";
    subFontSize = "0.75rem";
  }

  const containerStyle: React.CSSProperties = {
    ...(pixelSize ? { width: `${pixelSize}px`, height: `${pixelSize}px` } : {}),
    ...style,
  };

  if (!time) {
    return (
      <div className={`clock-container ${className || ""}`} style={{ ...containerStyle, visibility: "hidden" }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "transparent" }}></div>
      </div>
    );
  }

  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const timeString = `${hours}:${minutes}`;

  // Calculate rotation for progress arc based on active college day: 08:00 to 16:30 (510 minutes)
  const startHour = 8;
  const startMinute = 0;
  const endHour = 16;
  const endMinute = 30;
  const totalMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);

  let elapsedMinutes = (hours - startHour) * 60 + (time.getMinutes() - startMinute);
  if (elapsedMinutes < 0) elapsedMinutes = 0;
  if (elapsedMinutes > totalMinutes) elapsedMinutes = totalMinutes;

  const percentage = elapsedMinutes / totalMinutes;

  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div className={`clock-container ${className || ""}`} style={containerStyle}>
      <svg className="clock-svg" viewBox="0 0 200 200" width="100%" height="100%">
        {/* Subtle radial glow */}
        <defs>
          <linearGradient id="clockArcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <filter id="clockGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>

        {/* Outer subtle bezel */}
        <circle
          cx="100"
          cy="100"
          r="94"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.08"
          strokeWidth="1.5"
        />

        {/* Track */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="6"
        />

        {/* Progress Arc */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#clockArcGradient)"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          filter="url(#clockGlow)"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />

        {/* Inner subtle hub disc */}
        <circle
          cx="100"
          cy="100"
          r="72"
          fill="currentColor"
          fillOpacity="0.03"
        />

        {/* 12-Hour precision tick marks */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, idx) => (
          <line
            key={angle}
            x1="100"
            y1={idx % 3 === 0 ? "10" : "13"}
            x2="100"
            y2={idx % 3 === 0 ? "18" : "16"}
            stroke="currentColor"
            strokeOpacity={idx % 3 === 0 ? "0.45" : "0.2"}
            strokeWidth={idx % 3 === 0 ? "2" : "1"}
            transform={`rotate(${angle} 100 100)`}
          />
        ))}
      </svg>

      {/* Center Digital Display */}
      <div className="clock-text" style={{ pointerEvents: "none" }}>
        <span
          className="clock-time"
          style={{
            fontSize: fontSize || "1.5rem",
            fontFamily: "var(--font-heading), var(--font-sans)",
            color: "var(--text-main)",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          {timeString}
        </span>
        {subtext && (
          <span
            style={{
              fontSize: subFontSize,
              fontWeight: 700,
              color: "var(--primary, #2563eb)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginTop: "4px",
            }}
          >
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}
