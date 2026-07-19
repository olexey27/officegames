// Tetris engine, Game Boy flavored: 10x18 well, the seven tetrominoes,
// classic scoring (40/100/300/1200 x level+1), level up every 10 lines,
// speed from the level. Pure functions — UI drives the tick.

export const COLS = 10
export const ROWS = 18

// Base matrices; rotations are generated and deduplicated.
const BASE: string[][] = [
  ['....', 'XXXX', '....', '....'], // I
  ['XX', 'XX'], // O
  ['.X.', 'XXX', '...'], // T
  ['.XX', 'XX.', '...'], // S
  ['XX.', '.XX', '...'], // Z
  ['X..', 'XXX', '...'], // J
  ['..X', 'XXX', '...'], // L
]

export const PIECE_COLORS = ['#38bdf8', '#facc15', '#c084fc', '#4ade80', '#ff4b4d', '#818cf8', '#fb923c']

type Cell = [number, number]

function matrixCells(matrix: string[]): Cell[] {
  const cells: Cell[] = []
  matrix.forEach((row, y) => {
    row.split('').forEach((ch, x) => {
      if (ch === 'X') cells.push([x, y])
    })
  })
  return cells
}

function rotateMatrix(matrix: string[]): string[] {
  const size = matrix.length
  const next: string[] = []
  for (let x = 0; x < size; x++) {
    let row = ''
    for (let y = size - 1; y >= 0; y--) row += matrix[y][x]
    next.push(row)
  }
  return next
}

// Rotations are deduplicated by their normalized shape so I, S and Z
// alternate between exactly two states (Game Boy behavior) instead of
// drifting through four shifted variants.
function normalizedKey(cells: Cell[]): string {
  const minX = Math.min(...cells.map(([x]) => x))
  const minY = Math.min(...cells.map(([, y]) => y))
  return cells
    .map(([x, y]) => `${x - minX},${y - minY}`)
    .sort()
    .join('|')
}

// ROTATIONS[shape][rotation] = list of occupied cells
export const ROTATIONS: Cell[][][] = BASE.map((base) => {
  const states: Cell[][] = []
  const seen = new Set<string>()
  let matrix = base
  for (let r = 0; r < 4; r++) {
    const cells = matrixCells(matrix)
    const key = normalizedKey(cells)
    if (!seen.has(key)) {
      seen.add(key)
      states.push(cells)
    }
    matrix = rotateMatrix(matrix)
  }
  return states
})

export type Piece = { shape: number; rot: number; x: number; y: number }

export function randomShape(): number {
  return Math.floor(Math.random() * 7)
}

export function spawnPiece(shape: number): Piece {
  return { shape, rot: 0, x: 3, y: -1 }
}

export function pieceCells(piece: Piece): Cell[] {
  return ROTATIONS[piece.shape][piece.rot].map(([x, y]) => [x + piece.x, y + piece.y])
}

/** Inside the well and not overlapping locked blocks (cells above the top are fine). */
export function fits(board: number[], piece: Piece): boolean {
  return pieceCells(piece).every(([x, y]) => {
    if (x < 0 || x >= COLS || y >= ROWS) return false
    if (y < 0) return true
    return board[y * COLS + x] === 0
  })
}

export function rotated(board: number[], piece: Piece): Piece {
  const rot = (piece.rot + 1) % ROTATIONS[piece.shape].length
  // simple wall kicks: in place, left, right
  for (const dx of [0, -1, 1, -2, 2]) {
    const candidate = { ...piece, rot, x: piece.x + dx }
    if (fits(board, candidate)) return candidate
  }
  return piece
}

export function moved(board: number[], piece: Piece, dx: number, dy: number): Piece {
  const candidate = { ...piece, x: piece.x + dx, y: piece.y + dy }
  return fits(board, candidate) ? candidate : piece
}

export function dropPosition(board: number[], piece: Piece): Piece {
  let current = piece
  for (;;) {
    const below = { ...current, y: current.y + 1 }
    if (!fits(board, below)) return current
    current = below
  }
}

/** Locks the piece; returns null when it locked above the top (game over). */
export function lockPiece(board: number[], piece: Piece): number[] | null {
  const next = [...board]
  for (const [x, y] of pieceCells(piece)) {
    if (y < 0) return null
    next[y * COLS + x] = piece.shape + 1
  }
  return next
}

export function clearLines(board: number[]): { board: number[]; cleared: number } {
  const rows: number[][] = []
  for (let y = 0; y < ROWS; y++) rows.push(board.slice(y * COLS, (y + 1) * COLS))
  const kept = rows.filter((row) => row.some((cell) => cell === 0))
  const cleared = ROWS - kept.length
  while (kept.length < ROWS) kept.unshift(new Array(COLS).fill(0))
  return { board: kept.flat(), cleared }
}

/** Game Boy scoring: 40 / 100 / 300 / 1200, multiplied by level + 1. */
export function lineScore(cleared: number, level: number): number {
  return [0, 40, 100, 300, 1200][cleared] * (level + 1)
}

export function levelFor(startLevel: number, lines: number): number {
  return startLevel + Math.floor(lines / 10)
}

export function speedMs(level: number): number {
  const table = [800, 720, 630, 550, 470, 380, 300, 220, 180, 140, 110, 90]
  return level < table.length ? table[level] : 75
}

export type TetrisDifficulty = 'Easy' | 'Classic' | 'Hard'
export const TETRIS_START_LEVEL: Record<TetrisDifficulty, number> = {
  Easy: 0,
  Classic: 4,
  Hard: 8,
}
