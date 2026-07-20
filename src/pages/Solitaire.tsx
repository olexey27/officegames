import { useCallback, useEffect, useState } from 'react'
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

type Mode = 'Draw 1' | 'Draw 3'
const MODES: Mode[] = ['Draw 1', 'Draw 3']

function parseMode(value: string | null): Mode {
  return value === 'Draw 3' ? 'Draw 3' : 'Draw 1'
}

function cardSrc(card: Card): string {
  return card.faceUp ? `${ASSET}/card-${SUIT_NAMES[card.suit]}-${RANK_NAMES[card.rank]}.svg` : `${ASSET}/card-back.svg`
}

type Sel =
  | { type: 'waste' }
  | { type: 'tableau'; pile: number; index: number }
  | { type: 'foundation'; pile: number }
  | null

function CardImg({ card, className, style }: { card: Card; className?: string; style?: React.CSSProperties }) {
  return (
    <img
      src={cardSrc(card)}
      alt=""
      draggable={false}
      className={`pointer-events-none block h-full w-full select-none ${className ?? ''}`}
      style={{ imageRendering: 'pixelated', ...style }}
    />
  )
}

export default function Solitaire() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = parseMode(searchParams.get('difficulty'))

  const [game, setGame] = useState<Game>(() => newGame(mode === 'Draw 3' ? 3 : 1))
  const [undoStack, setUndoStack] = useState<Game[]>([])
  const [selected, setSelected] = useState<Sel>(null)
  const [hintCards, setHintCards] = useState<Set<string>>(new Set())
  const [seconds, setSeconds] = useState(0)
  const [started, setStarted] = useState(false)

  const won = isWon(game)

  const reset = useCallback((drawCount: 1 | 3) => {
    setGame(newGame(drawCount))
    setUndoStack([])
    setSelected(null)
    setHintCards(new Set())
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

  // Snapshot the PREVIOUS game before mutation; capture via functional set.
  const push = useCallback((producer: (g: Game) => Game | null) => {
    setGame((current) => {
      const next = producer(current)
      if (!next) return current
      setUndoStack((prev) => [...prev.slice(-99), current])
      setStarted(true)
      setHintCards(new Set())
      return next
    })
    setSelected(null)
  }, [])

  const undo = () => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev
      setGame(prev[prev.length - 1])
      return prev.slice(0, -1)
    })
    setSelected(null)
    setHintCards(new Set())
  }

  const onStock = () => push((g) => draw(g))

  const onWaste = () => {
    const top = game.waste[game.waste.length - 1]
    if (!top) return
    if (selected?.type === 'waste') { setSelected(null); return }
    setSelected({ type: 'waste' })
  }

  const onFoundation = (fi: number) => {
    if (selected) {
      if (selected.type === 'waste') { push((g) => moveToFoundation(g, 'waste')); return }
      if (selected.type === 'tableau') { push((g) => moveToFoundation(g, selected.pile)); return }
      setSelected(null)
      return
    }
    const top = game.foundations[fi][game.foundations[fi].length - 1]
    if (top) setSelected({ type: 'foundation', pile: fi })
  }

  const onTableau = (pileIndex: number, cardIndex: number) => {
    const pile = game.tableau[pileIndex]
    const clicked = pile[cardIndex]
    if (selected) {
      let moved = false
      if (selected.type === 'waste') moved = tryPush((g) => moveWasteToTableau(g, pileIndex))
      else if (selected.type === 'foundation') moved = tryPush((g) => moveFoundationToTableau(g, selected.pile, pileIndex))
      else if (selected.type === 'tableau') moved = tryPush((g) => moveTableauRun(g, selected.pile, selected.index, pileIndex))
      if (moved) return
      // fall through: maybe re-select the clicked card
    }
    if (clicked && clicked.faceUp) setSelected({ type: 'tableau', pile: pileIndex, index: cardIndex })
    else setSelected(null)
  }

  // Like push but reports whether it changed anything (for re-select fallback).
  const tryPush = (producer: (g: Game) => Game | null): boolean => {
    const next = producer(game)
    if (!next) return false
    setUndoStack((prev) => [...prev.slice(-99), game])
    setGame(next)
    setStarted(true)
    setHintCards(new Set())
    setSelected(null)
    return true
  }

  const onDoubleCard = (source: 'waste' | number) => {
    push((g) => moveToFoundation(g, source))
  }

  const showHint = () => {
    const h = hint(game)
    if (!h) return
    setStarted(true)
    if (h.kind === 'draw') { setHintCards(new Set(['stock'])); return }
    const marks = new Set<string>()
    if (h.kind === 'foundation') {
      const src = h.source === 'waste' ? game.waste[game.waste.length - 1] : game.tableau[h.source][game.tableau[h.source].length - 1]
      if (src) marks.add(`${src.rank}-${src.suit}`)
    } else {
      const card = h.from === 'waste' ? game.waste[game.waste.length - 1] : game.tableau[h.from][h.cardIndex]
      if (card) marks.add(`${card.rank}-${card.suit}`)
    }
    setHintCards(marks)
  }

  const autoFinish = () => {
    let g = game
    const steps: Game[] = []
    for (let i = 0; i < 60 && !isWon(g); i++) {
      let moved = false
      for (const src of ['waste', 0, 1, 2, 3, 4, 5, 6] as const) {
        const next = moveToFoundation(g, src)
        if (next) { g = next; steps.push(g); moved = true; break }
      }
      if (!moved) break
    }
    if (steps.length > 0) { setGame(g); setSelected(null) }
  }

  const isHinted = (card: Card) => hintCards.has(`${card.rank}-${card.suit}`)
  const selKey = selected

  // Card metric — responsive via CSS var.
  const cardStyle = { width: 'var(--cw)', height: 'var(--ch)' } as React.CSSProperties

  return (
    <main className="mx-auto min-h-[calc(100vh-68px)] max-w-[1240px] px-5 py-8 lg:px-8 lg:py-12" style={{ ['--cw' as never]: 'min(12.5vw, 78px)', ['--ch' as never]: 'calc(var(--cw) * 1.5)' }}>
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
      <div className="relative overflow-x-auto border-2 border-[var(--ink)] p-3 sm:p-5" style={{ background: 'linear-gradient(160deg, #14402a, #0c2418)' }}>
        {/* Top row: stock, waste, spacer, foundations */}
        <div className="flex items-start gap-[2%]">
          {/* Stock */}
          <button onClick={onStock} className={`shrink-0 border-2 ${hintCards.has('stock') ? 'border-[#38bdf8]' : 'border-white/25'}`} style={cardStyle} aria-label="Draw from stock">
            {game.stock.length > 0 ? (
              <CardImg card={{ rank: 0, suit: 0, faceUp: false }} />
            ) : (
              <span className="grid h-full w-full place-items-center text-2xl text-white/50">↻</span>
            )}
          </button>

          {/* Waste — show up to 3 fanned */}
          <div className="relative shrink-0" style={{ width: 'var(--cw)', height: 'var(--ch)' }}>
            {game.waste.slice(-3).map((card, i, arr) => {
              const isTop = i === arr.length - 1
              return (
                <button
                  key={`${card.rank}-${card.suit}`}
                  onClick={isTop ? onWaste : undefined}
                  onDoubleClick={isTop ? () => onDoubleCard('waste') : undefined}
                  className={`absolute top-0 border-2 ${isTop && selKey?.type === 'waste' ? 'border-[var(--accent)]' : isTop && isHinted(card) ? 'border-[#38bdf8]' : 'border-transparent'}`}
                  style={{ left: `calc(${i} * var(--cw) * 0.22)`, width: 'var(--cw)', height: 'var(--ch)', zIndex: i }}
                  aria-label={isTop ? 'Waste top' : undefined}
                >
                  <CardImg card={card} />
                </button>
              )
            })}
            {game.waste.length === 0 && <div className="h-full w-full border-2 border-dashed border-white/15" />}
          </div>

          <div className="shrink-0" style={{ width: 'var(--cw)' }} />

          {/* Foundations */}
          {game.foundations.map((f, fi) => {
            const top = f[f.length - 1]
            return (
              <button
                key={fi}
                onClick={() => onFoundation(fi)}
                className={`shrink-0 border-2 ${selKey?.type === 'foundation' && selKey.pile === fi ? 'border-[var(--accent)]' : 'border-white/25'}`}
                style={cardStyle}
                aria-label={`Foundation ${fi + 1}`}
              >
                {top ? <CardImg card={top} /> : <span className="grid h-full w-full place-items-center text-xl text-white/25">A↑</span>}
              </button>
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
              <div key={pi} className="relative flex-1" style={{ height: `calc(var(--ch) * ${height})`, minWidth: 'var(--cw)' }}>
                {pile.length === 0 && (
                  <button onClick={() => onTableau(pi, 0)} className="absolute inset-x-0 top-0 border-2 border-dashed border-white/15" style={{ height: 'var(--ch)' }} aria-label={`Empty column ${pi + 1}`} />
                )}
                {pile.map((card, ci) => {
                  const selectedHere = selKey?.type === 'tableau' && selKey.pile === pi && ci >= selKey.index
                  return (
                    <button
                      key={ci}
                      onClick={() => onTableau(pi, ci)}
                      onDoubleClick={card.faceUp && ci === pile.length - 1 ? () => onDoubleCard(pi) : undefined}
                      className={`absolute inset-x-0 border-2 ${selectedHere ? 'border-[var(--accent)]' : isHinted(card) && card.faceUp ? 'border-[#38bdf8]' : 'border-transparent'}`}
                      style={{ top: `calc(var(--ch) * ${tops[ci]})`, height: 'var(--ch)', zIndex: ci }}
                      aria-label={card.faceUp ? `${RANK_NAMES[card.rank]} ${SUIT_NAMES[card.suit]}` : 'Face-down card'}
                    >
                      <CardImg card={card} />
                    </button>
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

      <p className="mt-5 border-2 border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
        <span className="font-bold text-[var(--ink)]">Tip:</span> build the four home piles up from Ace to King by suit. On the table, stack down in alternating colors (red on black, black on red); only Kings fill an empty column. Click a card then its destination, or double-click to send it home. 🃏🦈
      </p>
    </main>
  )
}
