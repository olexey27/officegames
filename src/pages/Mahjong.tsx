import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import FullscreenButton from '../components/FullscreenButton'
import { ArrowIcon } from '../components/icons'
import {
  availablePairs,
  deal,
  faceOf,
  freeTiles,
  shuffleRemaining,
  type MahjongLayout,
  type Tile,
} from '../games/mahjong/engine'

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

  const restart = (nextLayout: MahjongLayout) => {
    setTiles(deal(nextLayout))
    setSelected(null)
    setHint(null)
    setHistory([])
    setSeconds(0)
    setStarted(false)
    setShuffles(0)
  }

  // Layout change deals a fresh board.
  useEffect(() => {
    restart(layout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout])

  const alive = useMemo(() => tiles.filter((t) => !t.removed), [tiles])
  const freeSet = useMemo(() => new Set(freeTiles(tiles).map((t) => t.id)), [tiles])
  const pairs = useMemo(() => availablePairs(tiles), [tiles])
  const won = alive.length === 0 && tiles.length > 0
  const stuck = !won && alive.length > 0 && pairs.length === 0

  // Timer runs from the first pick until the board is cleared or stuck.
  useEffect(() => {
    if (!started || won || stuck) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [started, won, stuck])

  const onTile = (tile: Tile) => {
    if (won || !freeSet.has(tile.id)) return
    setStarted(true)
    setHint(null)
    if (selected === tile.id) {
      setSelected(null)
      return
    }
    if (selected !== null) {
      const other = tiles.find((t) => t.id === selected)
      if (other && other.kind === tile.kind) {
        setTiles((prev) => prev.map((t) => (t.id === tile.id || t.id === selected ? { ...t, removed: true } : t)))
        setHistory((prev) => [...prev, [selected, tile.id]])
        setSelected(null)
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
    const [a, b] = history[history.length - 1]
    setTiles((prev) => prev.map((t) => (t.id === a || t.id === b ? { ...t, removed: false } : t)))
    setHistory((prev) => prev.slice(0, -1))
    setSelected(null)
    setHint(null)
  }

  const shuffle = () => {
    if (alive.length < 4) return
    setTiles((prev) => shuffleRemaining(prev))
    setSelected(null)
    setHint(null)
    setShuffles((n) => n + 1)
  }

  // Board metrics (half-tile units) for percentage positioning.
  const { W, H } = useMemo(() => {
    const maxX = Math.max(...tiles.map((t) => t.x))
    const maxY = Math.max(...tiles.map((t) => t.y))
    return { W: maxX + 2, H: maxY + 2 }
  }, [tiles])
  const PAD = 1.4
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
        <div className="anim-outline relative w-full border-2 border-[var(--ink)] bg-[#10331f] p-3 shadow-[0_20px_60px_rgba(0,0,0,.12)]" style={{ background: 'linear-gradient(160deg, #14402a, #0c2418)' }}>
          <div className="relative w-full" style={{ aspectRatio: `${W} / ${H + PAD}` }}>
            {sorted.map((tile) => {
              if (tile.removed) return null
              const face = faceOf(tile.kind)
              const isFreeTile = freeSet.has(tile.id)
              const isSelected = selected === tile.id
              const isHint = hint !== null && (hint[0] === tile.id || hint[1] === tile.id)
              return (
                <button
                  key={tile.id}
                  onClick={() => onTile(tile)}
                  className="absolute flex flex-col items-center justify-center border-2 transition-transform"
                  style={{
                    left: `${(tile.x / W) * 100}%`,
                    top: `${((tile.y - tile.z * 0.6 + PAD) / (H + PAD)) * 100}%`,
                    width: `${(2 / W) * 100}%`,
                    height: `${(2 / (H + PAD)) * 100}%`,
                    zIndex: tile.z * 1000 + tile.y * 30 + (30 - tile.x),
                    background: isFreeTile ? '#f6f1e7' : '#cfc5b2',
                    borderColor: isSelected ? '#e93131' : isHint ? '#38bdf8' : '#242321',
                    boxShadow: isSelected
                      ? '0 0 0 2px #e93131, 3px 4px 0 #8a7a5c'
                      : isHint
                        ? '0 0 0 2px #38bdf8, 3px 4px 0 #8a7a5c'
                        : '3px 4px 0 #8a7a5c, 4px 6px 6px rgba(0,0,0,.35)',
                    cursor: isFreeTile && !won ? 'pointer' : 'default',
                  }}
                  aria-label={`Tile ${tile.kind}${isFreeTile ? ', free' : ', blocked'}`}
                >
                  <span className="font-mono font-bold leading-none" style={{ fontSize: 'clamp(5px, 1vw, 10px)', color: '#8a7a5c' }}>{face.top}</span>
                  <span className="font-bold leading-none" style={{ fontSize: 'clamp(9px, 2.2vw, 22px)', color: face.color }}>{face.main}</span>
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

          {/* Stuck overlay */}
          {stuck && (
            <div className="absolute inset-0 z-[9999] grid place-items-center bg-[color:var(--canvas)]/85 backdrop-blur-sm">
              <div className="border-2 border-[var(--accent)] bg-[var(--surface)] px-8 py-7 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">No moves left</p>
                <p className="mt-2 font-display text-2xl font-bold uppercase tracking-tight">The wall is stuck 🦈</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{alive.length} tiles remain — shuffle them or start over.</p>
                <div className="mt-5 flex justify-center gap-3">
                  <button onClick={shuffle} className="retro-btn bg-[var(--accent)] px-6 py-2.5 font-display text-xs font-bold uppercase text-white">
                    Shuffle ↗
                  </button>
                  <button onClick={() => restart(layout)} className="retro-btn bg-[var(--surface)] px-6 py-2.5 font-display text-xs font-bold uppercase">
                    New game
                  </button>
                </div>
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
