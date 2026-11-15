import React from "react";

interface HeroBookArtworkProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export function HeroBookArtwork({
  className,
  width = "100%",
  height = "100%",
}: HeroBookArtworkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 260 140"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{
        width,
        height,
        maxWidth: 260,
        maxHeight: 140,
        display: "block",
        overflow: "visible",
      }}
    >
      <defs>
        {/* Soft Radial Ambient Glow */}
        <radialGradient id="heroMagicAura" cx="50%" cy="70%" r="65%">
          <stop offset="0%" stopColor="#E17A9B" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#BD4F70" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#BD4F70" stopOpacity="0" />
        </radialGradient>

        {/* Page Gradients */}
        <linearGradient id="bookCoverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C95F7E" />
          <stop offset="50%" stopColor="#BD4F70" />
          <stop offset="100%" stopColor="#8A2B47" />
        </linearGradient>

        <linearGradient id="pageTopLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2F6" />
          <stop offset="45%" stopColor="#FBD5E1" />
          <stop offset="100%" stopColor="#E17A9B" />
        </linearGradient>

        <linearGradient id="pageTopRight" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF2F6" />
          <stop offset="45%" stopColor="#FBD5E1" />
          <stop offset="100%" stopColor="#E17A9B" />
        </linearGradient>

        <linearGradient id="pageLayerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8BACB" />
          <stop offset="100%" stopColor="#BD4F70" />
        </linearGradient>

        {/* Magic Wand Gradient */}
        <linearGradient id="wandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#FDE1EB" />
          <stop offset="75%" stopColor="#E17A9B" />
          <stop offset="100%" stopColor="#7E243F" />
        </linearGradient>

        {/* Star Sparkle Gradient */}
        <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#FDE4ED" />
          <stop offset="85%" stopColor="#E17A9B" />
          <stop offset="100%" stopColor="#C45375" />
        </linearGradient>

        {/* Soft Star Glow Filter */}
        <filter id="starGlowFilter" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. Background Magic Aura */}
      <ellipse cx="130" cy="94" rx="85" ry="38" fill="url(#heroMagicAura)" />

      {/* 2. Book Cover / Foundation Bottom Shadow */}
      <path
        d="M52 114 C82 125 116 122 130 126 C144 122 178 125 208 114 C212 119 178 132 130 132 C82 132 48 119 52 114 Z"
        fill="url(#bookCoverGrad)"
        opacity="0.8"
      />

      {/* 3. Under Pages / Spine Foundation */}
      <path
        d="M56 110 C84 121 116 117 130 122 C144 117 176 121 204 110 C188 116 156 120 130 121 C104 120 72 116 56 110 Z"
        fill="url(#pageLayerGrad)"
        opacity="0.9"
      />

      {/* 4. Layered Leaf Pages (Left & Right Mid Pages for 3D Depth) */}
      <path
        d="M130 120 C116 112 78 106 48 100 C45 104 50 110 57 112 C84 118 115 117 130 121 Z"
        fill="#A53C58"
        opacity="0.6"
      />
      <path
        d="M130 120 C144 112 182 106 212 100 C215 104 210 110 203 112 C176 118 145 117 130 121 Z"
        fill="#A53C58"
        opacity="0.6"
      />

      {/* 5. Left Open Main Wing (Upper Leaf) */}
      <path
        d="M130 119 C118 109 76 89 36 91 C33 94 38 102 46 105 C78 112 114 114 130 120 Z"
        fill="url(#pageTopLeft)"
      />
      <path
        d="M130 119 C116 106 74 85 36 89 C35 87 54 78 88 80 C110 81 124 96 130 119 Z"
        fill="url(#pageTopLeft)"
        opacity="0.92"
      />
      {/* Delicate Page Contour Highlights */}
      <path
        d="M38 90 C72 87 114 106 129 119"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.75"
      />

      {/* 6. Right Open Main Wing (Upper Leaf) */}
      <path
        d="M130 119 C142 109 184 89 224 91 C227 94 222 102 214 105 C182 112 146 114 130 120 Z"
        fill="url(#pageTopRight)"
      />
      <path
        d="M130 119 C144 106 186 85 224 89 C225 87 206 78 172 80 C150 81 136 96 130 119 Z"
        fill="url(#pageTopRight)"
        opacity="0.92"
      />
      {/* Delicate Page Contour Highlights */}
      <path
        d="M222 90 C188 87 146 106 131 119"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.75"
      />

      {/* 7. Center Crease Line with Subtle Light Spine */}
      <path
        d="M130 89 L130 121"
        stroke="#8A2B47"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M129.4 92 L129.4 120"
        stroke="#FFF0F5"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* 8. Magic Wand (Tilted wand aiming magic into the book) */}
      <g transform="rotate(-26 162 82)">
        {/* Wand Body */}
        <path
          d="M160 32 L163 32 L162 96 L160.5 96 Z"
          fill="url(#wandGrad)"
        />
        {/* Wand Ring Details */}
        <rect x="159.6" y="44" width="3.8" height="2.8" rx="1.2" fill="#FFFFFF" opacity="0.9" />
        <rect x="159.9" y="50" width="3.2" height="1.8" rx="0.9" fill="#FCEEF2" opacity="0.75" />
        {/* Wand Magic Tip */}
        <circle
          cx="161.2"
          cy="96"
          r="2.8"
          fill="#FFFFFF"
          filter="url(#starGlowFilter)"
        />
      </g>

      {/* 9. Glowing Stars / Magic Sparkles (4-Point Diamond Sparkles) */}
      {/* Top Center Hero Star */}
      <path
        d="M138 16 Q138 29 151 29 Q138 29 138 42 Q138 29 125 29 Q138 29 138 16 Z"
        fill="url(#sparkleGrad)"
        filter="url(#starGlowFilter)"
      />
      <circle cx="138" cy="29" r="2.2" fill="#FFFFFF" />

      {/* Upper Left Star */}
      <path
        d="M80 40 Q80 49 89 49 Q80 49 80 58 Q80 49 71 49 Q80 49 80 40 Z"
        fill="url(#sparkleGrad)"
        filter="url(#starGlowFilter)"
      />
      <circle cx="80" cy="49" r="1.5" fill="#FFFFFF" />

      {/* Upper Right Star */}
      <path
        d="M202 32 Q202 40 210 40 Q202 40 202 48 Q202 40 194 40 Q202 40 202 32 Z"
        fill="url(#sparkleGrad)"
        filter="url(#starGlowFilter)"
      />
      <circle cx="202" cy="40" r="1.4" fill="#FFFFFF" />

      {/* Mid Left Star */}
      <path
        d="M52 66 Q52 74 60 74 Q52 74 52 82 Q52 74 44 74 Q52 74 52 66 Z"
        fill="url(#sparkleGrad)"
        filter="url(#starGlowFilter)"
      />
      <circle cx="52" cy="74" r="1.3" fill="#FFFFFF" />

      {/* Mid Right Star */}
      <path
        d="M214 60 Q214 67 221 67 Q214 67 214 74 Q214 67 207 67 Q214 67 214 60 Z"
        fill="url(#sparkleGrad)"
      />

      {/* Lower Left Accent Star */}
      <path
        d="M100 70 Q100 75 105 75 Q100 75 100 80 Q100 75 95 75 Q100 75 100 70 Z"
        fill="url(#sparkleGrad)"
        opacity="0.9"
      />

      {/* Lower Right Accent Star */}
      <path
        d="M188 72 Q188 76 192 76 Q188 76 188 80 Q188 76 184 76 Q188 76 188 72 Z"
        fill="url(#sparkleGrad)"
        opacity="0.9"
      />

      {/* Magic Wand Tip Burst */}
      <path
        d="M154 74 Q154 78 158 78 Q154 78 154 82 Q154 78 150 78 Q154 78 154 74 Z"
        fill="#FFFFFF"
        filter="url(#starGlowFilter)"
      />

      {/* Scattered Twinkles / Fairy Dust */}
      <circle cx="66" cy="52" r="1.3" fill="#FFFFFF" opacity="0.9" />
      <circle cx="106" cy="32" r="1.6" fill="#FDE1EB" opacity="0.95" />
      <circle cx="116" cy="58" r="1.3" fill="#FFFFFF" opacity="0.85" />
      <circle cx="170" cy="24" r="1.5" fill="#FFFFFF" opacity="0.9" />
      <circle cx="180" cy="58" r="1.6" fill="#FDE1EB" opacity="0.95" />
      <circle cx="230" cy="48" r="1.3" fill="#FFFFFF" opacity="0.8" />
      <circle cx="224" cy="78" r="1.5" fill="#FDE1EB" opacity="0.85" />
    </svg>
  );
}
