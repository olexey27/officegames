import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import FullscreenButton from '../components/FullscreenButton'
import { ArrowIcon } from '../components/icons'
import {
  COLS,
  newGame,
  OPPOSITE,
  ROWS,
  SNAKE_LEVELS,
  speedFor,
  step,
  type Dir,
  type SnakeLevel,
  type SnakeState,
} from '../games/snake/engine'

const LEVELS: SnakeLevel[] = ['Easy', 'Classic', 'Hard']

function parseLevel(value: string | null): SnakeLevel {
  return LEVELS.includes(value as SnakeLevel) ? (value as SnakeLevel) : 'Classic'
}

function bestKey(level: SnakeLevel): string {
  return `sg-snake-best-${level}`
}

function readBest(level: SnakeLevel): number {
  if (typeof localStorage === 'undefined') return 0
  const stored = Number(localStorage.getItem(bestKey(level)))
  return Number.isFinite(stored) ? stored : 0
}

export default function Snake() {
  const [searchParams, setSearchParams] = useSearchParams()
  const level = parseLevel(searchParams.get('difficulty'))

  const [game, setGame] = useState<SnakeState>(() => newGame(SNAKE_LEVELS[level].wrap))
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [best, setBest] = useState(() => readBest(level))
  const queue = useRef<Dir[]>([])
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const restart = useCallback((forLevel: SnakeLevel) => {
    setGame(newGame(SNAKE_LEVELS[forLevel].wrap))
    setRunning(false)
    setPaused(false)
    queue.current = []
  }, [])

  useEffect(() => {
    restart(level)
    setBest(readBest(level))
  }, [level, restart])

  // Game tick.
  useEffect(() => {
    if (!running || paused || game.over) return
    const id = setInterval(() => {
      setGame((prev) => step(prev, queue.current.shift()))
    }, speedFor(level, game.score))
    return () => clearInterval(id)
  }, [running, paused, game.over, game.score, level])

  // Best score.
  useEffect(() => {
    const score = game.score * 10
    if (score > best) {
      setBest(score)
      if (typeof localStorage !== 'undefined') localStorage.setItem(bestKey(level), String(score))
    }
  }, [game.score, best, level])

  const pushDir = useCallback(
    (dir: Dir) => {
      if (!running || paused || game.over) return
      const last = queue.current[queue.current.length - 1] ?? game.dir
      if (dir === last || dir === OPPOSITE[last]) return
      if (queue.current.length < 3) queue.current.push(dir)
    },
    [running, paused, game.over, game.dir],
  )

  // Keyboard.
  useEffect(() => {
    const map: Record<string, Dir> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        if (running && !game.over) setPaused((v) => !v)
        return
      }
      if (e.key === ' ' && !running) {
        e.preventDefault()
        setRunning(true)
        return
      }
      const dir = map[e.key]
      if (!dir) return
      e.preventDefault()
      pushDir(dir)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pushDir, running, game.over])

  // Touch swipe.
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    touchStart.current = null
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
    if (Math.abs(dx) > Math.abs(dy)) pushDir(dx > 0 ? 'right' : 'left')
    else pushDir(dy > 0 ? 'down' : 'up')
  }

  const snakeSet = new Set(game.snake)
  const head = game.snake[0]
  const score = game.score * 10

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
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Snake</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Score</div>
            <div className="font-display text-xl font-bold tabular-nums">{score}</div>
          </div>
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Best</div>
            <div className="font-display text-xl font-bold tabular-nums">{best}</div>
          </div>
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Length</div>
            <div className="font-display text-xl font-bold tabular-nums">{game.snake.length}</div>
          </div>
          <FullscreenButton />
        </div>
      </div>

      {/* Difficulty tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="anim-outline anim-outline-slow inline-flex border-2 border-[var(--line)] bg-[var(--surface)] p-1 text-sm font-bold">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setSearchParams({ difficulty: l })}
              className={`px-4 py-1.5 font-display text-xs uppercase transition ${level === l ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}
              title={SNAKE_LEVELS[l].label}
            >
              {l}
            </button>
          ))}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">{SNAKE_LEVELS[level].label}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        {/* Board */}
        <div className="anim-outline relative mx-auto w-full max-w-[540px]">
          <div
            className="grid touch-none border-2 border-[var(--ink)] bg-[#0b0b0e] p-1 shadow-[0_20px_60px_rgba(0,0,0,.12)]"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            role="application"
            aria-label="Snake board"
          >
            {Array.from({ length: COLS * ROWS }, (_, index) => {
              const isHead = index === head
              const isBody = !isHead && snakeSet.has(index)
              const isFood = index === game.food
              return (
                <span
                  key={index}
                  className="aspect-square"
                  style={{
                    background: isHead ? '#86efac' : isBody ? '#4ade80' : isFood ? '#ff4b4d' : 'transparent',
                    boxShadow: isHead || isBody || isFood ? 'inset -2px -2px 0 rgba(0,0,0,.35), inset 2px 2px 0 rgba(255,255,255,.25)' : undefined,
                  }}
                />
              )
            })}
          </div>

          {/* Overlays */}
          {(!running || paused || game.over) && (
            <div className="absolute inset-0 grid place-items-center bg-[#0b0b0e]/80 backdrop-blur-[2px]">
              <div className="border-2 border-[var(--accent)] bg-[var(--surface)] px-8 py-7 text-center">
                {game.over ? (
                  <>
                    <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">Game over</p>
                    <p className="mt-2 font-display text-2xl font-bold uppercase tracking-tight">The snake bit the dust 🦈</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">Score {score} · length {game.snake.length} · {level}</p>
                    <button onClick={() => restart(level)} className="retro-btn mt-5 bg-[var(--accent)] px-6 py-2.5 font-display text-xs font-bold uppercase text-white">
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
                    <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">{level}{SNAKE_LEVELS[level].wrap ? ' · walls wrap' : ''}</p>
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
          {/* Touch D-pad */}
          <div className="grid grid-cols-3 gap-2 lg:hidden">
            <span />
            <button onPointerDown={() => pushDir('up')} className="border-2 border-[var(--ink)] bg-[var(--surface)] py-3 font-display text-lg font-bold" aria-label="Up">▲</button>
            <span />
            <button onPointerDown={() => pushDir('left')} className="border-2 border-[var(--ink)] bg-[var(--surface)] py-3 font-display text-lg font-bold" aria-label="Left">◀</button>
            <button onPointerDown={() => pushDir('down')} className="border-2 border-[var(--ink)] bg-[var(--surface)] py-3 font-display text-lg font-bold" aria-label="Down">▼</button>
            <button onPointerDown={() => pushDir('right')} className="border-2 border-[var(--ink)] bg-[var(--surface)] py-3 font-display text-lg font-bold" aria-label="Right">▶</button>
          </div>

          <div className="flex gap-2.5">
            <button onClick={() => (running && !game.over ? setPaused((v) => !v) : undefined)} disabled={!running || game.over} className="retro-btn flex-1 bg-[var(--surface)] px-3 py-3 font-display text-[11px] font-bold uppercase disabled:opacity-40">
              {paused ? 'Continue' : 'Pause'}
            </button>
            <button onClick={() => restart(level)} className="retro-btn flex-1 bg-[var(--accent)] px-3 py-3 font-display text-[11px] font-bold uppercase text-white">
              New game
            </button>
          </div>

          <p className="border-2 border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
            <span className="font-bold text-[var(--ink)]">Tip:</span> arrows or WASD steer, swipe on mobile, P pauses. Eat the red bites to grow — the snake speeds up as it gets longer. On Easy the walls wrap around; elsewhere they bite back. 🐍🦈
          </p>
        </div>
      </div>
    </main>
  )
}
