'use client';

/**
 * SakanyLogo — The official سَكني logo.
 * A house + graduation cap forming the letter "M".
 * Teal green (#0d9488) body  ·  Golden amber (#f59e0b) window & tassel.
 *
 * Props:
 *   size   – overall height in px (default 40)
 *   color  – override the main teal color
 *   style  – extra inline styles
 */
export default function SakanyLogo({ size = 40, color, style = {} }) {
  const mainColor = color || '#0d9488';
  const accentColor = '#f59e0b';
  const height = size;
  const width = Math.round(height * (100 / 90)); // Maintain aspect ratio

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 90"
      width={width}
      height={height}
      fill="none"
      style={{ flexShrink: 0, ...style }}
      aria-label="شعار سَكني"
    >
      {/* Chimney */}
      <path
        d="M 28 28 L 28 17 L 34 17 L 34 24"
        stroke={mainColor}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Main outer frame (Roof & Legs of M) */}
      <path
        d="M 22 78 L 22 44 L 10 40 L 50 15 L 90 40 L 78 44 L 78 78"
        stroke={mainColor}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner M-curve (skullcap bottom) */}
      <path
        d="M 22 44 C 32 46, 40 56, 50 56 C 60 56, 68 46, 78 44"
        stroke={mainColor}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Arched Window (Golden Amber) */}
      <path
        d="M 44 36 L 44 31 A 6 6 0 0 1 56 31 L 56 36 Z"
        fill={accentColor}
      />

      {/* Window panes dividers (Teal Green) */}
      <line x1="50" y1="25" x2="50" y2="36" stroke={mainColor} strokeWidth="1.5" />
      <line x1="44" y1="31" x2="56" y2="31" stroke={mainColor} strokeWidth="1.5" />

      {/* Graduation Tassel (Golden Amber) */}
      {/* Tassel cord */}
      <path
        d="M 81 41 L 87 54"
        stroke={accentColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Tassel ring/bead */}
      <circle cx="87" cy="56" r="3" fill={accentColor} />
      {/* Tassel brush */}
      <path
        d="M 85 59 L 89 59 L 90 68 L 84 68 Z"
        fill={accentColor}
      />
    </svg>
  );
}
