// Durak engine (podkidnoy / throw-in rules, 36 cards):
// - lowest trump holder attacks first, neighbor defends
// - defense: higher card of same suit, or any trump on a non-trump
// - non-defenders may throw in cards whose rank is already on the table
// - attack limit: 5 pairs before the first discard, 6 after — and never
//   more undefended cards than the defender holds
// - defender beats everything -> cards discarded, defender attacks next;
//   defender takes -> attack passes to the player after the defender
// Pure functions only, so the same engine can later run on a server.

export type Suit = '♠' | '♥' | '♦' | '♣'
export const SUITS: Suit[] = ['♠', '♥', '♦', '♣']

export type Card = { rank: number; suit: Suit }

export const RANK_LABELS: Record<number, string> = {
  6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
}

export const BOT_NAMES = ['Finn', 'Bruce', 'Mako', 'Ripley', 'Hammer']

export function isRed(suit: Suit): boolean {
  return suit === '♥' || suit === '♦'
}

export function buildDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (let rank = 6; rank <= 14; rank++) deck.push({ rank, suit })
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit
}

/** Can `defense` beat `attack` under this trump suit? */
export function beats(defense: Card, attack: Card, trump: Suit): boolean {
  if (defense.suit === attack.suit) return defense.rank > attack.rank
  return defense.suit === trump && attack.suit !== trump
}

/** Rough worth of a card — bots protect trumps and high ranks. */
export function cardValue(card: Card, trump: Suit): number {
  return card.rank + (card.suit === trump ? 20 : 0)
}

export function sortHand(hand: Card[], trump: Suit): Card[] {
  return [...hand].sort((a, b) => {
    const at = a.suit === trump ? 1 : 0
    const bt = b.suit === trump ? 1 : 0
    if (at !== bt) return at - bt
    if (a.suit !== b.suit) return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit)
    return a.rank - b.rank
  })
}

// ---------- bot decisions ----------

/** Opening attack: lead the cheapest card. */
export function chooseAttackCard(hand: Card[], trump: Suit): Card {
  return hand.reduce((best, card) => (cardValue(card, trump) < cardValue(best, trump) ? card : best))
}

/**
 * Throw-in: cheapest card whose rank is already on the table — but only if
 * it's junk worth spending (no trumps while the deck lasts, no aces).
 */
export function chooseThrowCard(hand: Card[], tableRanks: Set<number>, trump: Suit, deckEmpty: boolean): Card | null {
  const candidates = hand.filter((card) => {
    if (!tableRanks.has(card.rank)) return false
    if (card.suit === trump && !deckEmpty) return false
    if (card.rank >= 14 && !deckEmpty) return false
    return true
  })
  if (candidates.length === 0) return null
  return candidates.reduce((best, card) => (cardValue(card, trump) < cardValue(best, trump) ? card : best))
}

/**
 * Defense: cheapest card that beats the attack; null = rather take.
 * Bots refuse to burn a big trump on junk while the deck still has cards.
 */
export function chooseDefenseCard(hand: Card[], attack: Card, trump: Suit, deckEmpty: boolean): Card | null {
  const options = hand.filter((card) => beats(card, attack, trump))
  if (options.length === 0) return null
  const best = options.reduce((a, b) => (cardValue(a, trump) < cardValue(b, trump) ? a : b))
  if (!deckEmpty && best.suit === trump && attack.suit !== trump && best.rank >= 12 && attack.rank <= 9) {
    return null // a queen-or-better trump for a 9 or less: not worth it yet
  }
  return best
}

/** Index of the player holding the lowest trump (opening attacker). */
export function lowestTrumpHolder(hands: Card[][], trump: Suit): number {
  let holder = 0
  let bestRank = Infinity
  hands.forEach((hand, index) => {
    for (const card of hand) {
      if (card.suit === trump && card.rank < bestRank) {
        bestRank = card.rank
        holder = index
      }
    }
  })
  return holder
}

// ---------- game state machine ----------
// Kept UI-free so the same code could later drive an online game server.

export type PlayerState = { name: string; isBot: boolean; hand: Card[]; out: boolean; passed: boolean }
export type TablePair = { attack: Card; defense: Card | null }

export type Game = {
  players: PlayerState[]
  deck: Card[] // deck[0] is the face-up trump card, drawn last
  trump: Suit
  trumpCard: Card
  table: TablePair[]
  discard: number
  attacker: number
  defender: number
  firstBito: boolean
  message: string
  over: boolean
  loser: number | null
}

export function nextActive(g: Game, from: number): number {
  let i = from
  for (let step = 0; step < g.players.length; step++) {
    i = (i + 1) % g.players.length
    if (!g.players[i].out) return i
  }
  return from
}

export function undefendedPairs(g: Game): number[] {
  return g.table.map((pair, index) => (pair.defense === null ? index : -1)).filter((i) => i >= 0)
}

export function tableRanks(g: Game): Set<number> {
  const ranks = new Set<number>()
  for (const pair of g.table) {
    ranks.add(pair.attack.rank)
    if (pair.defense) ranks.add(pair.defense.rank)
  }
  return ranks
}

export function maxPairs(g: Game): number {
  return g.firstBito ? 5 : 6
}

export function canThrowIn(g: Game, idx: number): boolean {
  const player = g.players[idx]
  if (idx === g.defender || player.out || g.table.length === 0) return false
  if (g.table.length >= maxPairs(g)) return false
  if (undefendedPairs(g).length >= g.players[g.defender].hand.length) return false
  const ranks = tableRanks(g)
  return player.hand.some((card) => ranks.has(card.rank))
}

/** Non-defenders who may still act in the throw-in phase, attacker first. */
export function pendingThrowers(g: Game): number[] {
  if (g.table.length === 0 || undefendedPairs(g).length > 0) return []
  const order: number[] = []
  let i = g.attacker
  for (let step = 0; step < g.players.length; step++) {
    if (!g.players[i].out && i !== g.defender && !g.players[i].passed && canThrowIn(g, i)) order.push(i)
    i = (i + 1) % g.players.length
  }
  return order
}

function clone(g: Game): Game {
  return {
    ...g,
    players: g.players.map((p) => ({ ...p, hand: [...p.hand] })),
    deck: [...g.deck],
    table: g.table.map((pair) => ({ ...pair })),
  }
}

function removeCard(hand: Card[], card: Card): boolean {
  const index = hand.findIndex((c) => sameCard(c, card))
  if (index === -1) return false
  hand.splice(index, 1)
  return true
}

export function doAttack(prev: Game, idx: number, card: Card): Game {
  const g = clone(prev)
  const opening = g.table.length === 0
  if (opening && idx !== g.attacker) return prev
  if (!opening && !canThrowIn(g, idx)) return prev
  if (!opening && !tableRanks(g).has(card.rank)) return prev
  if (!removeCard(g.players[idx].hand, card)) return prev
  g.table.push({ attack: card, defense: null })
  for (const p of g.players) p.passed = false
  g.message = `${g.players[idx].name} ${opening ? 'attacks with' : 'throws in'} ${RANK_LABELS[card.rank]}${card.suit}`
  return g
}

export function doDefend(prev: Game, pairIndex: number, card: Card): Game {
  const g = clone(prev)
  const pair = g.table[pairIndex]
  if (!pair || pair.defense !== null) return prev
  if (!beats(card, pair.attack, g.trump)) return prev
  if (!removeCard(g.players[g.defender].hand, card)) return prev
  pair.defense = card
  for (const p of g.players) p.passed = false
  g.message = `${g.players[g.defender].name} beats it with ${RANK_LABELS[card.rank]}${card.suit}`
  return g
}

export function doPass(prev: Game, idx: number): Game {
  const g = clone(prev)
  g.players[idx].passed = true
  return g
}

export function endRound(prev: Game, taken: boolean): Game {
  const g = clone(prev)
  const cardCount = g.table.reduce((n, pair) => n + 1 + (pair.defense ? 1 : 0), 0)
  if (taken) {
    for (const pair of g.table) {
      g.players[g.defender].hand.push(pair.attack)
      if (pair.defense) g.players[g.defender].hand.push(pair.defense)
    }
  } else if (cardCount > 0) {
    g.discard += cardCount
    g.firstBito = false
  }
  g.table = []

  // Draw back to 6: attacker first, clockwise, defender last.
  const order: number[] = []
  let i = g.attacker
  for (let step = 0; step < g.players.length; step++) {
    if (!g.players[i].out && i !== g.defender) order.push(i)
    i = (i + 1) % g.players.length
  }
  if (!g.players[g.defender].out) order.push(g.defender)
  for (const playerIndex of order) {
    const hand = g.players[playerIndex].hand
    while (hand.length < 6 && g.deck.length > 0) hand.push(g.deck.pop()!)
  }

  // Empty hand once the deck ran dry -> escaped.
  if (g.deck.length === 0) {
    for (const p of g.players) {
      if (!p.out && p.hand.length === 0) p.out = true
    }
  }

  const actives = g.players.map((p, index) => (!p.out ? index : -1)).filter((index) => index >= 0)
  if (actives.length <= 1) {
    g.over = true
    g.loser = actives.length === 1 ? actives[0] : null
    g.message = g.loser === null ? 'Draw — nobody is the durak!' : `${g.players[g.loser].name} is the durak!`
    return g
  }

  const oldDefender = g.defender
  if (taken) {
    g.attacker = nextActive(g, oldDefender)
    g.message = `${g.players[oldDefender].name} takes ${cardCount} cards`
  } else {
    g.attacker = g.players[oldDefender].out ? nextActive(g, oldDefender) : oldDefender
    g.message = 'Beaten! Cards go to the discard'
  }
  g.defender = nextActive(g, g.attacker)
  for (const p of g.players) p.passed = false
  return g
}

export function startGame(names: { name: string; isBot: boolean }[]): Game {
  const deck = buildDeck()
  const trumpCard = deck[0]
  const players: PlayerState[] = names.map((n) => ({ ...n, hand: [], out: false, passed: false }))
  for (let round = 0; round < 6; round++) {
    for (const player of players) player.hand.push(deck.pop()!)
  }
  const attacker = lowestTrumpHolder(players.map((p) => p.hand), trumpCard.suit)
  const g: Game = {
    players,
    deck,
    trump: trumpCard.suit,
    trumpCard,
    table: [],
    discard: 0,
    attacker,
    defender: 0,
    firstBito: true,
    message: '',
    over: false,
    loser: null,
  }
  g.defender = nextActive(g, attacker)
  g.message = `${players[attacker].name} has the lowest trump and starts`
  return g
}

/**
 * One automatic step (used for bot turns — and for self-play tests).
 * Returns the unchanged state when a human decision is required.
 */
export function botStep(g: Game, humanIndex = -1): Game {
  if (g.over) return g
  const undefended = undefendedPairs(g)
  if (g.table.length === 0) {
    if (g.attacker === humanIndex) return g
    const attacker = g.players[g.attacker]
    if (attacker.hand.length === 0) return endRound(g, false)
    return doAttack(g, g.attacker, chooseAttackCard(attacker.hand, g.trump))
  }
  if (undefended.length > 0) {
    if (g.defender === humanIndex) return g
    const defender = g.players[g.defender]
    const card = chooseDefenseCard(defender.hand, g.table[undefended[0]].attack, g.trump, g.deck.length === 0)
    return card === null ? endRound(g, true) : doDefend(g, undefended[0], card)
  }
  const throwers = pendingThrowers(g)
  if (throwers.length === 0) return endRound(g, false)
  const actor = throwers[0]
  if (actor === humanIndex) return g
  const card = chooseThrowCard(g.players[actor].hand, tableRanks(g), g.trump, g.deck.length === 0)
  return card ? doAttack(g, actor, card) : doPass(g, actor)
}
