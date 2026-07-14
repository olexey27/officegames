// Memory engine: 31 levels of pair matching. Difficulty scales two ways —
// more pairs per level and a tighter time budget per pair.

export const TOTAL_LEVELS = 31

// 32 distinct card faces — enough for the 32 pairs of the final level.
export const EMOJIS = [
  '🦈', '🎮', '🕹️', '👾', '🎲', '🧩', '⭐', '❤️',
  '💎', '🔥', '⚡', '🏆', '🎯', '🎁', '🐙', '🐟',
  '🦀', '🐬', '🌊', '🚀', '😎', '🍕', '☕', '🍩',
  '🎧', '💾', '🖱️', '⌨️', '📞', '📎', '💡', '🔋',
]

/** Level 1 → 2 pairs (4 cards) … Level 31 → 32 pairs (64 cards, 8×8). */
export function pairsFor(level: number): number {
  return level + 1
}

/** Time budget shrinks from 5s per pair (level 1) to 3s per pair (level 31). */
export function timeLimitFor(level: number): number {
  const perPair = 5 - (2 * (level - 1)) / (TOTAL_LEVELS - 1)
  return Math.ceil(pairsFor(level) * perPair)
}

/** Grid columns that keep the board roughly square. */
export function colsFor(cardCount: number): number {
  if (cardCount <= 4) return 2
  if (cardCount <= 6) return 3
  if (cardCount <= 12) return 4
  if (cardCount <= 20) return 5
  if (cardCount <= 30) return 6
  if (cardCount <= 42) return 7
  return 8
}

/** Shuffled deck for a level: each face appears exactly twice. */
export function buildDeck(level: number): string[] {
  const faces = EMOJIS.slice(0, pairsFor(level))
  const deck = [...faces, ...faces]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}
