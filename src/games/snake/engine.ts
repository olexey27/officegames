// Snake engine: 20x20 grid, head-first body as cell indexes. Pure and
// deterministic apart from food spawning, so it's easy to test in Node.

export const COLS = 20
export const ROWS = 20

export type Dir = 'up' | 'down' | 'left' | 'right'

export type SnakeState = {
  snake: number[] // head first
  dir: Dir
  food: number
  score: number // foods eaten
  over: boolean
  wrap: boolean // walls wrap around (Easy) instead of killing
}

export type SnakeLevel = 'Easy' | 'Classic' | 'Hard'

export const SNAKE_LEVELS: Record<SnakeLevel, { baseMs: number; wrap: boolean; label: string }> = {
  Easy: { baseMs: 200, wrap: true, label: 'slow · walls wrap around' },
  Classic: { baseMs: 140, wrap: false, label: 'solid walls' },
  Hard: { baseMs: 90, wrap: false, label: 'fast — no mercy' },
}

export function speedFor(level: SnakeLevel, score: number): number {
  return Math.max(55, SNAKE_LEVELS[level].baseMs - score * 3)
}

export const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' }

export function spawnFood(occupied: number[]): number {
  const taken = new Set(occupied)
  const free: number[] = []
  for (let i = 0; i < COLS * ROWS; i++) {
    if (!taken.has(i)) free.push(i)
  }
  return free[Math.floor(Math.random() * free.length)]
}

export function newGame(wrap: boolean): SnakeState {
  const row = Math.floor(ROWS / 2)
  const mid = Math.floor(COLS / 2)
  const snake = [row * COLS + mid, row * COLS + mid - 1, row * COLS + mid - 2]
  return { snake, dir: 'right', food: spawnFood(snake), score: 0, over: false, wrap }
}

/** One tick. `wanted` is applied unless it reverses the current direction. */
export function step(state: SnakeState, wanted?: Dir): SnakeState {
  if (state.over) return state
  const dir = wanted && wanted !== OPPOSITE[state.dir] ? wanted : state.dir

  const head = state.snake[0]
  let row = Math.floor(head / COLS)
  let col = head % COLS
  if (dir === 'up') row--
  if (dir === 'down') row++
  if (dir === 'left') col--
  if (dir === 'right') col++

  if (state.wrap) {
    row = (row + ROWS) % ROWS
    col = (col + COLS) % COLS
  } else if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
    return { ...state, dir, over: true }
  }

  const next = row * COLS + col
  const eats = next === state.food
  // The tail cell frees up this tick unless the snake grows.
  const body = eats ? state.snake : state.snake.slice(0, -1)
  if (body.includes(next)) return { ...state, dir, over: true }

  const snake = [next, ...body]
  return {
    ...state,
    dir,
    snake,
    score: state.score + (eats ? 1 : 0),
    food: eats ? spawnFood(snake) : state.food,
    over: false,
  }
}
