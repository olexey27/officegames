// Flat cartoon office scene for the hero: a worker at a desk in front of a
// screen with a coffee. Self-contained SVG (no external assets), so it loads
// instantly and works in light and dark mode. The rounded card behind it uses
// theme variables; the character keeps fixed fills with dark outlines.
export default function OfficeScene() {
  const OUT = '#242321' // outline color (fixed dark — reads on light character)
  return (
    <svg viewBox="0 0 460 400" className="h-auto w-full" role="img" aria-label="An office worker taking a break at their desk with a coffee">
      <g stroke={OUT} strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
        {/* Floor shadow */}
        <ellipse cx="230" cy="372" rx="180" ry="18" fill="rgba(0,0,0,.08)" stroke="none" />

        {/* Chair back */}
        <rect x="150" y="70" width="160" height="180" rx="30" fill="#3a3a40" />
        <rect x="168" y="88" width="124" height="150" rx="20" fill="#4a4a52" />

        {/* ---- Person (behind desk, upper body) ---- */}
        {/* Jacket / torso */}
        <path d="M150 300 Q150 205 230 200 Q310 205 310 300 Z" fill="#c0835a" />
        {/* Lapels + shirt */}
        <path d="M205 208 L230 250 L255 208 Z" fill="#ffffff" />
        <path d="M205 208 L200 262 L228 232 Z" fill="#a86c45" />
        <path d="M255 208 L260 262 L232 232 Z" fill="#a86c45" />
        {/* Tie */}
        <path d="M230 232 L221 246 L230 300 L239 246 Z" fill="#8b8b90" />
        <path d="M224 258 L236 258 M223 272 L237 272 M222 286 L238 286" stroke="#5f5f64" strokeWidth="2.4" />

        {/* Neck */}
        <path d="M216 190 L216 210 Q230 222 244 210 L244 190 Z" fill="#f1c4a2" />

        {/* Head */}
        <path d="M180 130 Q180 78 230 78 Q280 78 280 130 Q280 182 230 186 Q180 182 180 130 Z" fill="#f2c6a4" />
        {/* Ears */}
        <circle cx="181" cy="140" r="9" fill="#f2c6a4" />
        <circle cx="279" cy="140" r="9" fill="#f2c6a4" />
        {/* Hair */}
        <path d="M177 128 Q170 82 210 70 Q230 60 252 70 Q292 82 283 130 Q286 100 262 92 Q250 108 236 96 Q228 112 214 98 Q198 106 190 100 Q176 108 177 128 Z" fill="#6b4a2f" />
        {/* Glasses */}
        <g fill="#cfd3d3">
          <rect x="188" y="124" width="42" height="26" rx="9" />
          <rect x="234" y="124" width="42" height="26" rx="9" />
        </g>
        <path d="M230 137 L234 137 M188 130 L176 128 M276 130 L288 128" stroke={OUT} strokeWidth="2.6" fill="none" />
        {/* Eyes */}
        <path d="M203 137 h13 M247 137 h13" stroke={OUT} strokeWidth="3.4" />
        {/* Brow / neutral mouth */}
        <path d="M214 168 Q230 174 246 168" stroke={OUT} strokeWidth="2.8" fill="none" />

        {/* Arms reaching to the desk */}
        <path d="M158 260 Q150 300 175 322 L205 322 Q200 292 200 262 Z" fill="#c0835a" />
        <path d="M302 260 Q310 300 292 322 L262 322 Q262 300 260 262 Z" fill="#c0835a" />
        {/* Hands */}
        <ellipse cx="188" cy="324" rx="17" ry="12" fill="#f1c4a2" />
        <ellipse cx="286" cy="322" rx="15" ry="11" fill="#f1c4a2" />

        {/* ---- Desk ---- */}
        <rect x="40" y="318" width="380" height="26" rx="8" fill="#b98a5e" />
        <rect x="40" y="318" width="380" height="10" rx="5" fill="#cfa274" />
        {/* Desk legs */}
        <rect x="70" y="344" width="16" height="34" fill="#9c714a" />
        <rect x="374" y="344" width="16" height="34" fill="#9c714a" />

        {/* Keyboard */}
        <rect x="196" y="322" width="90" height="18" rx="4" fill="#e7e6e3" />
        <path d="M204 330 h74 M204 335 h74" stroke="#b9b8b5" strokeWidth="1.6" />

        {/* Monitor on the left */}
        <g>
          <rect x="66" y="240" width="112" height="76" rx="8" fill="#1d1d20" />
          <rect x="76" y="250" width="92" height="56" rx="4" fill="#0f0f11" />
          {/* mini sudoku on screen */}
          <g stroke="#ff4b4d" strokeWidth="1.6" opacity=".9">
            <path d="M76 269 h92 M76 288 h92 M107 250 v56 M138 250 v56" />
          </g>
          <g fill="#f7f6f3" fontFamily="monospace" fontSize="12" fontWeight="700" stroke="none">
            <text x="87" y="264">5</text>
            <text x="149" y="264">3</text>
            <text x="118" y="283">8</text>
            <text x="87" y="302">2</text>
            <text x="149" y="302">9</text>
          </g>
          {/* stand */}
          <rect x="112" y="316" width="20" height="8" fill="#3a3a40" stroke="none" />
          <rect x="98" y="322" width="48" height="6" rx="3" fill="#2a2a2e" />
        </g>

        {/* Coffee mug on the right, with steam */}
        <g>
          <path d="M300 296 h34 v16 a10 10 0 0 1 -10 10 h-14 a10 10 0 0 1 -10 -10 Z" fill="#ff4b4d" />
          <path d="M334 300 q14 2 12 14 q-2 8 -12 8" fill="none" stroke={OUT} strokeWidth="3" />
          <ellipse cx="317" cy="296" rx="17" ry="5" fill="#c53437" />
          <path d="M310 282 q-5 -8 2 -16 M320 282 q5 -8 -2 -16" fill="none" stroke="#b9b8b5" strokeWidth="2.6" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  )
}
