import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import FullscreenButton from '../components/FullscreenButton'
import { ArrowIcon } from '../components/icons'
import {
  beats,
  BOT_NAMES,
  doAttack,
  doDefend,
  doPass,
  endRound,
  botStep,
  canThrowIn,
  isRed,
  pendingThrowers,
  RANK_LABELS,
  sameCard,
  sortHand,
  startGame,
  tableRanks,
  undefendedPairs,
  type Card,
  type Game,
} from '../games/durak/engine'

const NAME_KEY = 'sg-player-name'
const HUMAN = 0

function PlayingCard({ card, onClick, disabled, selected, dimmed }: { card: Card; onClick?: () => void; disabled?: boolean; selected?: boolean; dimmed?: boolean }) {
  const red = isRed(card.suit)
  const className = `flex h-[78px] w-[56px] shrink-0 flex-col items-center justify-center border-2 border-[#242321] bg-white font-display font-bold leading-none shadow-[2px_2px_0_rgba(0,0,0,.35)] transition-transform ${selected ? '-translate-y-3' : ''} ${dimmed ? 'opacity-40' : ''} ${onClick && !disabled ? 'hover:-translate-y-2' : ''}`
  const inner = (
    <>
      <span className="text-sm text-[#242321]">{RANK_LABELS[card.rank]}</span>
      <span className={`text-xl ${red ? 'text-[#e93131]' : 'text-[#242321]'}`}>{card.suit}</span>
    </>
  )
  if (!onClick) {
    return <div className={className} aria-label={`${RANK_LABELS[card.rank]} of ${card.suit}`}>{inner}</div>
  }
  return (
    <button onClick={onClick} disabled={disabled} className={className} aria-label={`Play ${RANK_LABELS[card.rank]} of ${card.suit}`}>
      {inner}
    </button>
  )
}

function CardBack({ small }: { small?: boolean }) {
  return (
    <span className={`inline-block border-2 border-[#242321] bg-[#b02a2c] ${small ? 'h-[44px] w-[32px]' : 'h-[78px] w-[56px]'}`}>
      <span className="m-[3px] block h-[calc(100%-6px)] border border-white/40" />
    </span>
  )
}

export default function Durak() {
  const [name, setName] = useState(() => (typeof localStorage !== 'undefined' && localStorage.getItem(NAME_KEY)) || '')
  const [playerCount, setPlayerCount] = useState(4)
  const [game, setGame] = useState<Game | null>(null)
  const [selected, setSelected] = useState<Card | null>(null)
  const botTimer = useRef<number | null>(null)

  const begin = () => {
    if (typeof localStorage !== 'undefined' && name.trim()) localStorage.setItem(NAME_KEY, name.trim())
    const seats = [{ name: name.trim() || 'You', isBot: false }]
    for (let i = 1; i < playerCount; i++) seats.push({ name: BOT_NAMES[i - 1], isBot: true })
    setGame(startGame(seats))
    setSelected(null)
  }

  // Bot orchestration: after every state change, let the engine take one
  // automatic step (it returns the state untouched when it's the human's turn).
  useEffect(() => {
    if (!game || game.over) return
    const delay = game.players[HUMAN].out ? 200 : 850
    botTimer.current = window.setTimeout(() => {
      setGame((prev) => (prev && !prev.over ? botStep(prev, HUMAN) : prev))
    }, delay)
    return () => {
      if (botTimer.current !== null) window.clearTimeout(botTimer.current)
    }
  }, [game])

  const humanDefending = game !== null && !game.over && game.defender === HUMAN && undefendedPairs(game).length > 0
  const humanOpening = game !== null && !game.over && game.attacker === HUMAN && game.table.length === 0 && !game.players[HUMAN].out
  const humanCanThrow = game !== null && !game.over && undefendedPairs(game).length === 0 && canThrowIn(game, HUMAN) && !game.players[HUMAN].passed && pendingThrowers(game).length > 0

  const canPlayCard = useCallback(
    (card: Card): boolean => {
      if (!game || game.over) return false
      if (humanOpening) return true
      if (humanDefending) return undefendedPairs(game).some((i) => beats(card, game.table[i].attack, game.trump))
      if (humanCanThrow) return tableRanks(game).has(card.rank)
      return false
    },
    [game, humanOpening, humanDefending, humanCanThrow],
  )

  const onHandCard = (card: Card) => {
    if (!game || !canPlayCard(card)) return
    if (humanOpening || humanCanThrow) {
      setGame((prev) => (prev ? doAttack(prev, HUMAN, card) : prev))
      setSelected(null)
      return
    }
    // Defending: auto-place when there is one target, otherwise pick the pair.
    const targets = undefendedPairs(game).filter((i) => beats(card, game.table[i].attack, game.trump))
    if (targets.length === 1) {
      setGame((prev) => (prev ? doDefend(prev, targets[0], card) : prev))
      setSelected(null)
    } else {
      setSelected((current) => (current && sameCard(current, card) ? null : card))
    }
  }

  const onTablePair = (pairIndex: number) => {
    if (!game || !selected || !humanDefending) return
    if (game.table[pairIndex].defense !== null) return
    if (!beats(selected, game.table[pairIndex].attack, game.trump)) return
    const card = selected
    setGame((prev) => (prev ? doDefend(prev, pairIndex, card) : prev))
    setSelected(null)
  }

  const humanHand = game ? sortHand(game.players[HUMAN].hand, game.trump) : []

  return (
    <main className="mx-auto min-h-[calc(100vh-68px)] max-w-[1240px] px-5 py-8 lg:px-8 lg:py-12">
      {/* Ad slot */}
      <div className="mb-6 flex items-center justify-center gap-3 border-2 border-dashed border-[var(--line)] bg-[var(--surface-soft)] py-3 text-center font-mono text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">
        <span className="size-1.5 bg-[var(--accent)]" /> Ad space — designed to stay out of your way
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/" className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)] transition hover:text-[var(--accent)]">
            <span className="rotate-180"><ArrowIcon /></span> Back to games
          </Link>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Durak</h1>
        </div>
        {game && (
          <div className="flex items-center gap-3">
            <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
              <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Deck</div>
              <div className="font-display text-xl font-bold tabular-nums">{game.deck.length}</div>
            </div>
            <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
              <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Trump</div>
              <div className={`font-display text-xl font-bold ${isRed(game.trump) ? 'text-[var(--accent)]' : ''}`}>{game.trump}</div>
            </div>
            <div className="border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center">
              <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Discard</div>
              <div className="font-display text-xl font-bold tabular-nums">{game.discard}</div>
            </div>
            <FullscreenButton />
          </div>
        )}
      </div>

      {!game && (
        /* ---------- setup ---------- */
        <div className="mx-auto max-w-[520px] border-2 border-[var(--ink)] bg-[var(--surface)] p-7">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">New table</h2>
          <label className="mt-6 block font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)]" htmlFor="durak-name">Your name</label>
          <input
            id="durak-name"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 16))}
            placeholder="You"
            className="mt-2 w-full border-2 border-[var(--ink)] bg-[var(--canvas)] px-4 py-3 font-display text-sm font-bold uppercase outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          />
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[.12em] text-[var(--muted)]">Saved in your browser — no account needed</p>

          <p className="mt-6 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)]">Players at the table (you + bots)</p>
          <div className="mt-2 flex gap-2">
            {[2, 3, 4, 5, 6].map((count) => (
              <button
                key={count}
                onClick={() => setPlayerCount(count)}
                className={`grid size-11 place-items-center border-2 font-display text-sm font-bold transition ${playerCount === count ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--ink)] bg-[var(--surface)] hover:border-[var(--accent)]'}`}
                aria-pressed={playerCount === count}
              >
                {count}
              </button>
            ))}
          </div>

          <button onClick={begin} className="retro-btn mt-8 w-full bg-[var(--accent)] py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white">
            Deal the cards ↗
          </button>
          <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
            Classic throw-in Durak, 36 cards. Beat every attack or take the pile — whoever is left holding cards is the durak. 🦈
          </p>
        </div>
      )}

      {game && (
        <>
          {/* ---------- opponents ---------- */}
          <div className="mb-5 flex flex-wrap justify-center gap-3">
            {game.players.map((player, index) => {
              if (index === HUMAN) return null
              const role = index === game.attacker ? '⚔ ' : index === game.defender ? '🛡 ' : ''
              return (
                <div key={index} className={`min-w-[120px] border-2 px-4 py-3 text-center ${player.out ? 'border-[var(--line)] opacity-45' : index === game.defender ? 'border-[var(--accent)]' : 'border-[var(--ink)]'} bg-[var(--surface)]`}>
                  <div className="font-display text-[11px] font-bold uppercase">{role}{player.name}</div>
                  <div className="mt-2 flex justify-center -space-x-4">
                    {player.out ? (
                      <span className="font-mono text-[9px] uppercase tracking-[.12em] text-[var(--accent)]">escaped</span>
                    ) : (
                      Array.from({ length: Math.min(player.hand.length, 7) }, (_, i) => <CardBack key={i} small />)
                    )}
                  </div>
                  {!player.out && <div className="mt-1 font-mono text-[9px] text-[var(--muted)]">{player.hand.length} cards</div>}
                </div>
              )
            })}
          </div>

          {/* ---------- table ---------- */}
          <div className="relative border-2 border-[var(--ink)] bg-[var(--surface)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-6">
              {/* deck + trump */}
              <div className="relative h-[92px] w-[100px] shrink-0">
                {game.deck.length > 0 && (
                  <span className="absolute left-0 top-2 block rotate-90"><PlayingCard card={game.trumpCard} /></span>
                )}
                {game.deck.length > 1 && <span className="absolute left-8 top-1"><CardBack /></span>}
                {game.deck.length === 0 && (
                  <span className={`absolute left-6 top-6 font-display text-3xl font-bold ${isRed(game.trump) ? 'text-[var(--accent)]' : ''}`}>{game.trump}</span>
                )}
              </div>

              {/* attack / defense pairs */}
              <div className="flex min-h-[110px] flex-1 flex-wrap items-start justify-center gap-4">
                {game.table.length === 0 && <p className="self-center font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)]">The table is clear</p>}
                {game.table.map((pair, index) => {
                  const targetable = humanDefending && selected !== null && pair.defense === null && beats(selected, pair.attack, game.trump)
                  return (
                    <button
                      key={index}
                      onClick={() => onTablePair(index)}
                      disabled={!targetable}
                      className={`relative h-[104px] w-[80px] ${targetable ? 'outline-2 outline-dashed outline-[var(--accent)]' : ''}`}
                      aria-label={`Attack ${RANK_LABELS[pair.attack.rank]}${pair.attack.suit}${pair.defense ? ', beaten' : ''}`}
                    >
                      <span className="absolute left-0 top-0"><PlayingCard card={pair.attack} dimmed={pair.defense !== null} /></span>
                      {pair.defense && <span className="absolute left-4 top-5 block rotate-6"><PlayingCard card={pair.defense} /></span>}
                    </button>
                  )
                })}
              </div>

              {/* discard */}
              <div className="hidden shrink-0 text-center sm:block">
                <div className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">Discard</div>
                <div className="mt-1 flex -space-x-5">
                  {game.discard === 0 && <span className="font-mono text-[9px] text-[var(--muted)]">—</span>}
                  {Array.from({ length: Math.min(Math.ceil(game.discard / 8), 4) }, (_, i) => <CardBack key={i} small />)}
                </div>
              </div>
            </div>

            {/* status line */}
            <p className="mt-4 border-t-2 border-[var(--line)] pt-3 text-center font-display text-[11px] font-bold uppercase tracking-tight" aria-live="polite">
              {game.over ? game.message : humanDefending ? 'Your defense — beat the cards or take' : humanOpening ? 'Your attack — play any card' : humanCanThrow ? 'You can throw in a matching card' : game.message}
            </p>

            {/* game over overlay */}
            {game.over && (
              <div className="absolute inset-0 grid place-items-center bg-[color:var(--canvas)]/85 backdrop-blur-sm">
                <div className="border-2 border-[var(--accent)] bg-[var(--surface)] px-8 py-7 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">Game over</p>
                  <p className="mt-2 font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
                    {game.loser === HUMAN ? 'You are the durak! 🦈' : game.loser === null ? 'Draw — no durak!' : `${game.players[game.loser].name} is the durak!`}
                  </p>
                  {game.loser !== HUMAN && game.loser !== null && <p className="mt-2 text-sm text-[var(--muted)]">You escaped — well played!</p>}
                  <button onClick={() => setGame(null)} className="retro-btn mt-5 bg-[var(--accent)] px-6 py-2.5 font-display text-xs font-bold uppercase text-white">
                    New table ↗
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ---------- your hand ---------- */}
          <div className="mt-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <p className="font-display text-[11px] font-bold uppercase tracking-tight">
                {game.attacker === HUMAN ? '⚔ ' : game.defender === HUMAN ? '🛡 ' : ''}{game.players[HUMAN].name}{game.players[HUMAN].out ? ' · escaped 🎉' : ''}
              </p>
              <div className="flex gap-2.5">
                {humanDefending && (
                  <button onClick={() => { setGame((prev) => (prev ? endRound(prev, true) : prev)); setSelected(null) }} className="retro-btn bg-[var(--surface)] px-5 py-2 font-display text-[10px] font-bold uppercase">
                    Take cards
                  </button>
                )}
                {humanCanThrow && (
                  <button onClick={() => setGame((prev) => (prev ? doPass(prev, HUMAN) : prev))} className="retro-btn bg-[var(--ink)] px-5 py-2 font-display text-[10px] font-bold uppercase text-[var(--canvas)]">
                    Done — bito
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 border-2 border-[var(--ink)] bg-[var(--surface-soft)] p-3">
              {humanHand.length === 0 && <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)]">No cards — you&apos;re safe</p>}
              {humanHand.map((card) => (
                <PlayingCard
                  key={`${card.rank}${card.suit}`}
                  card={card}
                  onClick={() => onHandCard(card)}
                  disabled={!canPlayCard(card)}
                  dimmed={!canPlayCard(card) && (humanDefending || humanOpening || humanCanThrow)}
                  selected={selected !== null && sameCard(selected, card)}
                />
              ))}
            </div>
            <p className="mt-3 border-2 border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
              <span className="font-bold text-[var(--ink)]">Tip:</span> beat an attack with a higher card of the same suit or any trump ({game.trump}). When defending against several cards, click your card first, then the attack to beat. 🦈
            </p>
          </div>
        </>
      )}
    </main>
  )
}
