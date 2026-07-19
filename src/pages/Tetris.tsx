import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import FullscreenButton from '../components/FullscreenButton'
import { ArrowIcon } from '../components/icons'
import {
  clearLines,
  COLS,
  dropPosition,
  fits,
  levelFor,
  lineScore,
  lockPiece,
  moved,
  PIECE_COLORS,
  pieceCells,
  randomShape,
  rotated,
  ROWS,
  spawnPiece,
  speedMs,
  TETRIS_START_LEVEL,
  type Piece,
  type TetrisDifficulty,
} from '../games/tetris/engine'

const BEST_KEY = 'sg-tetris-best'
const DIFFICULTIES: TetrisDifficulty[] = ['Easy', 'Classic', 'Hard']

function parseDifficulty(value: string | null): TetrisDifficulty {
  return DIFFICULTIES.includes(value as TetrisDifficulty) ? (value as TetrisDifficulty) : 'Classic'
}

function readBest(): number {
  if (typeof localStorage === 'undefined') return 0
  const stored = Number(localStorage.getItem(BEST_KEY))
  return Number.isFinite(stored) ? stored : 0
}

type TState = {
  board: number[]
  current: Piece
  next: number
  score: number
  lines: number
  startLevel: number
  over: boolean
}

function freshGame(startLevel: number): TState {
  return {
    board: new Array(COLS * ROWS).fill(0),
    current: spawnPiece(randomShape()),
    next: randomShape(),
    score: 0,
    lines: 0,
    startLevel,
    over: false,
  }
}

/** Advance one gravity step: fall, or lock + clear + spawn. */
function tick(s: TState): TState {
  if (s.over) return s
  const fallen = { ...s.current, y: s.current.y + 1 }
  if (fits(s.board, fallen)) return { ...s, current: fallen }
  const locked = lockPiece(s.board, s.current)
  if (locked === null) return { ...s, over: true }
  const { board, cleared } = clearLines(locked)
  const level = levelFor(s.startLevel, s.lines)
  const nextPiece = spawnPiece(s.next)
  const over = !fits(board, nextPiece)
  return {
    ...s,
    board,
    current: nextPiece,
    next: randomShape(),
    score: s.score + lineScore(cleared, level),
    lines: s.lines + cleared,
    over,
  }
}

export default function Tetris() {
  const [searchParams, setSearchParams] = useSearchParams()
  const difficulty = parseDifficulty(searchParams.get('difficulty'))
  const startLevel = TETRIS_START_LEVEL[difficulty]

  const [game, setGame] = useState<TState>(() => freshGame(startLevel))
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [best, setBest] = useState(readBest)

  const level = levelFor(game.startLevel, game.lines)

  const restart = useCallback((withStartLevel: number) => {
    setGame(freshGame(withStartLevel))
    setRunning(false)
    setPaused(false)
  }, [])

  // Difficulty change resets the well.
  useEffect(() => {
    restart(TETRIS_START_LEVEL[difficulty])
  }, [difficulty, restart])

  // Gravity.
  useEffect(() => {
    if (!running || paused || game.over) return
    const id = setInterval(() => setGame((s) => tick(s)), speedMs(level))
    return () => clearInterval(id)
  }, [running, paused, game.over, level])

  // Best score.
  useEffect(() => {
    if (game.score > best) {
      setBest(game.score)
      if (typeof localStorage !== 'undefined') localStorage.setItem(BEST_KEY, String(game.score))
    }
  }, [game.score, best])

  const act = useCallback(
    (action: 'left' | 'right' | 'down' | 'rotate' | 'drop') => {
      if (!running || paused) return
      setGame((s) => {
        if (s.over) return s
        switch (action) {
          case 'left': return { ...s, current: moved(s.board, s.current, -1, 0) }
          case 'right': return { ...s, current: moved(s.board, s.current, 1, 0) }
          case 'rotate': return { ...s, current: rotated(s.board, s.current) }
          case 'down': {
            const fallen = { ...s.current, y: s.current.y + 1 }
            return fits(s.board, fallen) ? { ...s, current: fallen, score: s.score + 1 } : tick(s)
          }
          case 'drop': {
            const landed = dropPosition(s.board, s.current)
            const gain = landed.y - s.current.y
            return tick({ ...s, current: landed, score: s.score + gain * 2 })
          }
        }
      })
    },
    [running, paused],
  )

  // Keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, 'left' | 'right' | 'down' | 'rotate' | 'drop'> = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'rotate', ' ': 'drop',
        a: 'left', d: 'right', s: 'down', w: 'rotate',
      }
      if (e.key === 'p' || e.key === 'P') {
        if (running && !game.over) setPaused((v) => !v)
        return
      }
      const action = map[e.key]
      if (!action) return
      e.preventDefault()
      act(action)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [act, running, game.over])

  // Render helpers: locked board + current piece + ghost.
  const cells = [...game.board]
  const ghost = running && !game.over ? dropPosition(game.board, game.current) : null
  const ghostCells = new Set<number>()
  if (ghost) {
    for (const [x, y] of pieceCells(ghost)) if (y >= 0) ghostCells.add(y * COLS + x)
  }
  if (running && !game.over) {
    for (const [x, y] of pieceCells(game.current)) if (y >= 0) cells[y * COLS + x] = game.current.shape + 1
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-68px)] max-w-[1240px] px-5 py-8 lg:px-8 lg:py-12">
      {/* Ad slot */}
      <div className="mb-6 flex items-center justify-center gap-3 border-2 border-dashed border-[var(--line)] bg-[var(--surface-soft)] py-3 text-center font-mono text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">
        <span className="size-1.5 bg-[var(--accent)]" /> Ad space — designed to stay out of your way
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/" className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)] transition hover:text-[var(--accent)]">
            <span className="rotate-180"><ArrowIcon /></span> Back to games
          </Link>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Tetris</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Score</div>
            <div className="font-display text-xl font-bold tabular-nums">{game.score}</div>
          </div>
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Best</div>
            <div className="font-display text-xl font-bold tabular-nums">{best}</div>
          </div>
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Lines</div>
            <div className="font-display text-xl font-bold tabular-nums">{game.lines}</div>
          </div>
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Level</div>
            <div className="font-display text-xl font-bold tabular-nums">{level}</div>
          </div>
          <FullscreenButton />
        </div>
      </div>

      {/* Difficulty tabs — starting level, like the Game Boy level select */}
      <div className="anim-outline anim-outline-slow mb-6 inline-flex border-2 border-[var(--line)] bg-[var(--surface)] p-1 text-sm font-bold">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => setSearchParams({ difficulty: d })}
            className={`px-4 py-1.5 font-display text-xs uppercase transition ${difficulty === d ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}
          >
            {d}
            <span className="ml-1.5 font-mono text-[9px] opacity-70">L{TETRIS_START_LEVEL[d]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        {/* Well */}
        <div className="anim-outline relative mx-auto w-full max-w-[340px]">
          <div
            className="grid border-2 border-[var(--ink)] bg-[#0b0b0e] p-1 shadow-[0_20px_60px_rgba(0,0,0,.12)]"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
            role="application"
            aria-label="Tetris well"
          >
            {cells.map((value, index) => (
              <span
                key={index}
                className="aspect-square border-[0.5px] border-white/5"
                style={{
                  background: value > 0 ? PIECE_COLORS[value - 1] : ghostCells.has(index) ? 'rgba(255,255,255,.09)' : 'transparent',
                  boxShadow: value > 0 ? 'inset -2px -2px 0 rgba(0,0,0,.35), inset 2px 2px 0 rgba(255,255,255,.25)' : undefined,
                }}
              />
            ))}
          </div>

          {/* Start / pause / game over overlays */}
          {(!running || paused || game.over) && (
            <div className="absolute inset-0 grid place-items-center bg-[#0b0b0e]/80 backdrop-blur-[2px]">
              <div className="border-2 border-[var(--accent)] bg-[var(--surface)] px-8 py-7 text-center">
                {game.over ? (
                  <>
                    <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">Game over</p>
                    <p className="mt-2 font-display text-2xl font-bold uppercase tracking-tight">The well is full 🦈</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">Score {game.score} · {game.lines} lines · level {level}</p>
                    <button onClick={() => restart(startLevel)} className="retro-btn mt-5 bg-[var(--accent)] px-6 py-2.5 font-display text-xs font-bold uppercase text-white">
                      Try again ↗
                    </button>
                  </>
                ) : paused ? (
                  <>
                    <p className="font-display text-2xl font-bold uppercase tracking-tight">Paused</p>
                    <button onClick={() => setPaused(false)} className="retro-btn mt-5 bg-[var(--accent)] px-6 py-2.5 font-display text-xs font-bold uppercase text-white">
                      Continue ↗
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">{difficulty} · level {startLevel}</p>
                    <p className="mt-2 font-display text-2xl font-bold uppercase tracking-tight">Ready?</p>
                    <button onClick={() => setRunning(true)} className="retro-btn mt-5 bg-[var(--accent)] px-6 py-2.5 font-display text-xs font-bold uppercase text-white">
                      Start ↗
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-5">
          {/* Next piece */}
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Next</p>
            <div className="mt-2 grid w-fit grid-cols-4 gap-[2px]">
              {Array.from({ length: 16 }, (_, i) => {
                const x = i % 4
                const y = Math.floor(i / 4)
                const on = pieceCells(spawnPiece(game.next)).some(([cx, cy]) => cx - 3 === x && cy + 1 === y)
                return <span key={i} className="size-5" style={{ background: on ? PIECE_COLORS[game.next] : 'var(--surface-soft)' }} />
              })}
            </div>
          </div>

          {/* Touch controls */}
          <div className="grid grid-cols-5 gap-2 lg:hidden">
            {([['◀', 'left'], ['▼', 'down'], ['▶', 'right'], ['⟳', 'rotate'], ['⤓', 'drop']] as const).map(([label, action]) => (
              <button key={action} onPointerDown={() => act(action)} className="border-2 border-[var(--ink)] bg-[var(--surface)] py-3 font-display text-lg font-bold" aria-label={action}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2.5">
            <button onClick={() => (running && !game.over ? setPaused((v) => !v) : undefined)} disabled={!running || game.over} className="retro-btn flex-1 bg-[var(--surface)] px-3 py-3 font-display text-[11px] font-bold uppercase disabled:opacity-40">
              {paused ? 'Continue' : 'Pause'}
            </button>
            <button onClick={() => restart(startLevel)} className="retro-btn flex-1 bg-[var(--accent)] px-3 py-3 font-display text-[11px] font-bold uppercase text-white">
              New game
            </button>
          </div>

          <p className="border-2 border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
            <span className="font-bold text-[var(--ink)]">Tip:</span> arrows move, ↑ rotates, ↓ drops faster, Space slams it down, P pauses. Clear 4 lines at once for the big Tetris bonus — every 10 lines the speed climbs. 🦈
          </p>
        </div>
      </div>
    </main>
  )
}
