import { useMemo } from 'react'
import sharkLogo from '../imports/gamingshark3d-cutout.png'

type BitProps = { className?: string; style?: React.CSSProperties }

// Small pixel-art game bits that drift across the arcade backdrop.
function PixelHeart({ className, style }: BitProps) {
  return (
    <svg viewBox="0 0 14 12" className={className} style={style} aria-hidden="true">
      <path
        d="M1 2h3v1h2v1h2V3h2V2h3v4h-1v1h-1v1h-1v1h-1v1h-1v1h-1v-1H6V9H5V8H4V7H3V6H2V5H1Z"
        fill="#ff4b4d"
      />
    </svg>
  )
}

function TetrisL({ className, style }: BitProps) {
  return (
    <svg viewBox="0 0 12 12" className={className} style={style} aria-hidden="true">
      <path d="M0 0h4v8h4v4H0Z" fill="#38bdf8" stroke="#0c4a6e" strokeWidth=".8" />
    </svg>
  )
}

function TetrisS({ className, style }: BitProps) {
  return (
    <svg viewBox="0 0 12 8" className={className} style={style} aria-hidden="true">
      <path d="M4 0h8v4H8v4H0V4h4Z" fill="#4ade80" stroke="#14532d" strokeWidth=".8" />
    </svg>
  )
}

function TetrisT({ className, style }: BitProps) {
  return (
    <svg viewBox="0 0 12 8" className={className} style={style} aria-hidden="true">
      <path d="M0 0h12v4H8v4H4V4H0Z" fill="#c084fc" stroke="#581c87" strokeWidth=".8" />
    </svg>
  )
}

function TetrisO({ className, style }: BitProps) {
  return (
    <svg viewBox="0 0 8 8" className={className} style={style} aria-hidden="true">
      <path d="M0 0h8v8H0Z" fill="#fb923c" stroke="#7c2d12" strokeWidth=".8" />
    </svg>
  )
}

function Coin({ className, style }: BitProps) {
  return (
    <svg viewBox="0 0 12 12" className={className} style={style} aria-hidden="true">
      <circle cx="6" cy="6" r="5.4" fill="#facc15" stroke="#a16207" strokeWidth=".9" />
      <path d="M6 3v6M4.4 4.2h3.2" stroke="#a16207" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

const BIT_COMPONENTS = [PixelHeart, TetrisL, TetrisS, TetrisT, TetrisO, Coin]

type BitSpec = {
  Comp: (props: BitProps) => React.JSX.Element
  left: number
  top: number
  size: number
  floatDur: number
  floatDelay: number
  fadeDur: number
  fadeDelay: number
  tilt: number
}

// Random positions/timings, generated once per mount so every visit looks
// a little different.
function useRandomBits(count: number): BitSpec[] {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        Comp: BIT_COMPONENTS[i % BIT_COMPONENTS.length],
        left: 2 + Math.random() * 94,
        top: 4 + Math.random() * 82,
        size: 14 + Math.random() * 18,
        floatDur: 3.5 + Math.random() * 3,
        floatDelay: -Math.random() * 6,
        fadeDur: 6 + Math.random() * 9,
        fadeDelay: -Math.random() * 12,
        tilt: -14 + Math.random() * 28,
      })),
    [count],
  )
}

// Full-bleed arcade backdrop for the hero section: perspective grid floor,
// glow, scanline and randomly appearing game bits. Position it inside a
// `relative isolate` section — it fills the whole area behind the content.
export default function ArcadeBackdrop() {
  const bits = useRandomBits(14)
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="hero-shark-glow absolute right-[4%] top-1/2 size-[560px] -translate-y-1/2 rounded-full bg-[#ff4b4d] opacity-20 blur-3xl" />
      <div className="hero-grid-floor" />
      {bits.map((bit, index) => (
        <span
          key={index}
          className="hero-bit-fade absolute"
          style={{ left: `${bit.left}%`, top: `${bit.top}%`, animationDuration: `${bit.fadeDur}s`, animationDelay: `${bit.fadeDelay}s` }}
        >
          <bit.Comp
            className="hero-bit"
            style={{
              width: bit.size,
              animationDuration: `${bit.floatDur}s`,
              animationDelay: `${bit.floatDelay}s`,
              ['--tilt' as never]: `${bit.tilt}deg`,
            }}
          />
        </span>
      ))}
      <div className="hero-scanline" />
      <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,.7)]" />
    </div>
  )
}

// The Gaming Shark logo floating free — no frame, no card.
export function FloatingShark() {
  return (
    <img
      src={sharkLogo}
      alt="Gaming Shark — the SharksGames mascot biting a game controller"
      className="hero-shark w-full select-none"
      draggable={false}
    />
  )
}
