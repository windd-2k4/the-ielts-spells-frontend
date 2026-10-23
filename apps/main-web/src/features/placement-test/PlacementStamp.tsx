"use client";

import styles from "./PlacementStamp.module.css";

interface PlacementStampProps {
  type?: "FEASIBLE" | "CHALLENGING";
  className?: string;
}

export function PlacementStamp({ type = "FEASIBLE", className = "" }: PlacementStampProps) {
  const isFeasible = type === "FEASIBLE";
  const strokeColor = isFeasible ? "#10B981" : "#EF4444";
  const topText = isFeasible ? "Khả thi nên có chiến lược" : "Mục tiêu thách thức";
  const bottomText = "THE IELTS SPELLS";

  return (
    <div className={`${styles.stampWrapper} ${className}`} aria-label={topText}>
      <svg
        viewBox="0 0 200 200"
        className={styles.stampSvg}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer dashed circle */}
        <circle
          cx="100"
          cy="100"
          r="92"
          stroke={strokeColor}
          strokeWidth="3.5"
          strokeDasharray="6 4"
          opacity="0.85"
        />

        {/* Inner solid circle */}
        <circle
          cx="100"
          cy="100"
          r="78"
          stroke={strokeColor}
          strokeWidth="2"
          opacity="0.9"
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
          fontSize="13.5"
          fontWeight="bold"
          letterSpacing="1.2"
        >
          <textPath href="#topCurve" startOffset="50%" textAnchor="middle">
            {topText}
          </textPath>
        </text>

        {/* Bottom curved text */}
        <text
          fill={strokeColor}
          fontSize="11"
          fontWeight="bold"
          letterSpacing="2"
        >
          <textPath href="#bottomCurve" startOffset="50%" textAnchor="middle">
            {bottomText}
          </textPath>
        </text>

        {/* Center Cute Mascot Illustration */}
        <g transform="translate(68, 62) scale(0.65)">
          {/* Headband with knot */}
          <path
            d="M 15 25 Q 50 15 85 25 L 85 35 Q 50 25 15 35 Z"
            fill={strokeColor}
            opacity="0.9"
          />
          <circle cx="85" cy="30" r="6" fill={strokeColor} />
          <path d="M 85 30 L 98 22 L 95 35 Z" fill={strokeColor} />

          {/* Bean Body */}
          <path
            d="M 25 35 C 10 50, 15 90, 40 100 C 65 110, 85 85, 80 55 C 75 35, 60 25, 45 28 Z"
            stroke={strokeColor}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Eyes & determination expression */}
          {isFeasible ? (
            // Smiling confident eyes
            <>
              <path d="M 36 52 Q 42 46 48 52" stroke={strokeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 58 52 Q 64 46 70 52" stroke={strokeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 46 66 Q 53 74 60 66" stroke={strokeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          ) : (
            // Determined / sweating eyes
            <>
              <path d="M 36 48 L 48 54" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
              <path d="M 70 48 L 58 54" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
              <path d="M 48 68 Q 53 62 58 68" stroke={strokeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {/* Sweat drop */}
              <path d="M 22 55 Q 16 62 22 66 Q 28 62 22 55 Z" fill={strokeColor} opacity="0.8" />
            </>
          )}

          {/* Cheeks */}
          <ellipse cx="33" cy="62" rx="4" ry="2" fill={strokeColor} opacity="0.4" />
          <ellipse cx="73" cy="62" rx="4" ry="2" fill={strokeColor} opacity="0.4" />
        </g>
      </svg>
    </div>
  );
}
