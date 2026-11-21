"use client";

import React from "react";

interface BrandLogoProps {
  size?: number | "sm" | "md" | "lg";
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

export default function BrandLogo({
  size = "md",
  showText = true,
  subtitle,
  className = "",
}: BrandLogoProps) {
  let pixelSize = 36;
  if (typeof size === "number") pixelSize = size;
  else if (size === "sm") pixelSize = 30;
  else if (size === "md") pixelSize = 38;
  else if (size === "lg") pixelSize = 46;

  return (
    <div
      className={`brand-logo-container ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.75rem",
        userSelect: "none",
      }}
    >
      <div
        className="brand-logo-icon"
        style={{
          width: `${pixelSize}px`,
          height: `${pixelSize}px`,
          minWidth: `${pixelSize}px`,
          borderRadius: `${Math.round(pixelSize * 0.28)}px`,
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #6366f1 100%)",
          padding: "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px -2px rgba(37, 99, 235, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15) inset",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle glass gloss highlight */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "45%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)",
            borderRadius: `${Math.round(pixelSize * 0.28)}px ${Math.round(pixelSize * 0.28)}px 0 0`,
            pointerEvents: "none",
          }}
        />

        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "72%", height: "72%" }}
        >
          {/* Stylized geometric V & M mark */}
          <path
            d="M8 11L18 29L23 20L18 11H8Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M32 11L22 29L19.5 24.5L25 15H32Z"
            fill="#93c5fd"
          />
          <path
            d="M21 21.5L24 16L32 11L23.5 26.5L21 21.5Z"
            fill="#60a5fa"
          />
          <circle cx="20" cy="11" r="2" fill="#38bdf8" />
        </svg>
      </div>

      {showText && (
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              lineHeight: 1.15,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-heading), var(--font-sans)",
                fontSize: `${Math.max(1, pixelSize * 0.038)}rem`,
                fontWeight: "800",
                letterSpacing: "-0.025em",
                color: "var(--text-main)",
              }}
            >
              VM-HUB
            </span>
            <span
              style={{
                fontSize: "0.62rem",
                fontWeight: "700",
                padding: "0.15rem 0.35rem",
                borderRadius: "4px",
                backgroundColor: "rgba(37, 99, 235, 0.12)",
                color: "var(--primary, #2563eb)",
                letterSpacing: "0.03em",
                border: "1px solid rgba(37, 99, 235, 0.2)",
              }}
            >
              PRO
            </span>
          </div>
          {subtitle && (
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: "600",
                color: "var(--primary, #2563eb)",
                letterSpacing: "0.01em",
                marginTop: "0.15rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
