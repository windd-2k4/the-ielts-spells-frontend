export function IeltsIllustration() {
  return (
    <svg
      viewBox="0 0 540 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ielts-3d-art"
      aria-label="Minh họa 3D IELTS Academic: Mũ tốt nghiệp, Huy hiệu Band 8.5+ và 4 Kỹ năng"
    >
      <defs>
        {/* Soft Drop Shadows */}
        <filter id="shadow-main" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#be5a73" floodOpacity="0.25" />
        </filter>
        <filter id="shadow-pill" x="-30%" y="-30%" width="170%" height="170%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#9c3b52" floodOpacity="0.22" />
        </filter>
        <filter id="shadow-subtle" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#be5a73" floodOpacity="0.18" />
        </filter>

        {/* 3D Sphere Gradients */}
        <radialGradient id="sphereRose" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#fcaec0" />
          <stop offset="75%" stopColor="#e7708b" />
          <stop offset="100%" stopColor="#c54462" />
        </radialGradient>

        <radialGradient id="spherePeach" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#ffd8c9" />
          <stop offset="80%" stopColor="#f99e7b" />
          <stop offset="100%" stopColor="#d86940" />
        </radialGradient>

        <radialGradient id="sphereGold" cx="35%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#fff9e6" />
          <stop offset="45%" stopColor="#fcd36a" />
          <stop offset="80%" stopColor="#e5a824" />
          <stop offset="100%" stopColor="#b27708" />
        </radialGradient>

        <radialGradient id="spherePlum" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffccd8" />
          <stop offset="50%" stopColor="#a8435d" />
          <stop offset="85%" stopColor="#6e2035" />
          <stop offset="100%" stopColor="#450e1d" />
        </radialGradient>

        {/* Medal Face Gradient */}
        <linearGradient id="medalFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#ffeef2" />
          <stop offset="80%" stopColor="#fbd3dc" />
          <stop offset="100%" stopColor="#f1a8b9" />
        </linearGradient>

        <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe999" />
          <stop offset="35%" stopColor="#f5c242" />
          <stop offset="70%" stopColor="#e09e19" />
          <stop offset="100%" stopColor="#9e6900" />
        </linearGradient>

        {/* 3D Ribbon Gradients */}
        <linearGradient id="ribbonMain" x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#fedae2" />
          <stop offset="45%" stopColor="#f48ca2" />
          <stop offset="85%" stopColor="#de5d7a" />
          <stop offset="100%" stopColor="#b63452" />
        </linearGradient>

        <linearGradient id="ribbonBack" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c54462" />
          <stop offset="100%" stopColor="#872037" />
        </linearGradient>

        {/* Graduation Cap Gradients */}
        <linearGradient id="capTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2738c" />
          <stop offset="45%" stopColor="#bf4d67" />
          <stop offset="80%" stopColor="#962d46" />
          <stop offset="100%" stopColor="#751b31" />
        </linearGradient>

        <linearGradient id="capUnder" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#751b31" />
          <stop offset="100%" stopColor="#4e0e1e" />
        </linearGradient>

        {/* Speckled Ring Pattern / Gradient */}
        <linearGradient id="speckledRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffecf0" />
          <stop offset="50%" stopColor="#f7cad5" />
          <stop offset="100%" stopColor="#e398aa" />
        </linearGradient>
      </defs>

      {/* BACKGROUND FLOATING ELEMENTS */}

      {/* 1. Large 3D Speckled Torus Ring (Lower Right - echoes the reference image) */}
      <g filter="url(#shadow-subtle)" transform="rotate(-18 400 370)">
        <ellipse cx="400" cy="370" rx="90" ry="54" fill="url(#speckledRing)" />
        <ellipse cx="400" cy="370" rx="46" ry="26" fill="#f8c6d3" />
        {/* Subtle decorative speckles */}
        <circle cx="360" cy="360" r="2.5" fill="#c45d74" opacity="0.4" />
        <circle cx="430" cy="375" r="3" fill="#b94c65" opacity="0.35" />
        <circle cx="410" cy="395" r="2" fill="#c45d74" opacity="0.45" />
        <circle cx="380" cy="385" r="3" fill="#a83a52" opacity="0.3" />
        <circle cx="445" cy="360" r="2" fill="#c45d74" opacity="0.4" />
        <circle cx="355" cy="375" r="1.8" fill="#b94c65" opacity="0.35" />
      </g>

      {/* 2. Soft Background Swirling Ribbon (Back Layer) */}
      <path
        d="M 60 270 C 40 180, 110 90, 210 110 C 290 125, 310 210, 260 280 C 230 320, 160 330, 130 290"
        fill="none"
        stroke="url(#ribbonBack)"
        strokeWidth="18"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* 3. Small Floating Pastel Sphere (Top Left) */}
      <g filter="url(#shadow-subtle)">
        <circle cx="95" cy="115" r="24" fill="url(#spherePeach)" />
      </g>

      {/* 4. Small Pearl Sphere (Mid Left) */}
      <g filter="url(#shadow-subtle)">
        <circle cx="55" cy="285" r="14" fill="url(#sphereRose)" />
      </g>

      {/* 5. Medium Floating Pearl Sphere (Upper Right) */}
      <g filter="url(#shadow-subtle)">
        <circle cx="455" cy="165" r="20" fill="url(#sphereRose)" />
      </g>

      {/* 6. Gold Accent Sphere (Far Right) */}
      <g filter="url(#shadow-subtle)">
        <circle cx="490" cy="275" r="11" fill="url(#sphereGold)" />
      </g>

      {/* MAIN CENTERPIECE: IELTS 8.5+ 3D ACADEMIC MEDAL & GRADUATION CAP */}

      {/* Drop shadow for main centerpiece */}
      <ellipse cx="270" cy="410" rx="140" ry="26" fill="#be5a73" opacity="0.22" filter="blur(14px)" />

      {/* 3D Medal Body */}
      <g filter="url(#shadow-main)">
        {/* Medal Extrusion / 3D Rim Depth */}
        <circle cx="265" cy="274" r="102" fill="url(#capUnder)" />
        <circle cx="265" cy="270" r="102" fill="url(#goldRim)" />
        <circle cx="265" cy="268" r="95" fill="url(#capTop)" />
        <circle cx="265" cy="266" r="91" fill="url(#medalFace)" />

        {/* Glossy inner top sheen */}
        <ellipse cx="265" cy="205" rx="65" ry="26" fill="#ffffff" opacity="0.65" />

        {/* Laurel Wreath Accents (Golden 3D leaves) */}
        <g fill="url(#goldRim)">
          <path d="M 195 270 C 195 240, 210 215, 230 200 C 226 215, 224 235, 230 250 C 220 252, 205 260, 195 270 Z" />
          <path d="M 335 270 C 335 240, 320 215, 300 200 C 304 215, 306 235, 300 250 C 310 252, 325 260, 335 270 Z" />
          <circle cx="205" cy="285" r="4.5" />
          <circle cx="325" cy="285" r="4.5" />
        </g>

        {/* IELTS Ribbon Kicker on Medal */}
        <rect x="215" y="214" width="100" height="22" rx="11" fill="url(#capTop)" />
        <text
          x="265"
          y="230"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="11"
          fontWeight="800"
          letterSpacing="2.5"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          IELTS
        </text>

        {/* Giant 8.5 Band Score */}
        <text
          x="265"
          y="290"
          textAnchor="middle"
          fill="url(#capUnder)"
          fontSize="54"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-1"
        >
          8.5
        </text>

        {/* Subtext: TARGET BAND */}
        <text
          x="265"
          y="312"
          textAnchor="middle"
          fill="#943149"
          fontSize="10"
          fontWeight="800"
          letterSpacing="3"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          OVERALL BAND
        </text>

        {/* Three Golden Stars */}
        <g fill="url(#goldRim)" transform="translate(235, 322)">
          {/* Star 1 */}
          <path d="M 12 0 L 14 7 L 21 8 L 15 13 L 17 20 L 12 16 L 7 20 L 9 13 L 3 8 L 10 7 Z" transform="scale(0.7) translate(0, 0)" />
          {/* Star 2 (Center, bigger) */}
          <path d="M 12 0 L 14 7 L 21 8 L 15 13 L 17 20 L 12 16 L 7 20 L 9 13 L 3 8 L 10 7 Z" transform="scale(0.9) translate(16, -4)" />
          {/* Star 3 */}
          <path d="M 12 0 L 14 7 L 21 8 L 15 13 L 17 20 L 12 16 L 7 20 L 9 13 L 3 8 L 10 7 Z" transform="scale(0.7) translate(46, 0)" />
        </g>
      </g>

      {/* GRADUATION CAP (Mortarboard) - Tilted on top-left of Medal */}
      <g filter="url(#shadow-main)" transform="translate(130, 95) rotate(-14)">
        {/* Cap Skull Under-base */}
        <path d="M 70 70 C 70 95, 130 95, 130 70 Z" fill="url(#capUnder)" />

        {/* Cap Diamond Top (3D Isometric) */}
        <polygon points="100,10 185,55 100,95 15,50" fill="url(#capTop)" />
        {/* Specular top sheen */}
        <polygon points="100,18 165,55 100,85 35,50" fill="#ffffff" opacity="0.18" />

        {/* Golden Center Button */}
        <ellipse cx="100" cy="52" rx="8" ry="5" fill="url(#goldRim)" />

        {/* Flowing Golden Silk Tassel */}
        <path
          d="M 100 52 C 120 54, 150 75, 155 105 C 158 120, 162 135, 160 148"
          fill="none"
          stroke="url(#goldRim)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Tassel Brush / Ring */}
        <ellipse cx="160" cy="148" rx="4" ry="2.5" fill="url(#goldRim)" />
        <path d="M 156 150 L 153 172 C 158 175, 164 175, 167 172 L 164 150 Z" fill="url(#goldRim)" />
      </g>

      {/* FOREGROUND 3D RIBBON SWOOSH (Loops in front of medal) */}
      <path
        d="M 95 385 C 130 420, 210 435, 290 410 C 370 385, 430 300, 390 230 C 375 200, 330 185, 300 205"
        fill="none"
        stroke="url(#ribbonMain)"
        strokeWidth="16"
        strokeLinecap="round"
        filter="url(#shadow-subtle)"
      />

      {/* 4 CORE IELTS SKILL FLOATING CHIPS / PILLS */}

      {/* Skill 1: 🎧 LISTENING (Top Right) */}
      <g filter="url(#shadow-pill)" transform="translate(370, 75) rotate(6)">
        <rect x="0" y="0" width="128" height="42" rx="21" fill="url(#medalFace)" stroke="#ffffff" strokeWidth="2" />
        <circle cx="21" cy="21" r="14" fill="url(#spherePeach)" />
        {/* Headphone Icon */}
        <path
          d="M 16 23 V 20 C 16 17.2, 18.2 15, 21 15 C 23.8 15, 26 17.2, 26 20 V 23 M 15 21 H 17 V 25 H 15 Z M 25 21 H 27 V 25 H 25 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <text
          x="44"
          y="26"
          fill="#5a1d2b"
          fontSize="12.5"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.4"
        >
          Listening
        </text>
      </g>

      {/* Skill 2: 📖 READING (Mid Right) */}
      <g filter="url(#shadow-pill)" transform="translate(375, 205) rotate(-5)">
        <rect x="0" y="0" width="122" height="42" rx="21" fill="url(#medalFace)" stroke="#ffffff" strokeWidth="2" />
        <circle cx="21" cy="21" r="14" fill="url(#sphereRose)" />
        {/* Book Icon */}
        <path
          d="M 16 17 C 18 16.5, 20 17, 21 18 C 22 17, 24 16.5, 26 17 V 25 C 24 24.5, 22 25, 21 26 C 20 25, 18 24.5, 16 25 Z M 21 18 V 26"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <text
          x="44"
          y="26"
          fill="#5a1d2b"
          fontSize="12.5"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.4"
        >
          Reading
        </text>
      </g>

      {/* Skill 3: ✍️ WRITING (Lower Left) */}
      <g filter="url(#shadow-pill)" transform="translate(25, 345) rotate(-8)">
        <rect x="0" y="0" width="118" height="42" rx="21" fill="url(#medalFace)" stroke="#ffffff" strokeWidth="2" />
        <circle cx="21" cy="21" r="14" fill="url(#spherePlum)" />
        {/* Quill / Pen Icon */}
        <path
          d="M 24 15 C 21 17, 19 20, 18 24 L 20 25 L 25 18 Z M 18 24 L 16 27 L 19 26"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="44"
          y="26"
          fill="#5a1d2b"
          fontSize="12.5"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.4"
        >
          Writing
        </text>
      </g>

      {/* Skill 4: 🎙️ SPEAKING (Upper Left) */}
      <g filter="url(#shadow-pill)" transform="translate(35, 175) rotate(8)">
        <rect x="0" y="0" width="126" height="42" rx="21" fill="url(#medalFace)" stroke="#ffffff" strokeWidth="2" />
        <circle cx="21" cy="21" r="14" fill="url(#sphereGold)" />
        {/* Mic Icon */}
        <path
          d="M 21 15 C 19.5 15, 18.5 16, 18.5 17.5 V 21 C 18.5 22.5, 19.5 23.5, 21 23.5 C 22.5 23.5, 23.5 22.5, 23.5 21 V 17.5 C 23.5 16, 22.5 15, 21 15 Z M 16.5 20 C 16.5 22.5, 18.5 24.5, 21 24.5 C 23.5 24.5, 25.5 22.5, 25.5 20 M 21 24.5 V 27 M 18.5 27 H 23.5"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <text
          x="44"
          y="26"
          fill="#5a1d2b"
          fontSize="12.5"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.4"
        >
          Speaking
        </text>
      </g>

      {/* FOREGROUND ACCENT SPHERES */}
      {/* Large Soft Pink 3D Sphere (Left Foreground) */}
      <g filter="url(#shadow-main)">
        <circle cx="115" cy="425" r="42" fill="url(#sphereRose)" />
      </g>

      {/* Creamy Mini Sphere (Center-Right Foreground) */}
      <g filter="url(#shadow-subtle)">
        <circle cx="345" cy="435" r="18" fill="url(#spherePeach)" />
      </g>

      {/* GOLDEN MAGIC SPARKLES (The IELTS Spells touch) */}
      <g fill="url(#goldRim)">
        {/* Sparkle 1 */}
        <path d="M 125 55 Q 125 65 135 65 Q 125 65 125 75 Q 125 65 115 65 Q 125 65 125 55 Z" />
        {/* Sparkle 2 */}
        <path d="M 445 115 Q 445 123 453 123 Q 445 123 445 131 Q 445 123 437 123 Q 445 123 445 115 Z" />
        {/* Sparkle 3 */}
        <path d="M 330 160 Q 330 166 336 166 Q 330 166 330 172 Q 330 166 324 166 Q 330 166 330 160 Z" />
        {/* Sparkle 4 */}
        <path d="M 215 440 Q 215 446 221 446 Q 215 446 215 452 Q 215 446 209 446 Q 215 446 215 440 Z" />
      </g>
    </svg>
  );
}
