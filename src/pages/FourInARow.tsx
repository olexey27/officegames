import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import FullscreenButton from '../components/FullscreenButton'
import { ArrowIcon } from '../components/icons'
import {
  AI,
  bestMove,
  COLS,
  drop,
  emptyBoard,
  FIAR_LEVELS,
  HUMAN,
  isDraw,
  landingRow,
  ROWS,
  winningLine,
  type FiarLevel,
} from '../games/fourinarow/engine'

const LEVELS: FiarLevel[] = ['Beginner', 'Casual', 'Club', 'Pro']
const SCORE_KEY = 'sg-fiar-score'

type Score = { wins: number; losses: number; draws: number }

function parseLevel(value: string | null): FiarLevel {
  return LEVELS.includes(value as FiarLevel) ? (value as FiarLevel) : 'Beginner'
}

function readScore(): Score {
  if (typeof localStorage === 'undefined') return { wins: 0, losses: 0, draws: 0 }
  try {
    const stored = JSON.parse(localStorage.getItem(SCORE_KEY) ?? '')
    return { wins: stored.wins || 0, losses: stored.losses || 0, draws: stored.draws || 0 }
  } catch {
    return { wins: 0, losses: 0, draws: 0 }
  }
}

export default function FourInARow() {
  const [searchParams, setSearchParams] = useSearchParams()
  const difficulty = parseLevel(searchParams.get('difficulty'))

  const [moves, setMoves] = useState<number[]>([]) // dropped columns, in order
  const [starter, setStarter] = useState<typeof HUMAN | typeof AI>(HUMAN)
  const [thinking, setThinking] = useState(false)
  const [hintCol, setHintCol] = useState<number | null>(null)
  const [score, setScore] = useState<Score>(readScore)
  const counted = useRef(false)

  // Replay the move list into a board (single source of truth).
  const { board, lastIndex } = useMemo(() => {
    let b = emptyBoard()
    let last = -1
    let player = starter
    for (const col of moves) {
      const result = drop(b, col, player)
      if (!result) break
      b = result.board
      last = result.row * COLS + col
      player = player === HUMAN ? AI : HUMAN
    }
    return { board: b, lastIndex: last }
  }, [moves, starter])

  const win = useMemo(() => winningLine(board), [board])
  const draw = !win && isDraw(board)
  const over = win !== null || draw
  const turn = (moves.length % 2 === 0 ? starter : starter === HUMAN ? AI : HUMAN) as number

  const restart = (nextStarter: typeof HUMAN | typeof AI) => {
    setMoves([])
    setStarter(nextStarter)
    setHintCol(null)
    setThinking(false)
    counted.current = false
  }

  // Difficulty change resets the board.
  useEffect(() => {
    setMoves([])
    setHintCol(null)
    setThinking(false)
    counted.current = false
  }, [difficulty])

  // Sharkfish's turn.
  useEffect(() => {
    if (over || turn !== AI) return
    setThinking(true)
    const timer = setTimeout(() => {
      setMoves((prev) => {
        // Recompute from the latest state to stay consistent.
        let b = emptyBoard()
        let player = starter
        for (const col of prev) {
          const result = drop(b, col, player)
          if (!result) return prev
          b = result.board
          player = player === HUMAN ? AI : HUMAN
        }
        if (player !== AI || winningLine(b) || isDraw(b)) return prev
        const col = bestMove(b, AI, FIAR_LEVELS[difficulty])
        return col === null ? prev : [...prev, col]
      })
      setThinking(false)
    }, 450)
    return () => clearTimeout(timer)
  }, [moves, starter, difficulty, over, turn])

  // Count the result once per game.
  useEffect(() => {
    if (!over || counted.current) return
    counted.current = true
    setScore((prev) => {
      const next = { ...prev }
      if (win?.player === HUMAN) next.wins++
      else if (win?.player === AI) next.losses++
      else next.draws++
      if (typeof localStorage !== 'undefined') localStorage.setItem(SCORE_KEY, JSON.stringify(next))
      return next
    })
  }, [over, win])

  const playColumn = (col: number) => {
    if (over || thinking || turn !== HUMAN) return
    if (landingRow(board, col) === null) return
    setHintCol(null)
    setMoves((prev) => [...prev, col])
  }

  const showHint = () => {
    if (over || thinking || turn !== HUMAN) return
    setHintCol(bestMove(board, HUMAN, { timeMs: 400, maxDepth: 7, blunder: 0 }))
  }

  const undo = () => {
    if (thinking || moves.length === 0) return
    setHintCol(null)
    counted.current = false
    setMoves((prev) => {
      // Remove back to the state where it is the human's turn again.
      let count = 1
      const parity = (prev.length - 1) % 2
      const lastMover = parity === 0 ? starter : starter === HUMAN ? AI : HUMAN
      if (lastMover === AI && prev.length >= 2) count = 2
      return prev.slice(0, prev.length - count)
    })
  }

  const winSet = new Set(win?.line ?? [])
  const status = over
    ? win
      ? win.player === HUMAN
        ? 'Four in a row — you win! 🏆'
        : 'Sharkfish wins 🦈'
      : 'Board full — draw'
    : thinking
      ? 'Sharkfish is thinking…'
      : 'Your move — drop a disc'

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
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Four in a Row</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">You</div>
            <div className="font-display text-xl font-bold tabular-nums text-[var(--accent)]">{score.wins}</div>
          </div>
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Draws</div>
            <div className="font-display text-xl font-bold tabular-nums">{score.draws}</div>
          </div>
          <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Shark</div>
            <div className="font-display text-xl font-bold tabular-nums text-[#facc15]">{score.losses}</div>
          </div>
          <FullscreenButton />
        </div>
      </div>

      {/* Difficulty + who starts */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="anim-outline anim-outline-slow inline-flex border-2 border-[var(--line)] bg-[var(--surface)] p-1 text-sm font-bold">
          {LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setSearchParams({ difficulty: level })}
              className={`px-4 py-1.5 font-display text-xs uppercase transition ${difficulty === level ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}
              title={FIAR_LEVELS[level].label}
            >
              {level}
            </button>
          ))}
        </div>
        <div className="inline-flex border-2 border-[var(--line)] bg-[var(--surface)] p-1">
          <button onClick={() => restart(HUMAN)} className={`px-3 py-1.5 font-display text-xs font-bold uppercase transition ${starter === HUMAN ? 'bg-[var(--ink)] text-[var(--canvas)]' : 'text-[var(--muted)]'}`}>You start</button>
          <button onClick={() => restart(AI)} className={`px-3 py-1.5 font-display text-xs font-bold uppercase transition ${starter === AI ? 'bg-[var(--ink)] text-[var(--canvas)]' : 'text-[var(--muted)]'}`}>Shark starts</button>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">Sharkfish: {FIAR_LEVELS[difficulty].label}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        {/* Board */}
        <div className="anim-outline relative mx-auto w-full max-w-[520px]">
          {/* Hint / turn markers above the columns */}
          <div className="grid grid-cols-7 pb-1">
            {Array.from({ length: COLS }, (_, col) => (
              <div key={col} className="grid place-items-center font-display text-sm font-bold">
                {hintCol === col ? <span className="text-[#38bdf8]">▼</span> : null}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 overflow-hidden border-2 border-[var(--ink)] bg-[var(--surface)] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,.12)]" role="application" aria-label="Four in a Row board">
            {Array.from({ length: COLS }, (_, col) => (
              <button
                key={col}
                onClick={() => playColumn(col)}
                disabled={over || thinking || turn !== HUMAN || landingRow(board, col) === null}
                className="group flex flex-col gap-1.5 p-0.5"
                aria-label={`Drop in column ${col + 1}`}
              >
                {Array.from({ length: ROWS }, (_, row) => {
                  const index = row * COLS + col
                  const cell = board[index]
                  const isLast = index === lastIndex
                  const isWinDisc = winSet.has(index)
                  return (
                    <span key={row} className="round-disc relative block aspect-square w-full bg-[#0b0b0e]" style={{ boxShadow: 'inset 0 3px 6px rgba(0,0,0,.8)' }}>
                      {cell !== 0 && (
                        <span
                          className={`round-disc absolute inset-[8%] ${isLast ? 'disc-drop' : ''} ${isWinDisc ? 'disc-win' : ''}`}
                          style={{
                            ['--rows' as never]: row + 1,
                            background: cell === HUMAN ? '#ff4b4d' : '#facc15',
                            boxShadow: 'inset 3px 3px 0 rgba(255,255,255,.35), inset -3px -3px 0 rgba(0,0,0,.3)',
                          }}
                        />
                      )}
                      {cell === 0 && turn === HUMAN && !over && !thinking && landingRow(board, col) === row && (
                        <span className="round-disc absolute inset-[8%] opacity-0 transition-opacity group-hover:opacity-40" style={{ background: '#ff4b4d' }} />
                      )}
                    </span>
                  )
                })}
              </button>
            ))}
          </div>

          {/* Game over overlay */}
          {over && (
            <div className="absolute inset-0 grid place-items-center bg-[color:var(--canvas)]/85 backdrop-blur-sm">
              <div className="border-2 border-[var(--accent)] bg-[var(--surface)] px-8 py-7 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">Game over</p>
                <p className="mt-2 font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
                  {win ? (win.player === HUMAN ? 'You win! 🏆' : 'Sharkfish wins 🦈') : 'Draw!'}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">{Math.ceil(moves.length / 2)} moves · {difficulty}</p>
                <button onClick={() => restart(starter)} className="retro-btn mt-5 bg-[var(--accent)] px-6 py-2.5 font-display text-xs font-bold uppercase text-white">
                  Play again ↗
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

          <div className="flex items-center justify-center gap-6 border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-xs font-bold">
            <span className="inline-flex items-center gap-2"><span className="round-disc inline-block size-4" style={{ background: '#ff4b4d' }} /> You</span>
            <span className="inline-flex items-center gap-2"><span className="round-disc inline-block size-4" style={{ background: '#facc15' }} /> Sharkfish</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={showHint} disabled={over || thinking || turn !== HUMAN} className="retro-btn bg-[var(--surface)] px-3 py-2.5 font-display text-[10px] font-bold uppercase disabled:opacity-40">
              💡 Hint
            </button>
            <button onClick={undo} disabled={thinking || moves.length === 0} className="retro-btn bg-[var(--surface)] px-3 py-2.5 font-display text-[10px] font-bold uppercase disabled:opacity-40">
              Undo move
            </button>
          </div>
          <button onClick={() => restart(starter)} className="retro-btn bg-[var(--accent)] px-3 py-3 font-display text-[11px] font-bold uppercase text-white">
            New game
          </button>

          <p className="border-2 border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
            <span className="font-bold text-[var(--ink)]">Tip:</span> connect four discs in any direction — across, down or diagonally. Grab the center column early, and always check what Sharkfish threatens before you drop. 💡 Hint helps when you&apos;re stuck. 🦈
          </p>
        </div>
      </div>
    </main>
  )
}
