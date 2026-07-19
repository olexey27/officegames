import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Chess, type Square } from 'chess.js'
import FullscreenButton from '../components/FullscreenButton'
import { ArrowIcon } from '../components/icons'
import { bestMove, CHESS_LEVELS, PIECE_GLYPHS, type ChessLevel } from '../games/chess/engine'

const LEVELS: ChessLevel[] = ['Beginner', 'Casual', 'Club', 'Pro']
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const PIECE_POINTS: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 }

const LIGHT_SQ = '#efe5db'
const DARK_SQ = '#9c4f53'

function parseLevel(value: string | null): ChessLevel {
  return LEVELS.includes(value as ChessLevel) ? (value as ChessLevel) : 'Beginner'
}

function Glyph({ color, type, size = 'text-base' }: { color: string; type: string; size?: string }) {
  return (
    <span
      className={`${size} leading-none`}
      style={{ color: color === 'w' ? '#ffffff' : '#17171a', textShadow: color === 'w' ? '0 1px 1px rgba(0,0,0,.65)' : '0 1px 1px rgba(255,255,255,.2)' }}
    >
      {PIECE_GLYPHS[color + type]}
    </span>
  )
}

export default function ChessPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const difficulty = parseLevel(searchParams.get('difficulty'))

  const chessRef = useRef(new Chess())
  const [version, setVersion] = useState(0)
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w')
  const [selected, setSelected] = useState<string | null>(null)
  const [hint, setHint] = useState<{ from: string; to: string } | null>(null)
  const [promo, setPromo] = useState<{ from: string; to: string } | null>(null)
  const [thinking, setThinking] = useState(false)

  const bump = () => setVersion((v) => v + 1)
  const chess = chessRef.current
  const gameOver = chess.isGameOver()

  const restart = (color: 'w' | 'b') => {
    chessRef.current = new Chess()
    setPlayerColor(color)
    setSelected(null)
    setHint(null)
    setPromo(null)
    setThinking(false)
    bump()
  }

  // Difficulty change starts a fresh game.
  useEffect(() => {
    chessRef.current = new Chess()
    setSelected(null)
    setHint(null)
    setPromo(null)
    setThinking(false)
    setVersion((v) => v + 1)
  }, [difficulty])

  // Sharkfish moves whenever it's the AI's turn.
  useEffect(() => {
    const current = chessRef.current
    if (current.isGameOver() || current.turn() === playerColor) return
    setThinking(true)
    const timer = setTimeout(() => {
      const c = chessRef.current
      if (!c.isGameOver() && c.turn() !== playerColor) {
        const move = bestMove(c, CHESS_LEVELS[difficulty])
        if (move) c.move(move)
      }
      setThinking(false)
      setVersion((v) => v + 1)
    }, 400)
    return () => clearTimeout(timer)
  }, [version, playerColor, difficulty])

  const targets = useMemo(
    () => (selected ? chess.moves({ square: selected as Square, verbose: true }) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, version],
  )

  const history = chess.history({ verbose: true })
  const lastMove = history.length > 0 ? history[history.length - 1] : null
  const checkedKing = useMemo(() => {
    if (!chess.inCheck()) return null
    const board = chess.board()
    for (let row = 0; row < 8; row++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[row][file]
        if (piece && piece.type === 'k' && piece.color === chess.turn()) return FILES[file] + (8 - row)
      }
    }
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  const doMove = (from: string, to: string, promotion?: string) => {
    try {
      chess.move({ from, to, promotion })
    } catch {
      return
    }
    setSelected(null)
    setHint(null)
    setPromo(null)
    bump()
  }

  const onSquare = (square: string, piece: { type: string; color: string } | null) => {
    if (thinking || gameOver || promo || chess.turn() !== playerColor) return
    const candidates = targets.filter((t) => t.to === square)
    if (selected && candidates.length > 0) {
      if (candidates[0].promotion) setPromo({ from: selected, to: square })
      else doMove(selected, square)
      return
    }
    setSelected(piece && piece.color === playerColor ? square : null)
  }

  const showHint = () => {
    if (thinking || gameOver || chess.turn() !== playerColor) return
    const move = bestMove(chess, { timeMs: 500, maxDepth: 3, blunder: 0 })
    if (move) setHint({ from: move.from, to: move.to })
  }

  const undo = () => {
    if (thinking || history.length === 0) return
    chess.undo()
    if (chess.turn() !== playerColor) chess.undo()
    setSelected(null)
    setHint(null)
    bump()
  }

  // Captured pieces per side, from the move history.
  const capturedByPlayer: string[] = []
  const capturedByAI: string[] = []
  let material = 0
  for (const move of history) {
    if (!move.captured) continue
    if (move.color === playerColor) {
      capturedByPlayer.push(move.captured)
      material += PIECE_POINTS[move.captured] ?? 0
    } else {
      capturedByAI.push(move.captured)
      material -= PIECE_POINTS[move.captured] ?? 0
    }
  }

  const san = chess.history()
  const movePairs: [string, string | undefined][] = []
  for (let i = 0; i < san.length; i += 2) movePairs.push([san[i], san[i + 1]])

  const board = chess.board()
  const rows = playerColor === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]
  const files = playerColor === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]

  const status = gameOver
    ? chess.isCheckmate()
      ? chess.turn() === playerColor
        ? 'Checkmate — Sharkfish wins 🦈'
        : 'Checkmate — you win! 🏆'
      : 'Draw'
    : thinking
      ? 'Sharkfish is thinking…'
      : chess.turn() === playerColor
        ? chess.inCheck()
          ? 'Check — defend your king!'
          : 'Your move'
        : 'Waiting…'

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
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Chess</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Material</div>
            <div className={`font-display text-xl font-bold tabular-nums ${material > 0 ? 'text-[#4ade80]' : material < 0 ? 'text-[var(--accent)]' : ''}`}>{material > 0 ? `+${material}` : material}</div>
          </div>
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Moves</div>
            <div className="font-display text-xl font-bold tabular-nums">{Math.ceil(san.length / 2)}</div>
          </div>
          <FullscreenButton />
        </div>
      </div>

      {/* Difficulty + color */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="anim-outline anim-outline-slow inline-flex border-2 border-[var(--line)] bg-[var(--surface)] p-1 text-sm font-bold">
          {LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setSearchParams({ difficulty: level })}
              className={`px-4 py-1.5 font-display text-xs uppercase transition ${difficulty === level ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}
              title={CHESS_LEVELS[level].label}
            >
              {level}
            </button>
          ))}
        </div>
        <div className="inline-flex border-2 border-[var(--line)] bg-[var(--surface)] p-1">
          <button onClick={() => restart('w')} className={`px-3 py-1.5 font-display text-xs font-bold uppercase transition ${playerColor === 'w' ? 'bg-[var(--ink)] text-[var(--canvas)]' : 'text-[var(--muted)]'}`}>♔ White</button>
          <button onClick={() => restart('b')} className={`px-3 py-1.5 font-display text-xs font-bold uppercase transition ${playerColor === 'b' ? 'bg-[var(--ink)] text-[var(--canvas)]' : 'text-[var(--muted)]'}`}>♚ Black</button>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">Sharkfish: {CHESS_LEVELS[difficulty].label}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        {/* Board */}
        <div className="anim-outline relative mx-auto w-full max-w-[540px]">
          <div className="grid grid-cols-8 border-2 border-[var(--ink)] shadow-[0_20px_60px_rgba(0,0,0,.12)]" role="application" aria-label="Chess board">
            {rows.map((row) =>
              files.map((file) => {
                const square = FILES[file] + (8 - row)
                const piece = board[row][file]
                const isDark = (row + file) % 2 === 1
                const target = targets.find((t) => t.to === square)
                const isLast = lastMove !== null && (lastMove.from === square || lastMove.to === square)
                const isHint = hint !== null && (hint.from === square || hint.to === square)
                const isSelected = selected === square
                const isCheck = checkedKing === square

                let overlay: string | undefined
                if (isLast) overlay = 'rgba(250,204,21,.3)'
                if (isCheck) overlay = 'rgba(233,49,49,.55)'

                let ring: string | undefined
                if (isSelected) ring = 'inset 0 0 0 3px #e93131'
                else if (isHint) ring = 'inset 0 0 0 3px #38bdf8'
                else if (target && piece) ring = 'inset 0 0 0 3px rgba(233,49,49,.75)'

                return (
                  <button
                    key={square}
                    onClick={() => onSquare(square, piece)}
                    className="relative grid aspect-square place-items-center"
                    style={{ background: isDark ? DARK_SQ : LIGHT_SQ }}
                    aria-label={`${square}${piece ? `, ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
                  >
                    {overlay && <span className="absolute inset-0" style={{ background: overlay }} />}
                    {ring && <span className="absolute inset-0" style={{ boxShadow: ring }} />}
                    {target && !piece && <span className="absolute size-3 bg-[#e93131]/70" />}
                    {piece && <span className="relative"><Glyph color={piece.color} type={piece.type} size="text-[26px] sm:text-[38px]" /></span>}
                    {file === files[0] && <span className={`absolute left-0.5 top-0.5 font-mono text-[8px] font-bold ${isDark ? 'text-white/60' : 'text-black/40'}`}>{8 - row}</span>}
                    {row === rows[7] && <span className={`absolute bottom-0.5 right-1 font-mono text-[8px] font-bold ${isDark ? 'text-white/60' : 'text-black/40'}`}>{FILES[file]}</span>}
                  </button>
                )
              }),
            )}
          </div>

          {/* Promotion picker */}
          {promo && (
            <div className="absolute inset-0 grid place-items-center bg-[#0b0b0e]/70">
              <div className="border-2 border-[var(--accent)] bg-[var(--surface)] p-4 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)]">Promote to</p>
                <div className="mt-3 flex gap-2">
                  {(['q', 'r', 'b', 'n'] as const).map((type) => (
                    <button key={type} onClick={() => doMove(promo.from, promo.to, type)} className="retro-btn grid size-12 place-items-center bg-[var(--surface)]">
                      <Glyph color={playerColor} type={type} size="text-2xl" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Game over overlay */}
          {gameOver && (
            <div className="absolute inset-0 grid place-items-center bg-[color:var(--canvas)]/85 backdrop-blur-sm">
              <div className="border-2 border-[var(--accent)] bg-[var(--surface)] px-8 py-7 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">Game over</p>
                <p className="mt-2 font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
                  {chess.isCheckmate() ? (chess.turn() === playerColor ? 'Sharkfish wins 🦈' : 'You win! 🏆') : chess.isStalemate() ? 'Stalemate — draw' : 'Draw'}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">{Math.ceil(san.length / 2)} moves · {difficulty}</p>
                <button onClick={() => restart(playerColor)} className="retro-btn mt-5 bg-[var(--accent)] px-6 py-2.5 font-display text-xs font-bold uppercase text-white">
                  New game ↗
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-5">
          <p className="border-2 border-[var(--ink)] bg-[var(--surface)] px-4 py-3 text-center font-display text-[11px] font-bold uppercase tracking-tight" aria-live="polite">
            {status}
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={showHint} disabled={thinking || gameOver || chess.turn() !== playerColor} className="retro-btn bg-[var(--surface)] px-3 py-2.5 font-display text-[10px] font-bold uppercase disabled:opacity-40">
              💡 Hint
            </button>
            <button onClick={undo} disabled={thinking || history.length === 0} className="retro-btn bg-[var(--surface)] px-3 py-2.5 font-display text-[10px] font-bold uppercase disabled:opacity-40">
              Undo move
            </button>
          </div>
          <button onClick={() => restart(playerColor)} className="retro-btn bg-[var(--accent)] px-3 py-3 font-display text-[11px] font-bold uppercase text-white">
            New game
          </button>

          {/* Captures */}
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] p-4 text-sm">
            <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Captured</p>
            <div className="mt-2 flex min-h-6 flex-wrap items-center gap-0.5">
              <span className="mr-1 font-display text-[10px] font-bold uppercase">You:</span>
              {capturedByPlayer.length === 0 ? <span className="font-mono text-[10px] text-[var(--muted)]">—</span> : capturedByPlayer.map((type, i) => <Glyph key={i} color={playerColor === 'w' ? 'b' : 'w'} type={type} />)}
            </div>
            <div className="mt-1 flex min-h-6 flex-wrap items-center gap-0.5">
              <span className="mr-1 font-display text-[10px] font-bold uppercase">Shark:</span>
              {capturedByAI.length === 0 ? <span className="font-mono text-[10px] text-[var(--muted)]">—</span> : capturedByAI.map((type, i) => <Glyph key={i} color={playerColor} type={type} />)}
            </div>
          </div>

          {/* Move list */}
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Moves</p>
            <div className="mt-2 max-h-36 overflow-y-auto font-mono text-xs leading-6">
              {movePairs.length === 0 && <span className="text-[var(--muted)]">No moves yet</span>}
              {[...movePairs].reverse().map(([white, black], i) => {
                const number = movePairs.length - i
                return (
                  <div key={number} className="flex gap-3">
                    <span className="w-6 text-[var(--muted)]">{number}.</span>
                    <span className="w-14">{white}</span>
                    <span>{black ?? ''}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="border-2 border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
            <span className="font-bold text-[var(--ink)]">Tip:</span> click a piece to see all its legal moves. Control the center, develop knights and bishops early, and castle to keep your king safe. Stuck? 💡 Hint shows you a strong move. 🦈
          </p>
        </div>
      </div>
    </main>
  )
}
