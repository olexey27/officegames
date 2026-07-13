import sharkLogo from '../imports/gamingshark3d.png'

// Small pixel-art style game bits that float around the shark.
function PixelHeart({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 14 12" className={className} style={style} aria-hidden="true">
      <path
        d="M1 2h3v1h2v1h2V3h2V2h3v4h-1v1h-1v1h-1v1h-1v1h-1v1h-1v-1H6V9H5V8H4V7H3V6H2V5H1Z"
        fill="#ff4b4d"
      />
    </svg>
  )
}

function TetrisL({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 12 12" className={className} style={style} aria-hidden="true">
      <path d="M0 0h4v8h4v4H0Z" fill="#38bdf8" stroke="#0c4a6e" strokeWidth=".8" />
    </svg>
  )
}

function TetrisS({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 12 8" className={className} style={style} aria-hidden="true">
      <path d="M4 0h8v4H8v4H0V4h4Z" fill="#4ade80" stroke="#14532d" strokeWidth=".8" />
    </svg>
  )
}

function Coin({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 12 12" className={className} style={style} aria-hidden="true">
      <circle cx="6" cy="6" r="5.4" fill="#facc15" stroke="#a16207" strokeWidth=".9" />
      <path d="M6 3v6M4.4 4.2h3.2" stroke="#a16207" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

// Hero visual: a dark arcade "screen" with the Gaming Shark logo floating over
// an animated perspective grid, plus drifting game bits and a scanline.
// The screen stays dark in both themes (screens are dark), which also makes
// the black-background shark render seamlessly.
export default function HeroScreen() {
  return (
    <div className="relative aspect-[10/9] w-full overflow-hidden rounded-[22px] border border-[#2b2b30] bg-[#0b0b0e] sm:aspect-[10/8.4]">
      {/* Ambient glow + animated grid floor */}
      <div className="absolute left-1/2 top-[46%] size-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff4b4d] opacity-25 blur-3xl hero-shark-glow" />
      <div className="hero-grid-floor" />

      {/* Floating game bits */}
      <PixelHeart className="hero-bit absolute left-[9%] top-[14%] w-7" style={{ animationDelay: '-1.2s', ['--tilt' as never]: '-8deg' }} />
      <TetrisL className="hero-bit absolute right-[10%] top-[12%] w-6" style={{ animationDelay: '-2.6s', ['--tilt' as never]: '10deg' }} />
      <TetrisS className="hero-bit absolute left-[13%] bottom-[20%] w-8" style={{ animationDelay: '-0.6s', ['--tilt' as never]: '6deg' }} />
      <Coin className="hero-bit absolute right-[13%] bottom-[26%] w-5" style={{ animationDelay: '-3.4s', ['--tilt' as never]: '-12deg' }} />

      {/* The shark */}
      <img
        src={sharkLogo}
        alt="Gaming Shark — the SharksGames mascot biting a game controller"
        className="hero-shark absolute left-1/2 top-1/2 w-[86%] -translate-x-1/2 -translate-y-1/2 select-none"
        draggable={false}
      />

      {/* Screen dressing: scanline + vignette + HUD */}
      <div className="hero-scanline" />
      <div className="pointer-events-none absolute inset-0 rounded-[22px] shadow-[inset_0_0_60px_rgba(0,0,0,.65)]" />
      <div className="absolute left-4 top-3 font-mono text-[9px] uppercase tracking-[.18em] text-white/45">▸ insert coffee to continue</div>
      <div className="absolute bottom-3 right-4 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[.15em] text-white/45">
        <span className="size-1.5 animate-pulse rounded-full bg-[#ff4b4d]" /> rec
      </div>
    </div>
  )
}
