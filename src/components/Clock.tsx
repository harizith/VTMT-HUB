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

  // Compute dimensions if size is provided
  let pixelSize: number | undefined;
  let fontSize: string | undefined;
  if (typeof size === "number") {
    pixelSize = size;
    fontSize = `${Math.round(size * 0.22)}px`;
  } else if (size === "sm") {
    pixelSize = 120;
    fontSize = "1.3rem";
  } else if (size === "md") {
    pixelSize = 160;
    fontSize = "1.8rem";
  } else if (size === "lg") {
    pixelSize = 220;
    fontSize = "2.4rem";
  }

  const containerStyle: React.CSSProperties = {
    ...(pixelSize ? { width: `${pixelSize}px`, height: `${pixelSize}px` } : {}),
    ...style,
  };

  if (!time) {
    return (
      <div className={`clock-container ${className || ""}`} style={{ ...containerStyle, visibility: "hidden" }}>
        <div className="clock-circle"></div>
      </div>
    );
  }

  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const timeString = `${hours}:${minutes}`;

  // Calculate rotation for the orange arc based on current time
  // Assuming a standard school day from 8:00 to 16:00 (8 hours)
  const startHour = 8;
  const endHour = 16;
  const totalMinutes = (endHour - startHour) * 60;
  
  // Calculate minutes elapsed since 8:00 AM
  let elapsedMinutes = (hours - startHour) * 60 + time.getMinutes();
  
  // Clamp values so the arc doesn't spin wildly at night
  if (elapsedMinutes < 0) elapsedMinutes = 0;
  if (elapsedMinutes > totalMinutes) elapsedMinutes = totalMinutes;

  const percentage = elapsedMinutes / totalMinutes;
  
  // SVG arc calculation (Stroke Dasharray)
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div className={`clock-container ${className || ""}`} style={containerStyle}>
      <svg className="clock-svg" viewBox="0 0 200 200" width="100%" height="100%">
        {/* Background track */}
        <circle 
          cx="100" cy="100" r={radius} 
          fill="none" 
          stroke="rgba(255,255,255,0.12)" 
          strokeWidth="10" 
        />
        
        {/* Active Time Arc (Orange) */}
        <circle 
          cx="100" cy="100" r={radius} 
          fill="none" 
          stroke="var(--accent-orange, #f59e0b)" 
          strokeWidth="10" 
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          className="clock-arc"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />

        {/* Inner Dark Circle */}
        <circle 
          cx="100" cy="100" r="75" 
          fill="rgba(0,0,0,0.4)" 
        />
        
        {/* Tick marks (simulated) */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line 
            key={angle}
            x1="100" y1="5" x2="100" y2="15" 
            stroke="rgba(255,255,255,0.7)" 
            strokeWidth="3"
            transform={`rotate(${angle} 100 100)`}
          />
        ))}
      </svg>
      
      {/* Center Text */}
      <div className="clock-text" style={{ pointerEvents: "none" }}>
        <span className="clock-time" style={fontSize ? { fontSize } : undefined}>{timeString}</span>
        {subtext && (
          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "0.06em", marginTop: "2px" }}>
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}
