import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import FullscreenButton from '../components/FullscreenButton'
import { ArrowIcon } from '../components/icons'
import {
  availablePairs,
  deal,
  freeTiles,
  shuffleRemaining,
  tileSrc,
  type MahjongLayout,
  type Tile,
} from '../games/mahjong/engine'

const MATCH_ANIM_MS = 380

const LAYOUTS: MahjongLayout[] = ['Quick', 'Easy', 'Turtle']
const TILE_INFO: Record<MahjongLayout, string> = { Quick: '36 tiles', Easy: '72 tiles', Turtle: '144 tiles' }

function parseLayout(value: string | null): MahjongLayout {
  return LAYOUTS.includes(value as MahjongLayout) ? (value as MahjongLayout) : 'Quick'
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Mahjong() {
  const [searchParams, setSearchParams] = useSearchParams()
  const layout = parseLayout(searchParams.get('difficulty'))

  const [tiles, setTiles] = useState<Tile[]>(() => deal(layout))
  const [selected, setSelected] = useState<number | null>(null)
  const [hint, setHint] = useState<[number, number] | null>(null)
  const [history, setHistory] = useState<[number, number][]>([])
  const [seconds, setSeconds] = useState(0)
  const [started, setStarted] = useState(false)
  const [shuffles, setShuffles] = useState(0)
  /** Ids currently playing the vanish animation — still rendered, not clickable. */
  const [vanishing, setVanishing] = useState<Set<number>>(() => new Set())
  /** True during the brief "no moves — reshuffling" notice. */
  const [reshuffling, setReshuffling] = useState(false)
  const vanishTimers = useRef<number[]>([])

  const clearVanishTimers = () => {
    for (const id of vanishTimers.current) window.clearTimeout(id)
    vanishTimers.current = []
  }

  const restart = (nextLayout: MahjongLayout) => {
    clearVanishTimers()
    setTiles(deal(nextLayout))
    setSelected(null)
    setHint(null)
    setHistory([])
    setSeconds(0)
    setStarted(false)
    setShuffles(0)
    setVanishing(new Set())
    setReshuffling(false)
  }

  // Drop any pending timers when leaving the page.
  useEffect(() => clearVanishTimers, [])

  // Layout change deals a fresh board.
  useEffect(() => {
    restart(layout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout])

  // Treat tiles that are mid-vanish as already gone, so free/pair/stuck are
  // computed on the settled board (no phantom "still matchable" pair during
  // the removal animation).
  const boardTiles = useMemo(
    () => tiles.map((t) => (vanishing.has(t.id) ? { ...t, removed: true } : t)),
    [tiles, vanishing],
  )
  const alive = useMemo(() => boardTiles.filter((t) => !t.removed), [boardTiles])
  const freeSet = useMemo(() => new Set(freeTiles(boardTiles).map((t) => t.id)), [boardTiles])
  const pairs = useMemo(() => availablePairs(boardTiles), [boardTiles])
  const won = alive.length === 0 && tiles.length > 0
  const stuck = !won && alive.length > 0 && pairs.length === 0

  // Timer runs from the first pick until the board is cleared or stuck.
  useEffect(() => {
    if (!started || won || stuck) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [started, won, stuck])

  // Dead end: no matchable free pair but tiles remain. Show a brief notice,
  // then reshuffle the remaining tiles into a solvable arrangement so the
  // player is never stranded. (`stuck` is a boolean, so this fires once.)
  useEffect(() => {
    if (!stuck) return
    const timer = window.setTimeout(() => {
      setTiles((prev) => shuffleRemaining(prev))
      setSelected(null)
      setHint(null)
      setShuffles((n) => n + 1)
      setReshuffling(false)
    }, 1100)
    setReshuffling(true)
    return () => window.clearTimeout(timer)
  }, [stuck])

  const onTile = (tile: Tile) => {
    if (won || vanishing.has(tile.id) || !freeSet.has(tile.id)) return
    setStarted(true)
    setHint(null)
    if (selected === tile.id) {
      setSelected(null)
      return
    }
    if (selected !== null) {
      const other = tiles.find((t) => t.id === selected)
      if (other && other.kind === tile.kind) {
        // Let the pair play its vanish animation, then take it off the board.
        const pair: [number, number] = [selected, tile.id]
        setSelected(null)
        setVanishing((prev) => new Set(prev).add(pair[0]).add(pair[1]))
        const timer = window.setTimeout(() => {
          setTiles((prev) => prev.map((t) => (t.id === pair[0] || t.id === pair[1] ? { ...t, removed: true } : t)))
          setHistory((prev) => [...prev, pair])
          setVanishing((prev) => {
            const next = new Set(prev)
            next.delete(pair[0])
            next.delete(pair[1])
            return next
          })
        }, MATCH_ANIM_MS)
        vanishTimers.current.push(timer)
        return
      }
    }
    setSelected(tile.id)
  }

  const showHint = () => {
    if (pairs.length === 0) return
    setStarted(true)
    const [a, b] = pairs[Math.floor(Math.random() * pairs.length)]
    setHint([a.id, b.id])
  }

  const undo = () => {
    if (history.length === 0) return
    clearVanishTimers()
    setVanishing(new Set())
    const [a, b] = history[history.length - 1]
    setTiles((prev) => prev.map((t) => (t.id === a || t.id === b ? { ...t, removed: false } : t)))
    setHistory((prev) => prev.slice(0, -1))
    setSelected(null)
    setHint(null)
  }

  const shuffle = () => {
    if (alive.length < 4) return
    clearVanishTimers()
    setVanishing(new Set())
    setTiles((prev) => shuffleRemaining(prev))
    setSelected(null)
    setHint(null)
    setShuffles((n) => n + 1)
  }

  // Board metrics in half-tile units. Higher layers are drawn shifted up and
  // to the left (SHIFT_*) so the stack reads as a real 3D mound.
  const SHIFT_X = 0.34
  const SHIFT_Y = 0.42
  const metrics = useMemo(() => {
    const maxX = Math.max(...tiles.map((t) => t.x))
    const maxY = Math.max(...tiles.map((t) => t.y))
    const maxZ = Math.max(...tiles.map((t) => t.z))
    // width/height in x-half-units (uy is 1.4x ux to match the 40:56 tile art)
    return {
      maxZ,
      unitsW: maxX + 2 + maxZ * SHIFT_X,
      unitsH: maxY + 2 + maxZ * SHIFT_Y,
    }
  }, [tiles])
  // Paint back-to-front: lower layers first, then within a layer the tiles
  // toward the back (lower y, higher x) before those in front.
  const sorted = useMemo(() => [...tiles].sort((a, b) => a.z * 1000 + a.y * 30 + (30 - a.x) - (b.z * 1000 + b.y * 30 + (30 - b.x))), [tiles])

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
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Mahjong</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Tiles</div>
            <div className="font-display text-xl font-bold tabular-nums">{alive.length}</div>
          </div>
          <div className={`border-2 px-4 py-2 text-center ${pairs.length <= 2 && !won && started ? 'border-[var(--accent)]' : 'border-[var(--line)]'} bg-[var(--surface)]`}>
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Moves</div>
            <div className="font-display text-xl font-bold tabular-nums">{pairs.length}</div>
          </div>
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Time</div>
            <div className="font-display text-xl font-bold tabular-nums">{formatTime(seconds)}</div>
          </div>
          <FullscreenButton />
        </div>
      </div>

      {/* Layout tabs */}
      <div className="anim-outline anim-outline-slow mb-6 inline-flex border-2 border-[var(--line)] bg-[var(--surface)] p-1 text-sm font-bold">
        {LAYOUTS.map((l) => (
          <button
            key={l}
            onClick={() => setSearchParams({ difficulty: l })}
            className={`px-4 py-1.5 font-display text-xs uppercase transition ${layout === l ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}
          >
            {l}
            <span className="ml-1.5 font-mono text-[9px] opacity-70">{TILE_INFO[l].split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        {/* Board */}
        <div className="anim-outline relative w-full overflow-x-auto border-2 border-[var(--ink)] p-3 shadow-[0_20px_60px_rgba(0,0,0,.12)] sm:p-5" style={{ background: 'linear-gradient(160deg, #14402a, #0c2418)' }}>
          <div
            className="relative mx-auto"
            style={{
              ['--ux' as never]: 'clamp(13px, 3vw, 30px)',
              ['--uy' as never]: 'calc(var(--ux) * 1.4)',
              width: `calc(var(--ux) * ${metrics.unitsW})`,
              height: `calc(var(--uy) * ${metrics.unitsH})`,
            }}
          >
            {sorted.map((tile) => {
              if (tile.removed) return null
              const isFreeTile = freeSet.has(tile.id)
              const isSelected = selected === tile.id
              const isHint = hint !== null && (hint[0] === tile.id || hint[1] === tile.id)
              const isVanishing = vanishing.has(tile.id)
              // Layer offset: higher tiles move up and left; padding reserves the room.
              const leftUnits = metrics.maxZ * SHIFT_X + tile.x - tile.z * SHIFT_X
              const topUnits = metrics.maxZ * SHIFT_Y + tile.y - tile.z * SHIFT_Y
              return (
                <button
                  key={tile.id}
                  onClick={() => onTile(tile)}
                  className={`absolute ${isVanishing ? 'tile-match-out' : isSelected ? 'tile-pick' : ''}`}
                  style={{
                    left: `calc(var(--ux) * ${leftUnits})`,
                    top: `calc(var(--uy) * ${topUnits})`,
                    width: 'calc(var(--ux) * 2)',
                    height: 'calc(var(--uy) * 2)',
                    zIndex: (isVanishing || isSelected ? 5000 : 0) + tile.z * 1000 + tile.y * 30 + (30 - tile.x),
                    // Blocked tiles are dimmed so free ones read at a glance.
                    filter: isFreeTile || isVanishing ? 'drop-shadow(1px 2px 1px rgba(0,0,0,.5))' : 'brightness(0.66) saturate(0.7) drop-shadow(1px 2px 1px rgba(0,0,0,.5))',
                    cursor: isFreeTile && !won ? 'pointer' : 'default',
                  }}
                  aria-label={`Tile ${tile.kind}${isFreeTile ? ', free' : ', blocked'}${isSelected ? ', selected' : ''}`}
                >
                  <img
                    src={tileSrc(tile.kind)}
                    alt=""
                    draggable={false}
                    className="block h-full w-full select-none"
                    style={{
                      imageRendering: 'pixelated',
                      outline: isSelected ? '2px solid #e93131' : isHint ? '2px solid #38bdf8' : 'none',
                      outlineOffset: '-2px',
                      filter: isSelected
                        ? 'drop-shadow(0 0 5px rgba(233,49,49,.85))'
                        : isHint
                          ? 'drop-shadow(0 0 5px rgba(56,189,248,.85))'
                          : 'none',
                    }}
                  />
                  {isVanishing && (
                    <span
                      className="tile-spark pointer-events-none absolute inset-0"
                      style={{ background: 'radial-gradient(circle at center, rgba(255,241,171,.95) 0%, rgba(255,207,90,.5) 45%, transparent 72%)' }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Win overlay */}
          {won && (
            <div className="absolute inset-0 z-[9999] grid place-items-center bg-[color:var(--canvas)]/85 backdrop-blur-sm">
              <div className="border-2 border-[var(--accent)] bg-[var(--surface)] px-8 py-7 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">Board cleared</p>
                <p className="mt-2 font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">All tiles matched! 🀄</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{layout} · {formatTime(seconds)}{shuffles > 0 ? ` · ${shuffles} shuffles` : ' · no shuffles!'}</p>
                <button onClick={() => restart(layout)} className="retro-btn mt-5 bg-[var(--accent)] px-6 py-2.5 font-display text-xs font-bold uppercase text-white">
                  Play again ↗
                </button>
              </div>
            </div>
          )}

          {/* Dead-end notice — the board reshuffles itself right after. */}
          {(stuck || reshuffling) && !won && (
            <div className="absolute inset-0 z-[9999] grid place-items-center bg-[color:var(--canvas)]/85 backdrop-blur-sm">
              <div className="border-2 border-[var(--accent)] bg-[var(--surface)] px-8 py-7 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">No moves left</p>
                <p className="mt-2 font-display text-2xl font-bold uppercase tracking-tight">Reshuffling the wall 🀄</p>
                <p className="mt-2 text-sm text-[var(--muted)]">No pair was reachable — the {alive.length} remaining tiles are being mixed into a solvable board.</p>
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-5">
          <p className="border-2 border-[var(--ink)] bg-[var(--surface)] px-4 py-3 text-center font-display text-[11px] font-bold uppercase tracking-tight" aria-live="polite">
            {won ? 'Cleared!' : stuck ? 'No moves left' : `${pairs.length} possible ${pairs.length === 1 ? 'move' : 'moves'}`}
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={showHint} disabled={pairs.length === 0 || won} className="retro-btn bg-[var(--surface)] px-3 py-2.5 font-display text-[10px] font-bold uppercase disabled:opacity-40">
              💡 Hint
            </button>
            <button onClick={undo} disabled={history.length === 0} className="retro-btn bg-[var(--surface)] px-3 py-2.5 font-display text-[10px] font-bold uppercase disabled:opacity-40">
              Undo pair
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={shuffle} disabled={alive.length < 4 || won} className="retro-btn bg-[var(--ink)] px-3 py-2.5 font-display text-[10px] font-bold uppercase text-[var(--canvas)] disabled:opacity-40">
              Shuffle
            </button>
            <button onClick={() => restart(layout)} className="retro-btn bg-[var(--accent)] px-3 py-2.5 font-display text-[10px] font-bold uppercase text-white">
              New game
            </button>
          </div>

          <p className="border-2 border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
            <span className="font-bold text-[var(--ink)]">Tip:</span> match identical free tiles — a tile is free when nothing lies on top and its left or right side is open (bright tiles are free). Every deal is solvable without shuffling. 🀄🦈
          </p>
        </div>
      </div>
    </main>
  )
}
