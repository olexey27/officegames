import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import FullscreenButton from '../components/FullscreenButton'
import { ArrowIcon } from '../components/icons'
import {
  adjacentCount,
  floodReveal,
  MS_CONFIG,
  placeMines,
  type MsDifficulty,
} from '../games/minesweeper/engine'

const DIFFICULTIES: MsDifficulty[] = ['Beginner', 'Intermediate', 'Expert']

// Number colors tuned to the SharksGames palette.
const NUMBER_COLORS: Record<number, string> = {
  1: '#38bdf8', 2: '#4ade80', 3: '#ff4b4d', 4: '#c084fc',
  5: '#f59e0b', 6: '#2dd4bf', 7: '#f472b6', 8: '#a1a1aa',
}

type Status = 'idle' | 'playing' | 'exploding' | 'lost' | 'won'

function parseDifficulty(value: string | null): MsDifficulty {
  return DIFFICULTIES.includes(value as MsDifficulty) ? (value as MsDifficulty) : 'Beginner'
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Full-screen blast shown the moment a mine goes off.
function Explosion() {
  const bits: { left: string; top: string; delay: string; size: string }[] = [
    { left: '18%', top: '26%', delay: '0.05s', size: 'text-5xl' },
    { left: '74%', top: '20%', delay: '0.12s', size: 'text-6xl' },
    { left: '28%', top: '68%', delay: '0.18s', size: 'text-6xl' },
    { left: '68%', top: '64%', delay: '0.08s', size: 'text-5xl' },
    { left: '48%', top: '14%', delay: '0.22s', size: 'text-4xl' },
    { left: '10%', top: '48%', delay: '0.15s', size: 'text-4xl' },
    { left: '86%', top: '44%', delay: '0.2s', size: 'text-5xl' },
  ]
  return (
    <div className="pointer-events-none fixed inset-0 z-50" aria-hidden="true">
      <div className="explosion-flash absolute inset-0" />
      <div className="absolute inset-0 grid place-items-center">
        <span className="explosion-boom text-[clamp(6rem,28vw,20rem)] leading-none">💥</span>
      </div>
      {bits.map((bit, i) => (
        <span key={i} className={`explosion-bit absolute ${bit.size}`} style={{ left: bit.left, top: bit.top, animationDelay: bit.delay }}>
          {i % 2 === 0 ? '🔥' : '💥'}
        </span>
      ))}
    </div>
  )
}

export default function Minesweeper() {
  const [searchParams, setSearchParams] = useSearchParams()
  const difficulty = parseDifficulty(searchParams.get('difficulty'))
  const { rows, cols, mines } = MS_CONFIG[difficulty]
  const total = rows * cols

  const [mineSet, setMineSet] = useState<Set<number> | null>(null) // placed on first reveal
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set())
  const [flagged, setFlagged] = useState<Set<number>>(() => new Set())
  const [status, setStatus] = useState<Status>('idle')
  const [hitMine, setHitMine] = useState<number | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [flagMode, setFlagMode] = useState(false)

  const explodeTimer = useRef<number | null>(null)

  const newGame = useCallback(() => {
    if (explodeTimer.current !== null) {
      window.clearTimeout(explodeTimer.current)
      explodeTimer.current = null
    }
    setMineSet(null)
    setRevealed(new Set())
    setFlagged(new Set())
    setStatus('idle')
    setHitMine(null)
    setSeconds(0)
  }, [])

  // Reset when the difficulty in the URL changes.
  useEffect(() => {
    newGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty])

  // Timer runs while playing.
  useEffect(() => {
    if (status !== 'playing') return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [status])

  const winCheck = useCallback(
    (nextRevealed: Set<number>, currentMines: Set<number>) => {
      if (nextRevealed.size === total - currentMines.size) {
        setStatus('won')
        return true
      }
      return false
    },
    [total],
  )

  const reveal = useCallback(
    (index: number) => {
      if (status === 'exploding' || status === 'lost' || status === 'won') return
      if (flagged.has(index) || revealed.has(index)) return

      // First click: place mines with this cell (and ring) kept safe.
      let currentMines = mineSet
      if (currentMines === null) {
        currentMines = placeMines(rows, cols, mines, index)
        setMineSet(currentMines)
        setStatus('playing')
      }

      if (currentMines.has(index)) {
        // Boom. Reveal every mine and run the full-screen explosion.
        setHitMine(index)
        setStatus('exploding')
        setRevealed((prev) => {
          const next = new Set(prev)
          for (const m of currentMines!) next.add(m)
          return next
        })
        explodeTimer.current = window.setTimeout(() => {
          setStatus('lost')
          explodeTimer.current = null
        }, 1200)
        return
      }

      const found = floodReveal(index, currentMines, rows, cols, revealed, flagged)
      const next = new Set(revealed)
      for (const f of found) next.add(f)
      setRevealed(next)
      winCheck(next, currentMines)
    },
    [status, flagged, revealed, mineSet, rows, cols, mines, winCheck],
  )

  const toggleFlag = useCallback(
    (index: number) => {
      if (status === 'exploding' || status === 'lost' || status === 'won') return
      if (revealed.has(index)) return
      setFlagged((prev) => {
        const next = new Set(prev)
        if (next.has(index)) next.delete(index)
        else next.add(index)
        return next
      })
    },
    [status, revealed],
  )

  const onCellClick = (index: number) => {
    if (flagMode) toggleFlag(index)
    else reveal(index)
  }

  const onCellContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    toggleFlag(index)
  }

  const flagsLeft = mines - flagged.size
  const locked = status === 'exploding' || status === 'lost' || status === 'won'
  const cellText = cols >= 30 ? 'text-[10px] sm:text-xs' : cols >= 16 ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
  const boardMax = cols >= 30 ? 'max-w-[900px]' : cols >= 16 ? 'max-w-[560px]' : 'max-w-[420px]'

  return (
    <main className={`mx-auto min-h-[calc(100vh-68px)] max-w-[1240px] px-5 py-8 lg:px-8 lg:py-12 ${status === 'exploding' ? 'explosion-shake' : ''}`}>
      {status === 'exploding' && <Explosion />}

      {/* Ad slot — kept in the layout so it feels native, not bolted on. */}
      <div className="mb-6 flex items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] py-3 text-center font-mono text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">
        <span className="size-1.5 rounded-full bg-[var(--accent)]" /> Ad space — designed to stay out of your way
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/" className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)] transition hover:text-[var(--accent)]">
            <span className="rotate-180"><ArrowIcon /></span> Back to games
          </Link>
          <h1 className="font-display text-4xl font-bold tracking-[-.06em] sm:text-5xl">Minesweeper</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Mines</div>
            <div className="font-display text-xl font-bold tabular-nums">{flagsLeft}</div>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Time</div>
            <div className="font-display text-xl font-bold tabular-nums">{formatTime(seconds)}</div>
          </div>
          <FullscreenButton />
        </div>
      </div>

      {/* Difficulty tabs */}
      <div className="anim-outline anim-outline-slow mb-6 inline-flex rounded-full border border-[var(--line)] bg-[var(--surface)] p-1 text-sm font-bold">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => setSearchParams({ difficulty: d })}
            className={`rounded-full px-4 py-1.5 transition ${difficulty === d ? 'bg-[var(--accent)] text-white shadow-[0_6px_18px_var(--glow)]' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}
          >
            {d}
            <span className="ml-1.5 font-mono text-[9px] opacity-70">{MS_CONFIG[d].mines}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        {/* Board */}
        <div className={`anim-outline relative w-full rounded-2xl ${boardMax} mx-auto lg:mx-0`}>
          <div className="overflow-x-auto rounded-2xl border-2 border-[var(--ink)] bg-[var(--surface)] p-2 shadow-[0_20px_60px_rgba(0,0,0,.12)]">
            <div
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(${cols >= 30 ? '20px' : '24px'}, 1fr))` }}
              onContextMenu={(e) => e.preventDefault()}
            >
              {Array.from({ length: total }, (_, index) => {
                const isRevealed = revealed.has(index)
                const isFlagged = flagged.has(index)
                const isMine = mineSet?.has(index) ?? false
                const count = isRevealed && !isMine && mineSet ? adjacentCount(index, mineSet, rows, cols) : 0

                let content: React.ReactNode = null
                if (isFlagged && !isRevealed) content = '🚩'
                else if (isRevealed && isMine) content = '💣'
                else if (isRevealed && count > 0) content = <span style={{ color: NUMBER_COLORS[count] }}>{count}</span>

                let cellClass = 'bg-[var(--surface-soft)] border-[var(--line)] hover:border-[var(--accent)]'
                if (isRevealed) {
                  cellClass = isMine
                    ? index === hitMine
                      ? 'bg-[color:var(--accent)]/60 border-[var(--accent)]'
                      : 'bg-[color:var(--accent)]/20 border-[var(--accent)]/40'
                    : 'bg-[var(--canvas)] border-transparent'
                }

                return (
                  <button
                    key={index}
                    onClick={() => onCellClick(index)}
                    onContextMenu={(e) => onCellContextMenu(e, index)}
                    disabled={locked}
                    className={`grid aspect-square select-none place-items-center rounded-[5px] border font-mono font-bold leading-none transition-colors ${cellText} ${cellClass}`}
                    aria-label={isRevealed ? (isMine ? 'Mine' : `Revealed, ${count} adjacent`) : isFlagged ? 'Flagged cell' : 'Hidden cell'}
                  >
                    {content}
                  </button>
                )
              })}
            </div>
          </div>

          {status === 'won' && (
            <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[color:var(--canvas)]/80 backdrop-blur-sm">
              <div className="rounded-2xl border border-[var(--accent)] bg-[var(--surface)] px-8 py-7 text-center shadow-[0_20px_60px_var(--glow)]">
                <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">Board cleared</p>
                <p className="mt-2 font-display text-3xl font-bold tracking-[-.05em]">Mine-free waters! 🦈</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{difficulty} · {formatTime(seconds)}</p>
                <button onClick={newGame} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[var(--accent-deep)]">
                  Play again <ArrowIcon />
                </button>
              </div>
            </div>
          )}

          {status === 'lost' && (
            <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[color:var(--canvas)]/85 backdrop-blur-sm">
              <div className="rounded-2xl border border-[var(--accent)] bg-[var(--surface)] px-8 py-7 text-center shadow-[0_20px_60px_var(--glow)]">
                <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">Boom</p>
                <p className="mt-2 font-display text-3xl font-bold tracking-[-.05em]">You found the mine 💥</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{formatTime(seconds)} survived on {difficulty}.</p>
                <button onClick={newGame} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[var(--accent-deep)]">
                  Try again <ArrowIcon />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-5">
          <button
            onClick={() => setFlagMode((v) => !v)}
            className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${flagMode ? 'border-[var(--accent)] bg-[color:var(--accent)]/15 text-[var(--accent)]' : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]'}`}
          >
            🚩 Flag mode {flagMode ? 'ON' : 'OFF'}
          </button>

          <button onClick={newGame} className="anim-outline rounded-xl bg-[var(--accent)] px-3 py-3 text-sm font-extrabold text-white shadow-[0_12px_28px_var(--glow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-deep)]">
            New game
          </button>

          <p className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
            <span className="font-bold text-[var(--ink)]">Tip:</span> left-click reveals, right-click flags (or use Flag mode on mobile). Numbers show how many mines touch that cell. The first click is always safe. 💣
          </p>
        </div>
      </div>
    </main>
  )
}
