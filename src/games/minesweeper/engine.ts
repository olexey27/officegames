// Minesweeper engine: classic three boards, lazily placed mines (the first
// click is always safe, including its neighbors), flood reveal for zeros.

export type MsDifficulty = 'Beginner' | 'Intermediate' | 'Expert'

export const MS_CONFIG: Record<MsDifficulty, { rows: number; cols: number; mines: number }> = {
  Beginner: { rows: 9, cols: 9, mines: 10 },
  Intermediate: { rows: 16, cols: 16, mines: 40 },
  Expert: { rows: 16, cols: 30, mines: 99 },
}

export function neighbors(index: number, rows: number, cols: number): number[] {
  const r = Math.floor(index / cols)
  const c = index % cols
  const result: number[] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) result.push(nr * cols + nc)
    }
  }
  return result
}

/** Random mine layout that keeps the first-clicked cell and its ring clear. */
export function placeMines(rows: number, cols: number, mineCount: number, safeIndex: number): Set<number> {
  const total = rows * cols
  const forbidden = new Set([safeIndex, ...neighbors(safeIndex, rows, cols)])
  const candidates: number[] = []
  for (let i = 0; i < total; i++) if (!forbidden.has(i)) candidates.push(i)
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  return new Set(candidates.slice(0, mineCount))
}

export function adjacentCount(index: number, mines: Set<number>, rows: number, cols: number): number {
  return neighbors(index, rows, cols).filter((n) => mines.has(n)).length
}

/**
 * Cells revealed by clicking `start`: the cell itself, plus a flood fill
 * across connected zero-adjacency cells (and their numbered border).
 */
export function floodReveal(
  start: number,
  mines: Set<number>,
  rows: number,
  cols: number,
  alreadyRevealed: Set<number>,
  flagged: Set<number>,
): Set<number> {
  const found = new Set<number>()
  const queue = [start]
  while (queue.length > 0) {
    const index = queue.pop()!
    if (found.has(index) || alreadyRevealed.has(index) || flagged.has(index) || mines.has(index)) continue
    found.add(index)
    if (adjacentCount(index, mines, rows, cols) === 0) {
      for (const n of neighbors(index, rows, cols)) queue.push(n)
    }
  }
  return found
}
