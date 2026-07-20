// Klondike solitaire engine. Pure functions over an immutable state so the
// UI can keep an undo stack of snapshots. Suits: 0=♠ 1=♥ 2=♦ 3=♣.

export type Card = { rank: number; suit: number; faceUp: boolean }

export type Solitaire = {
  stock: Card[] // face down, top = last element
  waste: Card[] // face up, top = last element
  foundations: Card[][] // 4 piles, ace -> king within one suit
  tableau: Card[][] // 7 piles, top = last element
  drawCount: 1 | 3
  moves: number
  redeals: number
}

export const SUIT_GLYPHS = ['♠', '♥', '♦', '♣']
export const RANK_GLYPHS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

export function isRedSuit(suit: number): boolean {
  return suit === 1 || suit === 2
}

function shuffledDeck(): Card[] {
  const deck: Card[] = []
  for (let suit = 0; suit < 4; suit++) {
    for (let rank = 1; rank <= 13; rank++) deck.push({ rank, suit, faceUp: false })
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export function newGame(drawCount: 1 | 3): Solitaire {
  const deck = shuffledDeck()
  const tableau: Card[][] = []
  for (let pile = 0; pile < 7; pile++) {
    const cards = deck.splice(0, pile + 1)
    cards[cards.length - 1] = { ...cards[cards.length - 1], faceUp: true }
    tableau.push(cards)
  }
  return { stock: deck, waste: [], foundations: [[], [], [], []], tableau, drawCount, moves: 0, redeals: 0 }
}

function clone(s: Solitaire): Solitaire {
  return {
    ...s,
    stock: [...s.stock],
    waste: [...s.waste],
    foundations: s.foundations.map((f) => [...f]),
    tableau: s.tableau.map((t) => [...t]),
  }
}

/** Draw 1 or 3 from the stock; when the stock is empty, recycle the waste. */
export function draw(s: Solitaire): Solitaire {
  const g = clone(s)
  if (g.stock.length === 0) {
    if (g.waste.length === 0) return s
    g.stock = g.waste.reverse().map((c) => ({ ...c, faceUp: false }))
    g.waste = []
    g.redeals++
    g.moves++
    return g
  }
  for (let i = 0; i < g.drawCount && g.stock.length > 0; i++) {
    const card = g.stock.pop()!
    g.waste.push({ ...card, faceUp: true })
  }
  g.moves++
  return g
}

export function canPlaceOnTableau(card: Card, target: Card | undefined): boolean {
  if (!target) return card.rank === 13 // only kings on empty piles
  return target.faceUp && isRedSuit(card.suit) !== isRedSuit(target.suit) && card.rank === target.rank - 1
}

export function canPlaceOnFoundation(card: Card, pile: Card[]): boolean {
  if (pile.length === 0) return card.rank === 1
  const top = pile[pile.length - 1]
  return top.suit === card.suit && card.rank === top.rank + 1
}

function flipTop(pile: Card[]): void {
  const top = pile[pile.length - 1]
  if (top && !top.faceUp) pile[pile.length - 1] = { ...top, faceUp: true }
}

/** Move the face-up run starting at cardIndex from one tableau pile to another. */
export function moveTableauRun(s: Solitaire, from: number, cardIndex: number, to: number): Solitaire | null {
  if (from === to) return null
  const pile = s.tableau[from]
  const card = pile[cardIndex]
  if (!card || !card.faceUp) return null
  if (!canPlaceOnTableau(card, s.tableau[to][s.tableau[to].length - 1])) return null
  const g = clone(s)
  const run = g.tableau[from].splice(cardIndex)
  g.tableau[to].push(...run)
  flipTop(g.tableau[from])
  g.moves++
  return g
}

export function moveWasteToTableau(s: Solitaire, to: number): Solitaire | null {
  const card = s.waste[s.waste.length - 1]
  if (!card || !canPlaceOnTableau(card, s.tableau[to][s.tableau[to].length - 1])) return null
  const g = clone(s)
  g.tableau[to].push(g.waste.pop()!)
  g.moves++
  return g
}

export function moveToFoundation(s: Solitaire, source: 'waste' | number): Solitaire | null {
  const pile = source === 'waste' ? s.waste : s.tableau[source]
  const card = pile[pile.length - 1]
  if (!card || !card.faceUp) return null
  const target = s.foundations.findIndex((f) => canPlaceOnFoundation(card, f))
  if (target === -1) return null
  const g = clone(s)
  if (source === 'waste') g.foundations[target].push(g.waste.pop()!)
  else {
    g.foundations[target].push(g.tableau[source].pop()!)
    flipTop(g.tableau[source])
  }
  g.moves++
  return g
}

export function moveFoundationToTableau(s: Solitaire, foundation: number, to: number): Solitaire | null {
  const card = s.foundations[foundation][s.foundations[foundation].length - 1]
  if (!card || !canPlaceOnTableau(card, s.tableau[to][s.tableau[to].length - 1])) return null
  const g = clone(s)
  g.tableau[to].push(g.foundations[foundation].pop()!)
  g.moves++
  return g
}

export function isWon(s: Solitaire): boolean {
  return s.foundations.reduce((n, f) => n + f.length, 0) === 52
}

/** True when every card is face up — the game is trivially finishable. */
export function canAutoFinish(s: Solitaire): boolean {
  return s.stock.length === 0 && s.waste.length <= 1 && s.tableau.every((p) => p.every((c) => c.faceUp))
}

export type Hint =
  | { kind: 'foundation'; source: 'waste' | number }
  | { kind: 'tableau'; from: 'waste' | number; cardIndex: number; to: number }
  | { kind: 'draw' }
  | null

/** A reasonable next move: foundation first, then uncovering moves, then draw. */
export function hint(s: Solitaire): Hint {
  for (let i = 0; i < 7; i++) {
    const card = s.tableau[i][s.tableau[i].length - 1]
    if (card?.faceUp && s.foundations.some((f) => canPlaceOnFoundation(card, f))) return { kind: 'foundation', source: i }
  }
  const wasteTop = s.waste[s.waste.length - 1]
  if (wasteTop && s.foundations.some((f) => canPlaceOnFoundation(wasteTop, f))) return { kind: 'foundation', source: 'waste' }

  // Tableau runs that uncover a face-down card or move a king off nothing useful.
  for (let from = 0; from < 7; from++) {
    const pile = s.tableau[from]
    const firstUp = pile.findIndex((c) => c.faceUp)
    if (firstUp === -1) continue
    for (let to = 0; to < 7; to++) {
      if (to === from) continue
      if (canPlaceOnTableau(pile[firstUp], s.tableau[to][s.tableau[to].length - 1])) {
        const uncovers = firstUp > 0
        const movesKingOffEmpty = pile[firstUp].rank === 13 && firstUp === 0
        if (uncovers && !movesKingOffEmpty) return { kind: 'tableau', from, cardIndex: firstUp, to }
      }
    }
  }
  if (wasteTop) {
    for (let to = 0; to < 7; to++) {
      if (canPlaceOnTableau(wasteTop, s.tableau[to][s.tableau[to].length - 1])) {
        return { kind: 'tableau', from: 'waste', cardIndex: -1, to }
      }
    }
  }
  if (s.stock.length > 0 || s.waste.length > 0) return { kind: 'draw' }
  return null
}
