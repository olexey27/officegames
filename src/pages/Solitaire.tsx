import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import FullscreenButton from '../components/FullscreenButton'
import { ArrowIcon } from '../components/icons'
import {
  canAutoFinish,
  draw,
  hint,
  isWon,
  moveFoundationToTableau,
  moveTableauRun,
  moveToFoundation,
  moveWasteToTableau,
  newGame,
  type Card,
  type Solitaire as Game,
} from '../games/solitaire/engine'

const SUIT_NAMES = ['spades', 'hearts', 'diamonds', 'clubs']
const RANK_NAMES = ['', 'a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k']
const ASSET = '/assets/solitaire-pixel'
const DRAG_THRESHOLD = 5 // px before a press counts as a drag instead of a click

type Mode = 'Draw 1' | 'Draw 3'
const MODES: Mode[] = ['Draw 1', 'Draw 3']

function parseMode(value: string | null): Mode {
  return value === 'Draw 3' ? 'Draw 3' : 'Draw 1'
}

function cardKey(card: Card): string {
  return `${card.rank}-${card.suit}`
}

function cardSrc(card: Card): string {
  return card.faceUp ? `${ASSET}/card-${SUIT_NAMES[card.suit]}-${RANK_NAMES[card.rank]}.svg` : `${ASSET}/card-back.svg`
}

/** Where a dragged card came from. */
type Origin = { type: 'waste' } | { type: 'tableau'; pile: number; index: number } | { type: 'foundation'; pile: number }

type DragState = {
  origin: Origin
  cards: Card[]
  /** cursor offset inside the grabbed card */
  grabX: number
  grabY: number
  x: number
  y: number
  startX: number
  startY: number
  moved: boolean
  snapping: boolean
}

function CardImg({ card }: { card: Card }) {
  return (
    <img
      src={cardSrc(card)}
      alt=""
      draggable={false}
      className="pointer-events-none block h-full w-full select-none"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

export default function Solitaire() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = parseMode(searchParams.get('difficulty'))

  const [game, setGame] = useState<Game>(() => newGame(mode === 'Draw 3' ? 3 : 1))
  const [undoStack, setUndoStack] = useState<Game[]>([])
  const [hintCards, setHintCards] = useState<Set<string>>(new Set())
  const [flipped, setFlipped] = useState<Set<string>>(new Set())
  const [drag, setDrag] = useState<DragState | null>(null)
  const [hoverTarget, setHoverTarget] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [started, setStarted] = useState(false)

  // Live refs so pointer handlers always read current values.
  const gameRef = useRef(game)
  gameRef.current = game
  const dragRef = useRef<DragState | null>(null)
  dragRef.current = drag

  const tableauRefs = useRef<(HTMLDivElement | null)[]>([])
  const foundationRefs = useRef<(HTMLDivElement | null)[]>([])

  const won = isWon(game)

  const reset = useCallback((drawCount: 1 | 3) => {
    setGame(newGame(drawCount))
    setUndoStack([])
    setHintCards(new Set())
    setFlipped(new Set())
    setDrag(null)
    setSeconds(0)
    setStarted(false)
  }, [])

  useEffect(() => {
    reset(mode === 'Draw 3' ? 3 : 1)
  }, [mode, reset])

  useEffect(() => {
    if (!started || won) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [started, won])

  /** Face-up cards in `next` that were face down in `prev` — these just turned. */
  const detectFlips = (prev: Game, next: Game): string[] => {
    const wasDown = new Set<string>()
    for (const pile of prev.tableau) {
      for (const c of pile) if (!c.faceUp) wasDown.add(cardKey(c))
    }
    const turned: string[] = []
    for (const pile of next.tableau) {
      for (const c of pile) if (c.faceUp && wasDown.has(cardKey(c))) turned.push(cardKey(c))
    }
    return turned
  }

  /** Runs a transition, records undo, and animates any card that turned over. */
  const commit = useCallback((producer: (g: Game) => Game | null): boolean => {
    const current = gameRef.current
    const next = producer(current)
    if (!next) return false
    setUndoStack((prev) => [...prev.slice(-99), current])
    setGame(next)
    setStarted(true)
    setHintCards(new Set())
    const turned = detectFlips(current, next)
    if (turned.length > 0) {
      setFlipped((prev) => new Set([...prev, ...turned]))
      window.setTimeout(() => {
        setFlipped((prev) => {
          const copy = new Set(prev)
          for (const key of turned) copy.delete(key)
          return copy
        })
      }, 320)
    }
    return true
  }, [])

  const undo = () => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev
      setGame(prev[prev.length - 1])
      return prev.slice(0, -1)
    })
    setHintCards(new Set())
  }

  // ---------- dragging ----------

  /** Which pile is under the pointer, if any. */
  const findDropTarget = (x: number, y: number): { kind: 'tableau' | 'foundation'; index: number } | null => {
    for (let i = 0; i < foundationRefs.current.length; i++) {
      const rect = foundationRefs.current[i]?.getBoundingClientRect()
      if (rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return { kind: 'foundation', index: i }
      }
    }
    for (let i = 0; i < tableauRefs.current.length; i++) {
      const rect = tableauRefs.current[i]?.getBoundingClientRect()
      if (!rect) continue
      // Generous vertical band so dropping below a short pile still counts.
      if (x >= rect.left && x <= rect.right && y >= rect.top - 8 && y <= rect.bottom + 90) {
        return { kind: 'tableau', index: i }
      }
    }
    return null
  }

  const beginDrag = (e: React.PointerEvent, origin: Origin, cards: Card[]) => {
    if (won || cards.length === 0) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    setDrag({
      origin,
      cards,
      grabX: e.clientX - rect.left,
      grabY: e.clientY - rect.top,
      x: rect.left,
      y: rect.top,
      startX: rect.left,
      startY: rect.top,
      moved: false,
      snapping: false,
    })
  }

  // Global pointer handling so the drag survives leaving the card.
  useEffect(() => {
    if (!drag || drag.snapping) return

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d || d.snapping) return
      const nx = e.clientX - d.grabX
      const ny = e.clientY - d.grabY
      const moved = d.moved || Math.abs(nx - d.startX) > DRAG_THRESHOLD || Math.abs(ny - d.startY) > DRAG_THRESHOLD
      setDrag({ ...d, x: nx, y: ny, moved })
      if (moved) {
        const target = findDropTarget(e.clientX, e.clientY)
        setHoverTarget(target ? `${target.kind}-${target.index}` : null)
      }
    }

    const onUp = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      setHoverTarget(null)

      // A press without movement is a click: send the card home if possible.
      if (!d.moved) {
        setDrag(null)
        if (d.origin.type === 'waste') commit((g) => moveToFoundation(g, 'waste'))
        else if (d.origin.type === 'tableau') {
          const pile = gameRef.current.tableau[d.origin.pile]
          if (d.origin.index === pile.length - 1) commit((g) => moveToFoundation(g, (d.origin as { pile: number }).pile))
        }
        return
      }

      const target = findDropTarget(e.clientX, e.clientY)
      let ok = false
      if (target) {
        if (target.kind === 'foundation') {
          if (d.origin.type === 'waste') ok = commit((g) => moveToFoundation(g, 'waste'))
          else if (d.origin.type === 'tableau') ok = commit((g) => moveToFoundation(g, (d.origin as { pile: number }).pile))
        } else {
          if (d.origin.type === 'waste') ok = commit((g) => moveWasteToTableau(g, target.index))
          else if (d.origin.type === 'foundation') ok = commit((g) => moveFoundationToTableau(g, (d.origin as { pile: number }).pile, target.index))
          else ok = commit((g) => moveTableauRun(g, d.origin.type === 'tableau' ? d.origin.pile : 0, d.origin.type === 'tableau' ? d.origin.index : 0, target.index))
        }
      }

      if (ok) {
        setDrag(null)
      } else {
        // Invalid drop — glide the stack back to where it came from.
        setDrag({ ...d, x: d.startX, y: d.startY, snapping: true })
        window.setTimeout(() => setDrag(null), 240)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [drag, commit])

  // ---------- other actions ----------

  const onStock = () => commit((g) => draw(g))

  const onFoundationClick = (fi: number) => {
    const top = game.foundations[fi][game.foundations[fi].length - 1]
    if (!top) return
    // Clicking a foundation card sends it back to a tableau pile that accepts it.
    for (let i = 0; i < 7; i++) {
      if (commit((g) => moveFoundationToTableau(g, fi, i))) return
    }
  }

  const showHint = () => {
    const h = hint(game)
    if (!h) return
    setStarted(true)
    if (h.kind === 'draw') { setHintCards(new Set(['stock'])); return }
    const marks = new Set<string>()
    if (h.kind === 'foundation') {
      const src = h.source === 'waste' ? game.waste[game.waste.length - 1] : game.tableau[h.source][game.tableau[h.source].length - 1]
      if (src) marks.add(cardKey(src))
    } else {
      const card = h.from === 'waste' ? game.waste[game.waste.length - 1] : game.tableau[h.from][h.cardIndex]
      if (card) marks.add(cardKey(card))
    }
    setHintCards(marks)
  }

  const autoFinish = () => {
    let g = gameRef.current
    let changed = false
    for (let i = 0; i < 60 && !isWon(g); i++) {
      let moved = false
      for (const src of ['waste', 0, 1, 2, 3, 4, 5, 6] as const) {
        const next = moveToFoundation(g, src)
        if (next) { g = next; moved = true; changed = true; break }
      }
      if (!moved) break
    }
    if (changed) { setUndoStack((p) => [...p.slice(-99), gameRef.current]); setGame(g) }
  }

  const isHinted = (card: Card) => hintCards.has(cardKey(card))
  /** Is this tableau card part of the stack currently being dragged? */
  const isDraggedFromTableau = (pile: number, index: number): boolean =>
    drag?.origin.type === 'tableau' && drag.origin.pile === pile && index >= drag.origin.index

  const cardBox = { width: 'var(--cw)', height: 'var(--ch)' } as React.CSSProperties

  return (
    <main
      className="mx-auto min-h-[calc(100vh-68px)] max-w-[1240px] px-5 py-8 lg:px-8 lg:py-12"
      style={{ ['--cw' as never]: 'min(12.5vw, 78px)', ['--ch' as never]: 'calc(var(--cw) * 1.5)' }}
    >
      {/* Ad slot */}
      <div className="mb-6 flex items-center justify-center gap-3 border-2 border-dashed border-[var(--line)] bg-[var(--surface-soft)] py-3 text-center font-mono text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">
        <span className="size-1.5 bg-[var(--accent)]" /> Ad space — designed to stay out of your way
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/" className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)] transition hover:text-[var(--accent)]">
            <span className="rotate-180"><ArrowIcon /></span> Back to games
          </Link>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Solitaire</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Moves</div>
            <div className="font-display text-xl font-bold tabular-nums">{game.moves}</div>
          </div>
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Time</div>
            <div className="font-display text-xl font-bold tabular-nums">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</div>
          </div>
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Home</div>
            <div className="font-display text-xl font-bold tabular-nums">{game.foundations.reduce((n, f) => n + f.length, 0)}/52</div>
          </div>
          <FullscreenButton />
        </div>
      </div>

      {/* Mode + actions */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="anim-outline anim-outline-slow inline-flex border-2 border-[var(--line)] bg-[var(--surface)] p-1 text-sm font-bold">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setSearchParams({ difficulty: m })}
              className={`px-4 py-1.5 font-display text-xs uppercase transition ${mode === m ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}
            >
              {m}
            </button>
          ))}
        </div>
        <button onClick={showHint} className="retro-btn bg-[var(--surface)] px-4 py-2 font-display text-[10px] font-bold uppercase">💡 Hint</button>
        <button onClick={undo} disabled={undoStack.length === 0} className="retro-btn bg-[var(--surface)] px-4 py-2 font-display text-[10px] font-bold uppercase disabled:opacity-40">Undo</button>
        {canAutoFinish(game) && !won && <button onClick={autoFinish} className="retro-btn bg-[var(--ink)] px-4 py-2 font-display text-[10px] font-bold uppercase text-[var(--canvas)]">Auto-finish</button>}
        <button onClick={() => reset(mode === 'Draw 3' ? 3 : 1)} className="retro-btn bg-[var(--accent)] px-4 py-2 font-display text-[10px] font-bold uppercase text-white">New game</button>
      </div>

      {/* Board */}
      <div
        className="relative touch-none overflow-x-auto border-2 border-[var(--ink)] p-3 sm:p-5"
        style={{ background: 'linear-gradient(160deg, #14402a, #0c2418)' }}
      >
        {/* Top row: stock, waste, spacer, foundations */}
        <div className="flex items-start gap-[2%]">
          <button
            onClick={onStock}
            className={`shrink-0 border-2 ${hintCards.has('stock') ? 'border-[#38bdf8]' : 'border-white/25'}`}
            style={cardBox}
            aria-label="Draw from stock"
          >
            {game.stock.length > 0 ? (
              <CardImg card={{ rank: 0, suit: 0, faceUp: false }} />
            ) : (
              <span className="grid h-full w-full place-items-center text-2xl text-white/50">↻</span>
            )}
          </button>

          {/* Waste — up to 3 fanned, the top one is draggable */}
          <div className="relative shrink-0" style={cardBox}>
            {game.waste.length === 0 && <div className="h-full w-full border-2 border-dashed border-white/15" />}
            {game.waste.slice(-3).map((card, i, arr) => {
              const isTop = i === arr.length - 1
              const hidden = isTop && drag?.origin.type === 'waste'
              return (
                <div
                  key={cardKey(card)}
                  onPointerDown={isTop ? (e) => beginDrag(e, { type: 'waste' }, [card]) : undefined}
                  className={`absolute top-0 border-2 ${isTop && isHinted(card) ? 'border-[#38bdf8]' : 'border-transparent'} ${hidden ? 'card-dragging-source' : ''} ${isTop ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  style={{ left: `calc(${i} * var(--cw) * 0.22)`, width: 'var(--cw)', height: 'var(--ch)', zIndex: i }}
                  role={isTop ? 'button' : undefined}
                  aria-label={isTop ? `Waste: ${RANK_NAMES[card.rank]} ${SUIT_NAMES[card.suit]}` : undefined}
                >
                  <CardImg card={card} />
                </div>
              )
            })}
          </div>

          <div className="shrink-0" style={{ width: 'var(--cw)' }} />

          {/* Foundations */}
          {game.foundations.map((f, fi) => {
            const top = f[f.length - 1]
            const hidden = top && drag?.origin.type === 'foundation' && drag.origin.pile === fi
            return (
              <div
                key={fi}
                ref={(el) => { foundationRefs.current[fi] = el }}
                onClick={() => !drag && onFoundationClick(fi)}
                onPointerDown={top ? (e) => beginDrag(e, { type: 'foundation', pile: fi }, [top]) : undefined}
                className={`shrink-0 border-2 border-white/25 ${hoverTarget === `foundation-${fi}` ? 'drop-target-ok' : ''} ${hidden ? 'card-dragging-source' : ''} ${top ? 'cursor-grab active:cursor-grabbing' : ''}`}
                style={cardBox}
                role="button"
                aria-label={`Foundation ${fi + 1}`}
              >
                {top ? <CardImg card={top} /> : <span className="grid h-full w-full place-items-center text-xl text-white/25">A↑</span>}
              </div>
            )
          })}
        </div>

        {/* Tableau */}
        <div className="mt-[3%] flex gap-[2%]">
          {game.tableau.map((pile, pi) => {
            const faceDownOffset = 0.16
            const faceUpOffset = 0.28
            let acc = 0
            const tops = pile.map((card) => {
              const y = acc
              acc += card.faceUp ? faceUpOffset : faceDownOffset
              return y
            })
            const height = pile.length === 0 ? 1 : acc + 1
            return (
              <div
                key={pi}
                ref={(el) => { tableauRefs.current[pi] = el }}
                className={`relative flex-1 ${hoverTarget === `tableau-${pi}` ? 'drop-target-ok' : ''}`}
                style={{ height: `calc(var(--ch) * ${height})`, minWidth: 'var(--cw)' }}
              >
                {pile.length === 0 && (
                  <div className="absolute inset-x-0 top-0 border-2 border-dashed border-white/15" style={{ height: 'var(--ch)' }} aria-label={`Empty column ${pi + 1}`} />
                )}
                {pile.map((card, ci) => {
                  const dragging = isDraggedFromTableau(pi, ci)
                  const justFlipped = flipped.has(cardKey(card)) && card.faceUp
                  return (
                    <div
                      key={`${pi}-${ci}-${cardKey(card)}`}
                      onPointerDown={card.faceUp ? (e) => beginDrag(e, { type: 'tableau', pile: pi, index: ci }, pile.slice(ci)) : undefined}
                      className={`absolute inset-x-0 border-2 ${isHinted(card) && card.faceUp ? 'border-[#38bdf8]' : 'border-transparent'} ${dragging ? 'card-dragging-source' : ''} ${justFlipped ? 'card-flip-in' : ''} ${card.faceUp ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      style={{ top: `calc(var(--ch) * ${tops[ci]})`, height: 'var(--ch)', zIndex: ci }}
                      role={card.faceUp ? 'button' : undefined}
                      aria-label={card.faceUp ? `${RANK_NAMES[card.rank]} ${SUIT_NAMES[card.suit]}` : 'Face-down card'}
                    >
                      <CardImg card={card} />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Win overlay */}
        {won && (
          <div className="absolute inset-0 z-50 grid place-items-center bg-[#0b0b0e]/85 backdrop-blur-sm">
            <div className="border-2 border-[var(--accent)] bg-[var(--surface)] px-8 py-7 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">Solved</p>
              <p className="mt-2 font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">All 52 home! 🃏</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{mode} · {game.moves} moves · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</p>
              <button onClick={() => reset(mode === 'Draw 3' ? 3 : 1)} className="retro-btn mt-5 bg-[var(--accent)] px-6 py-2.5 font-display text-xs font-bold uppercase text-white">Play again ↗</button>
            </div>
          </div>
        )}
      </div>

      {/* The stack that follows the cursor */}
      {drag && (
        <div
          className={`card-drag-layer ${drag.snapping ? 'card-snap-back' : ''}`}
          style={{ left: drag.x, top: drag.y, width: 'var(--cw)' }}
        >
          {drag.cards.map((card, i) => (
            <div
              key={cardKey(card)}
              style={{ width: 'var(--cw)', height: 'var(--ch)', marginTop: i === 0 ? 0 : 'calc(var(--ch) * -0.72)' }}
            >
              <CardImg card={card} />
            </div>
          ))}
        </div>
      )}

      <p className="mt-5 border-2 border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
        <span className="font-bold text-[var(--ink)]">Tip:</span> drag cards with the mouse (or your finger) — valid piles light up green. A short click sends a card straight home. Build the four home piles from Ace to King by suit; on the table stack down in alternating colors, and only Kings fill an empty column. 🃏🦈
      </p>
    </main>
  )
}
