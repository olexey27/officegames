// Sudoku engine: solved-board generation, puzzle carving with a guaranteed
// unique solution, and small validation helpers used by the UI.

export type Cell = number // 0 = empty, 1..9 = filled
export type Board = Cell[] // length 81, row-major

export type Difficulty = 'Easy' | 'Classic' | 'Hard'

// Target number of given clues per difficulty (matches the landing copy).
export const DIFFICULTY_CLUES: Record<Difficulty, number> = {
  Easy: 46,
  Classic: 36,
  Hard: 28,
}

export type Puzzle = {
  puzzle: Board // the board shown to the player (0 = empty)
  solution: Board // the fully solved board
  given: boolean[] // which cells are fixed clues
}

function shuffle<T>(items: T[]): T[] {
  const copy = items.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function rowOf(index: number): number {
  return Math.floor(index / 9)
}
export function colOf(index: number): number {
  return index % 9
}
export function boxOf(index: number): number {
  return Math.floor(rowOf(index) / 3) * 3 + Math.floor(colOf(index) / 3)
}

// Can `value` be placed at `index` without clashing in its row/col/box?
export function canPlace(board: Board, index: number, value: number): boolean {
  const r = rowOf(index)
  const c = colOf(index)
  const br = Math.floor(r / 3) * 3
  const bc = Math.floor(c / 3) * 3
  for (let k = 0; k < 9; k++) {
    if (board[r * 9 + k] === value) return false // row
    if (board[k * 9 + c] === value) return false // col
    const bi = (br + Math.floor(k / 3)) * 9 + (bc + (k % 3))
    if (board[bi] === value) return false // box
  }
  return true
}

// Backtracking fill with randomized candidate order → a random full solution.
function fillBoard(board: Board): boolean {
  const index = board.indexOf(0)
  if (index === -1) return true
  for (const value of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (canPlace(board, index, value)) {
      board[index] = value
      if (fillBoard(board)) return true
      board[index] = 0
    }
  }
  return false
}

export function generateSolved(): Board {
  const board: Board = new Array(81).fill(0)
  fillBoard(board)
  return board
}

// Counts solutions, stopping early once `limit` is reached (we only need to
// know whether the puzzle is unique, i.e. exactly one solution).
function countSolutions(board: Board, limit = 2): number {
  const index = board.indexOf(0)
  if (index === -1) return 1
  let count = 0
  for (let value = 1; value <= 9; value++) {
    if (canPlace(board, index, value)) {
      board[index] = value
      count += countSolutions(board, limit)
      board[index] = 0
      if (count >= limit) break
    }
  }
  return count
}

// Carve a puzzle from a solved board by removing clues in random order,
// keeping only removals that preserve a unique solution.
export function generatePuzzle(difficulty: Difficulty): Puzzle {
  const solution = generateSolved()
  const puzzle = solution.slice()
  const targetClues = DIFFICULTY_CLUES[difficulty]

  let clues = 81
  for (const index of shuffle([...Array(81).keys()])) {
    if (clues <= targetClues) break
    const backup = puzzle[index]
    if (backup === 0) continue
    puzzle[index] = 0
    // Only accept the removal if the solution stays unique.
    if (countSolutions(puzzle.slice()) === 1) {
      clues--
    } else {
      puzzle[index] = backup
    }
  }

  return {
    puzzle,
    solution,
    given: puzzle.map((cell) => cell !== 0),
  }
}

// Indices that conflict with the value currently at `index` (same row/col/box,
// same non-zero value). Used to highlight mistakes live.
export function findConflicts(board: Board): Set<number> {
  const conflicts = new Set<number>()
  for (let i = 0; i < 81; i++) {
    const value = board[i]
    if (value === 0) continue
    const r = rowOf(i)
    const c = colOf(i)
    for (let k = 0; k < 9; k++) {
      const rowIdx = r * 9 + k
      const colIdx = k * 9 + c
      if (rowIdx !== i && board[rowIdx] === value) conflicts.add(i)
      if (colIdx !== i && board[colIdx] === value) conflicts.add(i)
    }
    const br = Math.floor(r / 3) * 3
    const bc = Math.floor(c / 3) * 3
    for (let k = 0; k < 9; k++) {
      const bi = (br + Math.floor(k / 3)) * 9 + (bc + (k % 3))
      if (bi !== i && board[bi] === value) conflicts.add(i)
    }
  }
  return conflicts
}

export function isComplete(board: Board): boolean {
  return board.every((cell) => cell !== 0) && findConflicts(board).size === 0
}
