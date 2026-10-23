"use client";

import styles from "./PlacementStamp.module.css";

interface PlacementStampProps {
  type?: "FEASIBLE" | "CHALLENGING";
  className?: string;
}

export function PlacementStamp({ type = "FEASIBLE", className = "" }: PlacementStampProps) {
  const isFeasible = type === "FEASIBLE";
  // The IELTS Spells system colors: Deep Academic Green (#2E7D32) or Brand Rose (#934C5E)
  const strokeColor = isFeasible ? "#2E7D32" : "#934C5E";
  const topText = isFeasible ? "MỤC TIÊU KHẢ THI" : "MỤC TIÊU THÁCH THỨC";
  const bottomText = "★ THE IELTS SPELLS ACADEMIC ★";

  return (
    <div className={`${styles.stampWrapper} ${className}`} aria-label={topText}>
      <svg
        viewBox="0 0 200 200"
        className={styles.stampSvg}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer dashed seal circle */}
        <circle
          cx="100"
          cy="100"
          r="92"
          stroke={strokeColor}
          strokeWidth="3.2"
          strokeDasharray="5 3.5"
          opacity="0.88"
        />

        {/* Inner solid border */}
        <circle
          cx="100"
          cy="100"
          r="76"
          stroke={strokeColor}
          strokeWidth="1.8"
          opacity="0.95"
        />

        {/* Center decorative ring */}
        <circle
          cx="100"
          cy="100"
          r="46"
          stroke={strokeColor}
          strokeWidth="1.2"
          strokeDasharray="3 2.5"
          opacity="0.75"
        />

        {/* Text curve paths */}
        <defs>
          <path
            id="topCurve"
            d="M 28 100 A 72 72 0 0 1 172 100"
            fill="none"
          />
          <path
            id="bottomCurve"
            d="M 172 100 A 72 72 0 0 1 28 100"
            fill="none"
          />
        </defs>

        {/* Top curved text */}
        <text
          fill={strokeColor}
          fontSize="12.5"
          fontWeight="700"
          letterSpacing="1.2"
        >
          <textPath href="#topCurve" startOffset="50%" textAnchor="middle">
            {topText}
          </textPath>
        </text>

        {/* Bottom curved text */}
        <text
          fill={strokeColor}
          fontSize="10"
          fontWeight="700"
          letterSpacing="1.6"
        >
          <textPath href="#bottomCurve" startOffset="50%" textAnchor="middle">
            {bottomText}
          </textPath>
        </text>

        {/* Center The IELTS Spells Academic Insignia */}
        <g transform="translate(100, 100)" stroke={strokeColor} fill={strokeColor}>
          {/* Central Academic Star */}
          <path
            d="M 0 -33 L 2 -27 L 7 -27 L 3 -24 L 5 -19 L 0 -22 L -5 -19 L -3 -24 L -7 -27 L -2 -27 Z"
            strokeWidth="0.8"
          />
          {/* Side Stars */}
          <path
            d="M 0 -33 L 2 -27 L 7 -27 L 3 -24 L 5 -19 L 0 -22 L -5 -19 L -3 -24 L -7 -27 L -2 -27 Z"
            transform="translate(-16, 5) scale(0.65)"
            strokeWidth="0.8"
          />
          <path
            d="M 0 -33 L 2 -27 L 7 -27 L 3 -24 L 5 -19 L 0 -22 L -5 -19 L -3 -24 L -7 -27 L -2 -27 Z"
            transform="translate(16, 5) scale(0.65)"
            strokeWidth="0.8"
          />

          {/* Graduation Mortarboard / Knowledge Cap */}
          <path
            d="M 0 -14 L 20 -7 L 0 0 L -20 -7 Z"
            fill="none"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M -12 -3 L -12 7 C -12 12, 12 12, 12 7 L 12 -3"
            fill="none"
            strokeWidth="1.8"
          />
          <path
            d="M 15 -5 L 18 5 L 17 14"
            fill="none"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="17" cy="15" r="1.5" />

          {/* Open Academic Tome / Spellbook */}
          <path
            d="M -22 14 C -12 11, -3 13, 0 16 C 3 13, 12 11, 22 14 L 22 24 C 12 21, 3 23, 0 26 C -3 23, -12 21, -22 24 Z"
            fill="none"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <line x1="0" y1="16" x2="0" y2="26" strokeWidth="1.8" />
        </g>
      </svg>
    </div>
  );
}
