import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import FullscreenButton from '../components/FullscreenButton'
import { ArrowIcon } from '../components/icons'
import { buildDeck, colsFor, pairsFor, timeLimitFor, TOTAL_LEVELS } from '../games/memory/engine'

const UNLOCKED_KEY = 'sg-memory-unlocked'

type Status = 'playing' | 'cleared' | 'failed' | 'trophy'

function readUnlocked(): number {
  if (typeof localStorage === 'undefined') return 1
  const stored = Number(localStorage.getItem(UNLOCKED_KEY))
  return Number.isFinite(stored) && stored >= 1 ? Math.min(stored, TOTAL_LEVELS) : 1
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Memory() {
  const [unlocked, setUnlocked] = useState(readUnlocked)
  const [level, setLevel] = useState(() => readUnlocked())
  const [deck, setDeck] = useState<string[]>(() => buildDeck(readUnlocked()))
  const [matched, setMatched] = useState<Set<number>>(() => new Set())
  const [open, setOpen] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(() => timeLimitFor(readUnlocked()))
  const [status, setStatus] = useState<Status>('playing')
  const [started, setStarted] = useState(false)
  const [restartTick, setRestartTick] = useState(0)

  const flipBackTimer = useRef<number | null>(null)

  // (Re)build the board whenever the level changes or a restart is requested.
  useEffect(() => {
    if (flipBackTimer.current !== null) {
      window.clearTimeout(flipBackTimer.current)
      flipBackTimer.current = null
    }
    setDeck(buildDeck(level))
    setMatched(new Set())
    setOpen([])
    setTimeLeft(timeLimitFor(level))
    setStatus('playing')
    setStarted(false)
  }, [level, restartTick])

  // Countdown — starts with the first card flip, stops at 0 → level failed.
  useEffect(() => {
    if (status !== 'playing' || !started) return
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setStatus('failed')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [status, started])

  // All pairs found → level cleared (or the trophy after the final level).
  useEffect(() => {
    if (status !== 'playing' || deck.length === 0 || matched.size !== deck.length) return
    const next = level >= TOTAL_LEVELS ? 'trophy' : 'cleared'
    setStatus(next)
    const newUnlocked = Math.min(level + 1, TOTAL_LEVELS)
    if (newUnlocked > unlocked) {
      setUnlocked(newUnlocked)
      if (typeof localStorage !== 'undefined') localStorage.setItem(UNLOCKED_KEY, String(newUnlocked))
    }
  }, [matched, deck, status, level, unlocked])

  const flipCard = useCallback(
    (index: number) => {
      if (status !== 'playing' || matched.has(index) || open.includes(index) || open.length >= 2) return
      setStarted(true)
      const nextOpen = [...open, index]
      setOpen(nextOpen)
      if (nextOpen.length === 2) {
        const [a, b] = nextOpen
        if (deck[a] === deck[b]) {
          setMatched((prev) => new Set(prev).add(a).add(b))
          setOpen([])
        } else {
          flipBackTimer.current = window.setTimeout(() => {
            setOpen([])
            flipBackTimer.current = null
          }, 750)
        }
      }
    },
    [status, matched, open, deck],
  )

  const cols = colsFor(deck.length)
  const lowTime = status === 'playing' && timeLeft <= 10
  const faceSize = deck.length > 42 ? 'text-lg sm:text-2xl' : deck.length > 20 ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'

  return (
    <main className="mx-auto min-h-[calc(100vh-68px)] max-w-[1240px] px-5 py-8 lg:px-8 lg:py-12">
      {/* Ad slot — kept in the layout so it feels native, not bolted on. */}
      <div className="mb-6 flex items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] py-3 text-center font-mono text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">
        <span className="size-1.5 rounded-full bg-[var(--accent)]" /> Ad space — designed to stay out of your way
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/" className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)] transition hover:text-[var(--accent)]">
            <span className="rotate-180"><ArrowIcon /></span> Back to games
          </Link>
          <h1 className="font-display text-4xl font-bold tracking-[-.06em] sm:text-5xl">Memory</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Level</div>
            <div className="font-display text-xl font-bold tabular-nums">{level}/{TOTAL_LEVELS}</div>
          </div>
          <div className={`rounded-xl border px-4 py-2 text-center ${lowTime ? 'animate-pulse border-[var(--accent)]' : 'border-[var(--line)]'} bg-[var(--surface)]`}>
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Time</div>
            <div className={`font-display text-xl font-bold tabular-nums ${lowTime ? 'text-[var(--accent)]' : ''}`}>{formatTime(timeLeft)}</div>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Pairs</div>
            <div className="font-display text-xl font-bold tabular-nums">{matched.size / 2}/{pairsFor(level)}</div>
          </div>
          <FullscreenButton />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        {/* Board */}
        <div className="anim-outline relative mx-auto w-full max-w-[560px] rounded-2xl">
          <div
            className="grid gap-1.5 rounded-2xl border-2 border-[var(--ink)] bg-[var(--surface)] p-3 shadow-[0_20px_60px_rgba(0,0,0,.12)] sm:gap-2"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {deck.map((face, index) => {
              const isFlipped = matched.has(index) || open.includes(index)
              return (
                <button
                  key={`${level}-${restartTick}-${index}`}
                  onClick={() => flipCard(index)}
                  className="memory-card aspect-square"
                  aria-label={isFlipped ? `Card: ${face}` : 'Face-down card'}
                  disabled={status !== 'playing'}
                >
                  <div className={`memory-inner ${isFlipped ? 'is-flipped' : ''} ${matched.has(index) ? 'is-matched' : ''}`}>
                    {/* Back of the card (face down) */}
                    <div className="memory-face grid place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] transition-colors hover:border-[var(--accent)]">
                      <span className="font-display text-[10px] font-bold text-[var(--muted)] sm:text-xs">SG</span>
                    </div>
                    {/* Front of the card (revealed) */}
                    <div className={`memory-face memory-back grid place-items-center rounded-lg border ${matched.has(index) ? 'border-[var(--accent)] bg-[color:var(--accent)]/12' : 'border-[var(--line)] bg-[var(--canvas)]'}`}>
                      <span className={faceSize}>{face}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Level cleared */}
          {status === 'cleared' && (
            <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[color:var(--canvas)]/80 backdrop-blur-sm">
              <div className="rounded-2xl border border-[var(--accent)] bg-[var(--surface)] px-8 py-7 text-center shadow-[0_20px_60px_var(--glow)]">
                <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">Level {level} cleared</p>
                <p className="mt-2 font-display text-3xl font-bold tracking-[-.05em]">Sharp memory! 🧠</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{formatTime(timeLimitFor(level) - timeLeft)} used · next: {pairsFor(level + 1)} pairs</p>
                <button onClick={() => setLevel((l) => l + 1)} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[var(--accent-deep)]">
                  Level {level + 1} <ArrowIcon />
                </button>
              </div>
            </div>
          )}

          {/* Time's up */}
          {status === 'failed' && (
            <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[color:var(--canvas)]/85 backdrop-blur-sm">
              <div className="rounded-2xl border border-[var(--accent)] bg-[var(--surface)] px-8 py-7 text-center shadow-[0_20px_60px_var(--glow)]">
                <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">Time&apos;s up</p>
                <p className="mt-2 font-display text-3xl font-bold tracking-[-.05em]">The shark was faster 🦈</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{matched.size / 2} of {pairsFor(level)} pairs found.</p>
                <button onClick={() => setRestartTick((t) => t + 1)} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[var(--accent-deep)]">
                  Retry level {level} <ArrowIcon />
                </button>
              </div>
            </div>
          )}

          {/* All 31 levels beaten — the trophy */}
          {status === 'trophy' && (
            <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[color:var(--canvas)]/90 backdrop-blur-md">
              <div className="rounded-2xl border border-[#facc15] bg-[var(--surface)] px-8 py-8 text-center shadow-[0_20px_80px_rgba(250,204,21,.25)]">
                <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#eab308]">All {TOTAL_LEVELS} levels cleared</p>
                <div className="trophy-pop trophy-glow mt-3 text-7xl sm:text-8xl">🏆</div>
                <p className="mt-4 font-display text-2xl font-bold tracking-[-.05em] sm:text-3xl">Now go find yourself<br />another job.</p>
                <p className="mt-2 text-sm text-[var(--muted)]">Because this one clearly isn&apos;t challenging you. 🦈</p>
                <button
                  onClick={() => { setLevel(1); setRestartTick((t) => t + 1) }}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[var(--accent-deep)]"
                >
                  Start over <ArrowIcon />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-5">
          {/* Level picker within unlocked range */}
          <div className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2">
            <button
              onClick={() => setLevel((l) => Math.max(1, l - 1))}
              disabled={level <= 1}
              className="grid size-10 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] font-bold transition enabled:hover:border-[var(--accent)] disabled:opacity-30"
              aria-label="Previous level"
            >
              ‹
            </button>
            <div className="text-center">
              <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Level select</div>
              <div className="font-display text-lg font-bold">{level} <span className="text-xs text-[var(--muted)]">/ {unlocked} unlocked</span></div>
            </div>
            <button
              onClick={() => setLevel((l) => Math.min(unlocked, l + 1))}
              disabled={level >= unlocked}
              className="grid size-10 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] font-bold transition enabled:hover:border-[var(--accent)] disabled:opacity-30"
              aria-label="Next level"
            >
              ›
            </button>
          </div>

          <button onClick={() => setRestartTick((t) => t + 1)} className="anim-outline rounded-xl bg-[var(--accent)] px-3 py-3 text-sm font-extrabold text-white shadow-[0_12px_28px_var(--glow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-deep)]">
            Restart level
          </button>

          <p className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
            <span className="font-bold text-[var(--ink)]">Tip:</span> the clock starts with your first flip. Every level adds more cards and less time per pair — {TOTAL_LEVELS} levels stand between you and the trophy. 🏆
          </p>
        </div>
      </div>
    </main>
  )
}
