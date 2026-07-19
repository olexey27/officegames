// Mahjong solitaire engine. Coordinates are in half-tile units: a tile
// occupies 2x2 half-units at (x, y) on layer z. A tile is free when nothing
// overlaps it one layer up and its left or right side is open. Deals are
// generated backwards (place pairs in a valid removal order reversed), so
// every deal is provably solvable.

export type MahjongLayout = 'Quick' | 'Easy' | 'Turtle'

export type Position = { x: number; y: number; z: number }
export type Tile = Position & { id: number; kind: string; removed: boolean }

// 34 classic kinds + flowers + seasons (each label = one PAIR when dealing).
const KINDS: string[] = [
  ...Array.from({ length: 9 }, (_, i) => `d${i + 1}`), // dots
  ...Array.from({ length: 9 }, (_, i) => `b${i + 1}`), // bamboo
  ...Array.from({ length: 9 }, (_, i) => `c${i + 1}`), // characters
  'wE', 'wS', 'wW', 'wN', // winds
  'drR', 'drG', 'drW', // dragons
]

export function positions(layout: MahjongLayout): Position[] {
  const result: Position[] = []
  const row = (xStart: number, count: number, y: number, z: number) => {
    for (let i = 0; i < count; i++) result.push({ x: xStart + i * 2, y, z })
  }

  if (layout === 'Quick') {
    // 36 tiles: 8x4 base + 2x2 crown.
    for (let r = 0; r < 4; r++) row(0, 8, r * 2, 0)
    row(6, 2, 2, 1)
    row(6, 2, 4, 1)
    return result
  }

  if (layout === 'Easy') {
    // 72 tiles: 10x6 base + 4x3 middle deck.
    for (let r = 0; r < 6; r++) row(0, 10, r * 2, 0)
    for (let r = 0; r < 3; r++) row(6, 4, 2 + r * 2, 1)
    return result
  }

  // Turtle, 144 tiles: 87 + 36 + 16 + 4 + 1.
  const widths = [12, 8, 10, 12, 12, 10, 8, 12]
  widths.forEach((w, r) => row(12 - w + 2, w, r * 2, 0))
  result.push({ x: 0, y: 7, z: 0 }) // far left single
  result.push({ x: 26, y: 7, z: 0 }) // right pair
  result.push({ x: 28, y: 7, z: 0 })
  for (let r = 0; r < 6; r++) row(8, 6, 2 + r * 2, 1)
  for (let r = 0; r < 4; r++) row(10, 4, 4 + r * 2, 2)
  for (let r = 0; r < 2; r++) row(12, 2, 6 + r * 2, 3)
  result.push({ x: 13, y: 7, z: 4 }) // crown
  return result
}

function overlaps(a: Position, b: Position): boolean {
  return Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2
}

/** Free with respect to a set of present positions. */
export function isFree(pos: Position, present: Position[]): boolean {
  for (const other of present) {
    if (other === pos) continue
    if (other.z === pos.z + 1 && overlaps(other, pos)) return false
  }
  const leftBlocked = present.some((o) => o !== pos && o.z === pos.z && o.x === pos.x - 2 && Math.abs(o.y - pos.y) < 2)
  const rightBlocked = present.some((o) => o !== pos && o.z === pos.z && o.x === pos.x + 2 && Math.abs(o.y - pos.y) < 2)
  return !(leftBlocked && rightBlocked)
}

/** Pair labels for a layout size (each label used for exactly 2 tiles). */
function pairLabels(tileCount: number): string[] {
  const pairs = tileCount / 2
  const labels: string[] = []
  if (pairs === 72) {
    for (const kind of KINDS) labels.push(kind, kind) // 34 kinds x 2 pairs
    labels.push('fl', 'fl', 'se', 'se') // 4 flowers + 4 seasons
  } else if (pairs === 36) {
    labels.push(...KINDS, 'fl', 'se') // every kind once
  } else {
    for (let i = 0; i < pairs; i++) labels.push(KINDS[i % KINDS.length])
  }
  return labels
}

/**
 * Winnable deal: repeatedly pick two random free positions from the not yet
 * assigned set — that sequence is a valid removal order, so assigning kinds
 * pair-by-pair yields a solvable board. Retries when the picking dead-ends.
 */
export function deal(layout: MahjongLayout): Tile[] {
  const posList = positions(layout)
  for (let attempt = 0; attempt < 80; attempt++) {
    const remaining = new Set(posList)
    const order: Position[][] = []
    let stuck = false
    while (remaining.size > 0) {
      const present = [...remaining]
      const free = present.filter((p) => isFree(p, present))
      if (free.length < 2) {
        stuck = true
        break
      }
      const a = free[Math.floor(Math.random() * free.length)]
      let b = a
      while (b === a) b = free[Math.floor(Math.random() * free.length)]
      order.push([a, b])
      remaining.delete(a)
      remaining.delete(b)
    }
    if (stuck) continue

    const labels = pairLabels(posList.length)
    for (let i = labels.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[labels[i], labels[j]] = [labels[j], labels[i]]
    }
    const kindOf = new Map<Position, string>()
    order.forEach(([a, b], index) => {
      kindOf.set(a, labels[index])
      kindOf.set(b, labels[index])
    })
    return posList.map((pos, id) => ({ ...pos, id, kind: kindOf.get(pos)!, removed: false }))
  }
  // Practically unreachable; random fallback keeps the game playable.
  const labels = pairLabels(posList.length).flatMap((l) => [l, l])
  return posList.map((pos, id) => ({ ...pos, id, kind: labels[id], removed: false }))
}

export function freeTiles(tiles: Tile[]): Tile[] {
  const present = tiles.filter((t) => !t.removed)
  return present.filter((t) => isFree(t, present))
}

/** All currently matchable free pairs. */
export function availablePairs(tiles: Tile[]): [Tile, Tile][] {
  const free = freeTiles(tiles)
  const pairs: [Tile, Tile][] = []
  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      if (free[i].kind === free[j].kind) pairs.push([free[i], free[j]])
    }
  }
  return pairs
}

/**
 * Winnable reshuffle of the remaining tiles: run the same backwards dealing
 * on the remaining positions with the remaining kind pairs.
 */
export function shuffleRemaining(tiles: Tile[]): Tile[] {
  const alive = tiles.filter((t) => !t.removed)
  if (alive.length < 4) return tiles
  const counts = new Map<string, number>()
  for (const t of alive) counts.set(t.kind, (counts.get(t.kind) ?? 0) + 1)
  const labels: string[] = []
  for (const [kind, count] of counts) {
    for (let i = 0; i < count / 2; i++) labels.push(kind)
  }

  for (let attempt = 0; attempt < 60; attempt++) {
    const remaining = new Set(alive.map((t) => ({ x: t.x, y: t.y, z: t.z }) as Position))
    const order: Position[][] = []
    let stuck = false
    while (remaining.size > 0) {
      const present = [...remaining]
      const free = present.filter((p) => isFree(p, present))
      if (free.length < 2) {
        stuck = true
        break
      }
      const a = free[Math.floor(Math.random() * free.length)]
      let b = a
      while (b === a) b = free[Math.floor(Math.random() * free.length)]
      order.push([a, b])
      remaining.delete(a)
      remaining.delete(b)
    }
    if (stuck) continue
    const shuffled = [...labels]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    const kindAt = new Map<string, string>()
    order.forEach(([a, b], index) => {
      kindAt.set(`${a.x},${a.y},${a.z}`, shuffled[index])
      kindAt.set(`${b.x},${b.y},${b.z}`, shuffled[index])
    })
    return tiles.map((t) => (t.removed ? t : { ...t, kind: kindAt.get(`${t.x},${t.y},${t.z}`)! }))
  }
  return tiles
}

// ---------- tile faces ----------

export type Face = { top: string; main: string; color: string }

export function faceOf(kind: string): Face {
  if (kind.startsWith('d')) {
    if (kind.startsWith('dr')) {
      if (kind === 'drR') return { top: 'DRG', main: '中', color: '#e93131' }
      if (kind === 'drG') return { top: 'DRG', main: '發', color: '#16a34a' }
      return { top: 'DRG', main: '▢', color: '#6e6d71' }
    }
    return { top: kind.slice(1), main: '●', color: '#2563eb' }
  }
  if (kind.startsWith('b')) return { top: kind.slice(1), main: '▮', color: '#16a34a' }
  if (kind.startsWith('c')) return { top: kind.slice(1), main: '万', color: '#e93131' }
  if (kind.startsWith('w')) return { top: 'WND', main: kind.slice(1), color: '#17171a' }
  if (kind === 'fl') return { top: 'FLW', main: '✿', color: '#db2777' }
  return { top: 'SSN', main: '☀', color: '#ea580c' }
}
