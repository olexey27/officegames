// 2048 engine: tile-based board state so the UI can animate slides and
// merges. Tiles keep stable ids; merged-away tiles are marked 'dying' and
// linger one animation frame so they can slide into their target visually.

export const SIZE = 4

export type Direction = 'up' | 'down' | 'left' | 'right'
export type TileState = 'idle' | 'new' | 'merged' | 'dying'

export type Tile = {
  id: number
  value: number
  row: number
  col: number
  state: TileState
}

let nextId = 1
function newId(): number {
  return nextId++
}

/** Tiles that still count for game logic (everything not fading out). */
export function alive(tiles: Tile[]): Tile[] {
  return tiles.filter((t) => t.state !== 'dying')
}

function emptyCells(tiles: Tile[]): { row: number; col: number }[] {
  const occupied = new Set(alive(tiles).map((t) => t.row * SIZE + t.col))
  const cells: { row: number; col: number }[] = []
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (!occupied.has(row * SIZE + col)) cells.push({ row, col })
    }
  }
  return cells
}

/** Adds one random tile (90% a 2, 10% a 4) on a free cell. */
export function spawnRandom(tiles: Tile[]): Tile[] {
  const cells = emptyCells(tiles)
  if (cells.length === 0) return tiles
  const cell = cells[Math.floor(Math.random() * cells.length)]
  return [
    ...tiles,
    { id: newId(), value: Math.random() < 0.9 ? 2 : 4, row: cell.row, col: cell.col, state: 'new' },
  ]
}

export function startGame(): Tile[] {
  return spawnRandom(spawnRandom([]))
}

/**
 * Slides and merges all tiles in one direction.
 * Surviving tiles keep their id (the UI slides them via CSS); a merge doubles
 * the first tile ('merged' → pop animation) and marks the absorbed tile
 * 'dying' at the same target cell.
 */
export function move(tiles: Tile[], dir: Direction): { tiles: Tile[]; moved: boolean; gained: number } {
  const current = alive(tiles).map((t): Tile => ({ ...t, state: 'idle' }))
  const result: Tile[] = []
  let moved = false
  let gained = 0

  const horizontal = dir === 'left' || dir === 'right'
  const reverse = dir === 'right' || dir === 'down'
  const place = (index: number) => (reverse ? SIZE - 1 - index : index)

  for (let line = 0; line < SIZE; line++) {
    const lineTiles = current
      .filter((t) => (horizontal ? t.row : t.col) === line)
      .sort((a, b) => (horizontal ? a.col - b.col : a.row - b.row))
    if (reverse) lineTiles.reverse()

    let target = 0
    for (let i = 0; i < lineTiles.length; i++) {
      const tile = lineTiles[i]
      const next = lineTiles[i + 1]
      const row = horizontal ? line : place(target)
      const col = horizontal ? place(target) : line

      if (next && next.value === tile.value) {
        const value = tile.value * 2
        gained += value
        result.push({ ...tile, value, row, col, state: 'merged' })
        result.push({ ...next, row, col, state: 'dying' })
        moved = true
        i++ // the absorbed tile is consumed
      } else {
        if (tile.row !== row || tile.col !== col) moved = true
        result.push({ ...tile, row, col })
      }
      target++
    }
  }

  return { tiles: result, moved, gained }
}

export function canMove(tiles: Tile[]): boolean {
  const live = alive(tiles)
  if (live.length < SIZE * SIZE) return true
  const grid: number[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
  for (const tile of live) grid[tile.row][tile.col] = tile.value
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (row + 1 < SIZE && grid[row][col] === grid[row + 1][col]) return true
      if (col + 1 < SIZE && grid[row][col] === grid[row][col + 1]) return true
    }
  }
  return false
}

export function maxTile(tiles: Tile[]): number {
  return alive(tiles).reduce((max, t) => Math.max(max, t.value), 0)
}
