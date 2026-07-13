import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowIcon } from '../components/icons'
import {
  boxOf,
  colOf,
  DIFFICULTY_CLUES,
  findConflicts,
  generatePuzzle,
  isComplete,
  rowOf,
  type Board,
  type Difficulty,
  type Puzzle,
} from '../games/sudoku/engine'

const DIFFICULTIES: Difficulty[] = ['Easy', 'Classic', 'Hard']

function parseDifficulty(value: string | null): Difficulty {
  return DIFFICULTIES.includes(value as Difficulty) ? (value as Difficulty) : 'Classic'
}

type Snapshot = { values: Board; notes: number[][] }

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Sudoku() {
  const [searchParams, setSearchParams] = useSearchParams()
  const difficulty = parseDifficulty(searchParams.get('difficulty'))

  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle(difficulty))
  const [values, setValues] = useState<Board>(() => puzzle.puzzle.slice())
  const [notes, setNotes] = useState<number[][]>(() => Array.from({ length: 81 }, () => []))
  const [selected, setSelected] = useState<number | null>(null)
  const [notesMode, setNotesMode] = useState(false)
  const [history, setHistory] = useState<Snapshot[]>([])
  const [seconds, setSeconds] = useState(0)
  const [won, setWon] = useState(false)

  const boardRef = useRef<HTMLDivElement>(null)

  // Start a fresh game for the given difficulty.
  const newGame = useCallback((diff: Difficulty) => {
    const next = generatePuzzle(diff)
    setPuzzle(next)
    setValues(next.puzzle.slice())
    setNotes(Array.from({ length: 81 }, () => []))
    setHistory([])
    setSelected(null)
    setSeconds(0)
    setWon(false)
  }, [])

  // Regenerate whenever the difficulty in the URL changes.
  useEffect(() => {
    newGame(difficulty)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty])

  // Timer ticks until the puzzle is solved.
  useEffect(() => {
    if (won) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [won])

  const conflicts = useMemo(() => findConflicts(values), [values])

  // Win check.
  useEffect(() => {
    if (!won && isComplete(values)) setWon(true)
  }, [values, won])

  const pushHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-49), { values: values.slice(), notes: notes.map((n) => n.slice()) }])
  }, [values, notes])

  const setCellValue = useCallback(
    (index: number, value: number) => {
      if (puzzle.given[index] || won) return
      pushHistory()
      if (notesMode && value !== 0) {
        setNotes((prev) => {
          const next = prev.map((n) => n.slice())
          const cell = next[index]
          const at = cell.indexOf(value)
          if (at === -1) cell.push(value)
          else cell.splice(at, 1)
          return next
        })
        return
      }
      setValues((prev) => {
        const next = prev.slice()
        next[index] = next[index] === value ? 0 : value
        return next
      })
      // Placing a real value clears that cell's pencil marks.
      if (value !== 0) {
        setNotes((prev) => {
          const next = prev.map((n) => n.slice())
          next[index] = []
          return next
        })
      }
    },
    [puzzle.given, won, notesMode, pushHistory],
  )

  const eraseCell = useCallback(
    (index: number) => {
      if (puzzle.given[index] || won) return
      pushHistory()
      setValues((prev) => {
        const next = prev.slice()
        next[index] = 0
        return next
      })
      setNotes((prev) => {
        const next = prev.map((n) => n.slice())
        next[index] = []
        return next
      })
    },
    [puzzle.given, won, pushHistory],
  )

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h
      const last = h[h.length - 1]
      setValues(last.values)
      setNotes(last.notes)
      return h.slice(0, -1)
    })
  }, [])

  const hint = useCallback(() => {
    if (selected === null || puzzle.given[selected] || won) return
    if (values[selected] === puzzle.solution[selected]) return
    pushHistory()
    setValues((prev) => {
      const next = prev.slice()
      next[selected] = puzzle.solution[selected]
      return next
    })
    setNotes((prev) => {
      const next = prev.map((n) => n.slice())
      next[selected] = []
      return next
    })
  }, [selected, puzzle, values, won, pushHistory])

  // Keyboard: digits, erase, arrow navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selected === null) return
      if (e.key >= '1' && e.key <= '9') {
        setCellValue(selected, Number(e.key))
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        eraseCell(selected)
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault()
        const r = rowOf(selected)
        const c = colOf(selected)
        let nr = r
        let nc = c
        if (e.key === 'ArrowUp') nr = (r + 8) % 9
        if (e.key === 'ArrowDown') nr = (r + 1) % 9
        if (e.key === 'ArrowLeft') nc = (c + 8) % 9
        if (e.key === 'ArrowRight') nc = (c + 1) % 9
        setSelected(nr * 9 + nc)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, setCellValue, eraseCell])

  // How many of each digit are still unplaced (for the number pad badges).
  const remaining = useMemo(() => {
    const counts: Record<number, number> = { 1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9 }
    for (const v of values) if (v !== 0) counts[v]--
    return counts
  }, [values])

  const selectedValue = selected !== null ? values[selected] : 0
  const filledCount = values.filter((v) => v !== 0).length

  return (
    <main className="office-grid mx-auto min-h-[calc(100vh-68px)] max-w-[1240px] px-5 py-8 lg:px-8 lg:py-12">
      {/* Ad slot — kept in the layout so it feels native, not bolted on. */}
      <div className="mb-6 flex items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] py-3 text-center font-mono text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">
        <span className="size-1.5 rounded-full bg-[var(--accent)]" /> Ad space — designed to stay out of your way
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/" className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)] transition hover:text-[var(--accent)]">
            <span className="rotate-180"><ArrowIcon /></span> Back to games
          </Link>
          <h1 className="font-display text-4xl font-bold tracking-[-.06em] sm:text-5xl">Sudoku</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Time</div>
            <div className="font-display text-xl font-bold tabular-nums">{formatTime(seconds)}</div>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Filled</div>
            <div className="font-display text-xl font-bold tabular-nums">{filledCount}/81</div>
          </div>
        </div>
      </div>

      {/* Difficulty tabs */}
      <div className="mb-6 inline-flex rounded-full border border-[var(--line)] bg-[var(--surface)] p-1 text-sm font-bold">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => setSearchParams({ difficulty: d })}
            className={`rounded-full px-4 py-1.5 transition ${difficulty === d ? 'bg-[var(--accent)] text-white shadow-[0_6px_18px_var(--glow)]' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}
          >
            {d}
            <span className="ml-1.5 font-mono text-[9px] opacity-70">{DIFFICULTY_CLUES[d]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        {/* Board */}
        <div className="relative mx-auto w-full max-w-[540px]">
          <div
            ref={boardRef}
            className="grid aspect-square grid-cols-9 overflow-hidden rounded-2xl border-2 border-[var(--ink)] bg-[var(--surface)] shadow-[0_20px_60px_rgba(0,0,0,.12)]"
          >
            {values.map((value, index) => {
              const r = rowOf(index)
              const c = colOf(index)
              const given = puzzle.given[index]
              const isSelected = selected === index
              const inConflict = conflicts.has(index)
              const sameUnit =
                selected !== null &&
                (rowOf(selected) === r || colOf(selected) === c || boxOf(selected) === boxOf(index))
              const sameValue = selectedValue !== 0 && value === selectedValue && !isSelected

              const borderRight = c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-[var(--ink)]' : 'border-r border-r-[var(--line)]'
              const borderBottom = r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-[var(--ink)]' : 'border-b border-b-[var(--line)]'

              let bg = 'bg-[var(--surface)]'
              if (sameUnit) bg = 'bg-[var(--surface-soft)]'
              if (sameValue) bg = 'bg-[color:var(--accent)]/15'
              if (isSelected) bg = 'bg-[color:var(--accent)]/25'
              if (inConflict) bg = 'bg-red-500/25'

              let text = 'text-[var(--ink)]'
              if (!given) text = 'text-[var(--accent)]'
              if (inConflict) text = 'text-red-500'

              return (
                <button
                  key={index}
                  onClick={() => setSelected(index)}
                  className={`relative grid aspect-square place-items-center font-display text-xl font-bold transition-colors sm:text-2xl ${borderRight} ${borderBottom} ${bg} ${text}`}
                  aria-label={`Cell row ${r + 1} column ${c + 1}${value ? `, value ${value}` : ', empty'}`}
                >
                  {value !== 0 ? (
                    value
                  ) : notes[index].length > 0 ? (
                    <span className="grid size-full grid-cols-3 grid-rows-3 p-0.5 text-[8px] font-semibold leading-none text-[var(--muted)] sm:text-[10px]">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <span key={n} className="grid place-items-center">
                          {notes[index].includes(n) ? n : ''}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>

          {won && (
            <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[color:var(--canvas)]/80 backdrop-blur-sm">
              <div className="rounded-2xl border border-[var(--accent)] bg-[var(--surface)] px-8 py-7 text-center shadow-[0_20px_60px_var(--glow)]">
                <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">Solved</p>
                <p className="mt-2 font-display text-3xl font-bold tracking-[-.05em]">Nice reset! 🎉</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{difficulty} · {formatTime(seconds)}</p>
                <button onClick={() => newGame(difficulty)} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[var(--accent-deep)]">
                  Play again <ArrowIcon />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-5">
          {/* Number pad */}
          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
              const done = remaining[n] <= 0
              return (
                <button
                  key={n}
                  onClick={() => selected !== null && setCellValue(selected, n)}
                  disabled={selected === null || done}
                  className={`relative grid aspect-[4/3] place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] font-display text-2xl font-bold transition enabled:hover:border-[var(--accent)] enabled:hover:-translate-y-0.5 disabled:opacity-30 ${done ? 'text-[var(--muted)]' : 'text-[var(--ink)]'}`}
                >
                  {n}
                  {!done && <span className="absolute bottom-1 right-1.5 font-mono text-[8px] text-[var(--muted)]">{remaining[n]}</span>}
                </button>
              )
            })}
          </div>

          {/* Action row */}
          <div className="grid grid-cols-2 gap-2.5 text-sm font-bold">
            <button onClick={() => setNotesMode((v) => !v)} className={`rounded-xl border px-3 py-2.5 transition ${notesMode ? 'border-[var(--accent)] bg-[color:var(--accent)]/15 text-[var(--accent)]' : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]'}`}>
              Notes {notesMode ? 'ON' : 'OFF'}
            </button>
            <button onClick={() => selected !== null && eraseCell(selected)} disabled={selected === null} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 transition enabled:hover:border-[var(--accent)] disabled:opacity-40">
              Erase
            </button>
            <button onClick={undo} disabled={history.length === 0} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 transition enabled:hover:border-[var(--accent)] disabled:opacity-40">
              Undo
            </button>
            <button onClick={hint} disabled={selected === null || won} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 transition enabled:hover:border-[var(--accent)] disabled:opacity-40">
              Hint
            </button>
          </div>

          <button onClick={() => newGame(difficulty)} className="rounded-xl bg-[var(--accent)] px-3 py-3 text-sm font-extrabold text-white shadow-[0_12px_28px_var(--glow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-deep)]">
            New game
          </button>

          <p className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
            <span className="font-bold text-[var(--ink)]">Tip:</span> click a cell, then type a number (1–9). Use arrow keys to move, Backspace to erase.
          </p>
        </div>
      </div>
    </main>
  )
}
