// Four in a Row engine: 7x6 board, negamax with alpha-beta and iterative
// deepening under a time budget (same recipe as the chess Sharkfish).
// Pure functions, Node-testable.

export const COLS = 7
export const ROWS = 6
export const HUMAN = 1
export const AI = 2

export type FiarLevel = 'Beginner' | 'Casual' | 'Club' | 'Pro'

export const FIAR_LEVELS: Record<FiarLevel, { timeMs: number; maxDepth: number; blunder: number; label: string }> = {
  Beginner: { timeMs: 100, maxDepth: 2, blunder: 0.4, label: 'drops a brick sometimes' },
  Casual: { timeMs: 150, maxDepth: 4, blunder: 0.1, label: 'plays for fun' },
  Club: { timeMs: 400, maxDepth: 7, blunder: 0, label: 'plans a few moves ahead' },
  Pro: { timeMs: 900, maxDepth: 12, blunder: 0, label: 'nearly unforgiving' },
}

const ORDER = [3, 2, 4, 1, 5, 0, 6] // center first for better pruning
const WIN = 100000

// All 69 four-cell windows, precomputed.
const WINDOWS: number[][] = (() => {
  const windows: number[][] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c
      if (c + 3 < COLS) windows.push([i, i + 1, i + 2, i + 3])
      if (r + 3 < ROWS) windows.push([i, i + COLS, i + 2 * COLS, i + 3 * COLS])
      if (c + 3 < COLS && r + 3 < ROWS) windows.push([i, i + COLS + 1, i + 2 * (COLS + 1), i + 3 * (COLS + 1)])
      if (c - 3 >= 0 && r + 3 < ROWS) windows.push([i, i + COLS - 1, i + 2 * (COLS - 1), i + 3 * (COLS - 1)])
    }
  }
  return windows
})()

export function emptyBoard(): number[] {
  return new Array(COLS * ROWS).fill(0)
}

/** Lowest free row in a column, or null when the column is full. */
export function landingRow(board: number[], col: number): number | null {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row * COLS + col] === 0) return row
  }
  return null
}

export function legalMoves(board: number[]): number[] {
  return ORDER.filter((col) => board[col] === 0)
}

export function drop(board: number[], col: number, player: number): { board: number[]; row: number } | null {
  const row = landingRow(board, col)
  if (row === null) return null
  const next = [...board]
  next[row * COLS + col] = player
  return { board: next, row }
}

export function winningLine(board: number[]): { player: number; line: number[] } | null {
  for (const window of WINDOWS) {
    const first = board[window[0]]
    if (first !== 0 && window.every((i) => board[i] === first)) return { player: first, line: window }
  }
  return null
}

export function isDraw(board: number[]): boolean {
  return board.every((cell) => cell !== 0) && winningLine(board) === null
}

function scoreWindow(board: number[], window: number[], player: number): number {
  let mine = 0
  let theirs = 0
  for (const i of window) {
    if (board[i] === player) mine++
    else if (board[i] !== 0) theirs++
  }
  if (mine > 0 && theirs > 0) return 0
  if (mine === 3) return 60
  if (mine === 2) return 12
  if (theirs === 3) return -70
  if (theirs === 2) return -12
  return 0
}

/** Heuristic score from `player`'s point of view. */
export function evaluate(board: number[], player: number): number {
  let score = 0
  for (const window of WINDOWS) score += scoreWindow(board, window, player)
  for (let row = 0; row < ROWS; row++) {
    const cell = board[row * COLS + 3]
    if (cell === player) score += 6
    else if (cell !== 0) score -= 6
  }
  return score
}

class TimeUp extends Error {}

function negamax(board: number[], depth: number, alpha: number, beta: number, current: number, deadline: number, ply: number): number {
  if (Date.now() > deadline) throw new TimeUp()
  const win = winningLine(board)
  if (win) return win.player === current ? WIN - ply : -(WIN - ply)
  if (isDraw(board)) return 0
  if (depth === 0) return evaluate(board, current)
  let best = -Infinity
  for (const col of legalMoves(board)) {
    const next = drop(board, col, current)!
    const score = -negamax(next.board, depth - 1, -beta, -alpha, current === 1 ? 2 : 1, deadline, ply + 1)
    if (score > best) best = score
    if (best > alpha) alpha = best
    if (alpha >= beta) break
  }
  return best
}

/** Column choice for `player`; iterative deepening under the time budget. */
export function bestMove(board: number[], player: number, level: { timeMs: number; maxDepth: number; blunder: number }): number | null {
  const moves = legalMoves(board)
  if (moves.length === 0) return null
  if (Math.random() < level.blunder) {
    return moves[Math.floor(Math.random() * moves.length)]
  }
  const deadline = Date.now() + level.timeMs
  let best = moves[0]
  for (let depth = 1; depth <= level.maxDepth; depth++) {
    let depthBest: number | null = null
    let depthScore = -Infinity
    try {
      for (const col of moves) {
        const next = drop(board, col, player)!
        const score = -negamax(next.board, depth - 1, -Infinity, Infinity, player === 1 ? 2 : 1, deadline, 1)
        if (score > depthScore) {
          depthScore = score
          depthBest = col
        }
      }
      if (depthBest !== null) best = depthBest
      if (depthScore >= WIN - 50) break // forced win found — no need to search deeper
    } catch (error) {
      if (error instanceof TimeUp) break
      throw error
    }
  }
  return best
}
