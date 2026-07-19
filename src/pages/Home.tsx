import { Link } from 'react-router-dom'
import ArcadeBackdrop, { FloatingShark } from '../components/ArcadeBackdrop'
import CabinetScreen, { ChessPreview, DurakPreview, FourInARowPreview, MemoryPreview, MinesweeperPreview, Preview2048, SudokuPreview, TetrisPreview } from '../components/GamePreviews'

const GAMES = [
  { name: 'Sudoku', to: '/sudoku', tag: 'Focus', preview: <SudokuPreview /> },
  { name: '2048', to: '/2048', tag: 'Merge', preview: <Preview2048 /> },
  { name: 'Memory', to: '/memory', tag: '31 levels', preview: <MemoryPreview /> },
  { name: 'Minesweeper', to: '/minesweeper', tag: 'Logic', preview: <MinesweeperPreview /> },
  { name: 'Durak', to: '/durak', tag: 'Cards · vs bots', preview: <DurakPreview /> },
  { name: 'Tetris', to: '/tetris', tag: 'Blocks', preview: <TetrisPreview /> },
  { name: 'Chess', to: '/chess', tag: 'Vs Sharkfish', preview: <ChessPreview /> },
  { name: 'Four in a Row', to: '/four-in-a-row', tag: 'Vs Sharkfish', preview: <FourInARowPreview /> },
]

const STEPS = [
  ['☕', 'Grab your coffee'],
  ['🕹️', 'Pick a game'],
  ['🏆', 'Beat your best'],
  ['🧠', 'Return sharper'],
] as const

function AdPanel({ note }: { note: string }) {
  return (
    <div className="flex items-center justify-center gap-3 border-2 border-dashed border-[var(--line)] bg-[var(--surface-soft)] py-4 text-center font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)]">
      <span className="size-1.5 bg-[var(--accent)]" /> {note}
    </div>
  )
}

export default function Home() {
  return (
    <main>
      {/* Top ad strip */}
      <div className="mx-auto max-w-[1240px] px-5 pt-6 lg:px-8">
        <AdPanel note="Ad space — designed to stay out of your way" />
      </div>

      {/* Hero: image collage + pixel headline, like an arcade flyer */}
      <section id="top" className="mx-auto grid max-w-[1240px] gap-5 px-5 py-10 lg:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)] lg:px-8 lg:py-14">
        {/* Big shark tile */}
        <div className="relative isolate min-h-[340px] overflow-hidden border-2 border-[var(--ink)] bg-[#0b0b0e] lg:min-h-[500px]">
          <ArcadeBackdrop />
          <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 bg-[#ff4b4d] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.11em] text-white">
            <span className="size-1.5 animate-pulse bg-white" /> 08 live
          </span>
          <div className="grid h-full place-items-center p-6">
            <div className="w-full max-w-[440px]"><FloatingShark /></div>
          </div>
        </div>

        {/* Tiles + headline + CTA */}
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-5">
            <CabinetScreen><SudokuPreview /></CabinetScreen>
            <CabinetScreen><Preview2048 /></CabinetScreen>
            <CabinetScreen><MinesweeperPreview /></CabinetScreen>
          </div>
          <h1 className="font-display text-[clamp(1.9rem,4.6vw,3.7rem)] font-bold uppercase leading-[1.05] tracking-tight">
            Unleash your gaming potential
          </h1>
          <p className="max-w-[520px] text-sm leading-6 text-[var(--muted)] sm:text-base">
            Tiny games for the in-between moments: no downloads, no accounts, just a clearer head before the next thing on your calendar.
          </p>
          <div className="mt-1">
            <a href="#games" className="retro-btn inline-block bg-[var(--accent)] px-9 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white">
              Let&apos;s go ↗
            </a>
          </div>
        </div>
      </section>

      {/* About us */}
      <section id="about" className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8">
        <h2 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">About us</h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <p className="text-sm leading-7 text-[var(--muted)]">
            SharksGames is a small browser arcade for the in-between moments of a workday. No downloads, no accounts, no setup — open a game, play one round, and get back to your day with a clearer head.
          </p>
          <p className="text-sm leading-7 text-[var(--muted)]">
            Every game is built for a five-minute break: Sudoku with three lives, the classic 2048, Memory with 31 levels and a trophy at the end, and Minesweeper with a proper explosion. More good distractions are on the way.
          </p>
        </div>
      </section>

      {/* How it works — staircase, like coin-op instructions */}
      <section id="how-it-works" className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">How it works</h2>
          <a href="#games" className="retro-btn bg-[var(--ink)] px-5 py-2.5 font-display text-[10px] font-bold uppercase tracking-wide text-[var(--canvas)]">
            Go to catalog
          </a>
        </div>
        <div className="mt-10 overflow-x-hidden">
          {STEPS.map(([icon, label], index) => (
            <div key={label} style={{ marginLeft: `min(${index * 56}px, ${index * 7}vw)` }}>
              {index > 0 && <div className="ml-5 h-8 w-12 border-b-2 border-l-2 border-[var(--line)]" aria-hidden="true" />}
              <div className="flex items-center gap-4">
                <span className="grid size-11 shrink-0 place-items-center border-2 border-[var(--ink)] bg-[var(--surface)] text-xl">{icon}</span>
                <span className="font-display text-base font-bold uppercase tracking-tight sm:text-xl">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Wide ad panel */}
      <section className="mx-auto max-w-[1240px] px-5 py-6 lg:px-8" aria-label="Advertising space">
        <div className="grid h-[120px] place-items-center border-2 border-dashed border-[var(--line)] bg-[var(--surface-soft)]">
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--muted)]">Ad space · reserved for future sponsors</p>
        </div>
      </section>

      {/* Catalog */}
      <section id="games" className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Catalog</h2>
          <p className="max-w-sm text-sm leading-6 text-[var(--muted)]">
            From logic to reflexes — pick a game, play a round, get back sharper.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {GAMES.map((game) => (
            <div key={game.name} className="group flex flex-col border-2 border-[var(--ink)] bg-[var(--surface)]">
              <div className="flex items-center justify-between border-b-2 border-[var(--ink)] px-3 py-2.5">
                <span className="font-display text-xs font-bold uppercase tracking-tight">{game.name}</span>
                <span className="font-mono text-[9px] uppercase tracking-[.1em] text-[var(--muted)]">{game.tag}</span>
              </div>
              <div className="p-3">
                <CabinetScreen>{game.preview}</CabinetScreen>
              </div>
              <div className="mt-auto px-3 pb-4">
                <Link to={game.to} className="retro-btn block bg-[var(--ink)] py-2.5 text-center font-display text-[11px] font-bold uppercase tracking-wide text-[var(--canvas)]">
                  Play
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-9 text-center">
          <span className="inline-block border-2 border-dashed border-[var(--line)] px-7 py-3 font-display text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
            More games soon
          </span>
        </div>
      </section>
    </main>
  )
}
