import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowIcon } from '../components/icons'
import {
  canMove,
  maxTile,
  move,
  spawnRandom,
  startGame,
  type Direction,
  type Tile,
} from '../games/game2048/engine'

const BEST_KEY = 'sg-2048-best'
const WIN_VALUE = 2048

// Classic 2048 palette — tiles carry their own colors so they read well in
// both themes; the hottest values shift toward the SharksGames red.
function tileStyle(value: number): { background: string; color: string } {
  switch (value) {
    case 2: return { background: '#efe5db', color: '#776e65' }
    case 4: return { background: '#ece0c8', color: '#776e65' }
    case 8: return { background: '#f2b179', color: '#ffffff' }
    case 16: return { background: '#f59563', color: '#ffffff' }
    case 32: return { background: '#f67c5f', color: '#ffffff' }
    case 64: return { background: '#f65e3b', color: '#ffffff' }
    case 128: return { background: '#edcf72', color: '#ffffff' }
    case 256: return { background: '#edcc61', color: '#ffffff' }
    case 512: return { background: '#edc850', color: '#ffffff' }
    case 1024: return { background: '#ff6b52', color: '#ffffff' }
    case 2048: return { background: '#ff4b4d', color: '#ffffff' }
    default: return { background: '#2c2a26', color: '#ffffff' }
  }
}

function readBest(): number {
  if (typeof localStorage === 'undefined') return 0
  const stored = Number(localStorage.getItem(BEST_KEY))
  return Number.isFinite(stored) ? stored : 0
}

export default function Game2048() {
  const [tiles, setTiles] = useState<Tile[]>(() => startGame())
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(readBest)
  const [over, setOver] = useState(false)
  const [won, setWon] = useState(false)
  const [keepGoing, setKeepGoing] = useState(false)

  const lastMoveAt = useRef(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const newGame = useCallback(() => {
    setTiles(startGame())
    setScore(0)
    setOver(false)
    setWon(false)
    setKeepGoing(false)
  }, [])

  const doMove = useCallback(
    (dir: Direction) => {
      if (over || (won && !keepGoing)) return
      const now = performance.now()
      if (now - lastMoveAt.current < 110) return // let the slide finish
      const result = move(tiles, dir)
      if (!result.moved) return
      lastMoveAt.current = now
      const next = spawnRandom(result.tiles)
      setTiles(next)
      if (result.gained > 0) setScore((s) => s + result.gained)
      // Drop the absorbed tiles once they have slid into place.
      window.setTimeout(() => {
        setTiles((current) => current.filter((t) => t.state !== 'dying'))
      }, 170)
    },
    [tiles, over, won, keepGoing],
  )

  // Best score persistence.
  useEffect(() => {
    if (score > best) {
      setBest(score)
      if (typeof localStorage !== 'undefined') localStorage.setItem(BEST_KEY, String(score))
    }
  }, [score, best])

  // Win + game-over detection.
  useEffect(() => {
    if (!won && maxTile(tiles) >= WIN_VALUE) setWon(true)
  }, [tiles, won])
  useEffect(() => {
    if (!over && !canMove(tiles)) setOver(true)
  }, [tiles, over])

  // Keyboard: arrows + WASD.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
        W: 'up', S: 'down', A: 'left', D: 'right',
      }
      const dir = map[e.key]
      if (!dir) return
      e.preventDefault()
      doMove(dir)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doMove])

  // Touch swipe on the board.
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
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? 'right' : 'left')
    else doMove(dy > 0 ? 'down' : 'up')
  }

  const showWin = won && !keepGoing

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
          <h1 className="font-display text-4xl font-bold tracking-[-.06em] sm:text-5xl">2048</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Score</div>
            <div className="font-display text-xl font-bold tabular-nums">{score}</div>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Best</div>
            <div className="font-display text-xl font-bold tabular-nums">{best}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        {/* Board */}
        <div className="anim-outline relative mx-auto w-full max-w-[480px] rounded-2xl">
          <div
            className="relative aspect-square w-full touch-none overflow-hidden rounded-2xl border-2 border-[var(--ink)] bg-[var(--surface)] shadow-[0_20px_60px_rgba(0,0,0,.12)]"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            role="application"
            aria-label="2048 board — use arrow keys or swipe to move tiles"
          >
            {/* Empty slots */}
            <div className="absolute inset-2 grid grid-cols-4 grid-rows-4">
              {Array.from({ length: 16 }, (_, i) => (
                <div key={i} className="p-1">
                  <div className="size-full rounded-xl bg-[var(--surface-soft)]" />
                </div>
              ))}
            </div>

            {/* Tiles */}
            <div className="absolute inset-2">
              {tiles.map((tile) => {
                const { background, color } = tileStyle(tile.value)
                const anim = tile.state === 'new' ? 'tile-new' : tile.state === 'merged' ? 'tile-merged' : ''
                return (
                  <div
                    key={tile.id}
                    className="absolute p-1 transition-[top,left] duration-150 ease-out"
                    style={{
                      top: `${tile.row * 25}%`,
                      left: `${tile.col * 25}%`,
                      width: '25%',
                      height: '25%',
                      zIndex: tile.state === 'dying' ? 1 : 2,
                    }}
                  >
                    <div
                      className={`grid size-full place-items-center rounded-xl font-display font-bold ${anim} ${tile.value >= 1000 ? 'text-xl sm:text-3xl' : tile.value >= 100 ? 'text-2xl sm:text-4xl' : 'text-3xl sm:text-5xl'}`}
                      style={{ background, color }}
                    >
                      {tile.value}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Win overlay */}
            {showWin && (
              <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-[color:var(--canvas)]/80 backdrop-blur-sm">
                <div className="rounded-2xl border border-[var(--accent)] bg-[var(--surface)] px-8 py-7 text-center shadow-[0_20px_60px_var(--glow)]">
                  <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">2048 reached</p>
                  <p className="mt-2 font-display text-3xl font-bold tracking-[-.05em]">Apex predator! 🦈</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">Score {score} — keep going for a bigger bite?</p>
                  <div className="mt-5 flex justify-center gap-3">
                    <button onClick={() => setKeepGoing(true)} className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[var(--accent-deep)]">
                      Keep going <ArrowIcon />
                    </button>
                    <button onClick={newGame} className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 py-2.5 text-sm font-extrabold transition hover:border-[var(--accent)]">
                      New game
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Game over overlay */}
            {over && (
              <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-[color:var(--canvas)]/85 backdrop-blur-sm">
                <div className="rounded-2xl border border-[var(--accent)] bg-[var(--surface)] px-8 py-7 text-center shadow-[0_20px_60px_var(--glow)]">
                  <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">Game over</p>
                  <p className="mt-2 font-display text-3xl font-bold tracking-[-.05em]">No moves left 🦈</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">Score {score} · Best {best}</p>
                  <button onClick={newGame} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[var(--accent-deep)]">
                    Try again <ArrowIcon />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-5">
          <button onClick={newGame} className="anim-outline rounded-xl bg-[var(--accent)] px-3 py-3 text-sm font-extrabold text-white shadow-[0_12px_28px_var(--glow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-deep)]">
            New game
          </button>

          <p className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
            <span className="font-bold text-[var(--ink)]">Tip:</span> use the arrow keys (or WASD) — on mobile, swipe the board. Equal tiles merge; reach the 2048 tile before the grid fills up. 🦈
          </p>
        </div>
      </div>
    </main>
  )
}
