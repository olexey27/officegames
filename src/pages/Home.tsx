import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowIcon, GridMark } from '../components/icons'
import ArcadeBackdrop, { FloatingShark } from '../components/ArcadeBackdrop'
import type { Difficulty } from '../games/sudoku/engine'

const difficulties: { name: Difficulty; note: string; time: string; cells: string }[] = [
  { name: 'Easy', note: 'A gentle reset between calls.', time: '4–6 min', cells: '46 clues' },
  { name: 'Classic', note: 'The right amount of brain stretch.', time: '7–10 min', cells: '36 clues' },
  { name: 'Hard', note: 'For when the spreadsheet can wait.', time: '12+ min', cells: '28 clues' },
]

export default function Home() {
  const [selected, setSelected] = useState<Difficulty>('Classic')
  const navigate = useNavigate()

  return (
    <main>
      <div className="border-b border-[var(--line)] bg-[var(--surface-soft)]">
        <div className="mx-auto flex max-w-[1240px] items-center justify-center gap-3 px-5 py-2.5 text-center font-mono text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">
          <span className="size-1.5 rounded-full bg-[var(--accent)]" /> Ad space — designed to stay out of your way
        </div>
      </div>

      <section id="top" className="relative isolate overflow-hidden border-b border-[#232327] bg-[#0b0b0e] text-white">
        <ArcadeBackdrop />

        {/* Live indicator — simply in the corner */}
        <span className="absolute right-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#ff4b4d] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.11em] text-white lg:right-8">
          <span className="size-1.5 animate-pulse rounded-full bg-white" /> 01 live
        </span>

        <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-14 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-20">
          <div className="max-w-[700px]">
            <p className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.18em] text-[#ff4b4d]"><span className="h-px w-8 bg-current" /> Better breaks begin here</p>
            <h1 className="font-display text-[clamp(3.2rem,7vw,6.5rem)] font-bold leading-[.87] tracking-[-.075em]">Press pause.<br /><span className="text-[#ff4b4d]">Play smart.</span></h1>
            <p className="mt-7 max-w-[545px] text-base leading-7 text-[#b3b2b7] sm:text-lg">Tiny games for the in-between moments: no downloads, no accounts, just a clearer head before the next thing on your calendar.</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a href="#games" className="inline-flex items-center gap-3 rounded-full bg-[#ff4b4d] px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(255,75,77,.35)] transition hover:-translate-y-0.5 hover:bg-[#d83138]">Explore games <ArrowIcon /></a>
              <span className="font-mono text-[10px] uppercase tracking-[.13em] text-white/40">Made for a 5-minute reset</span>
            </div>
          </div>

          {/* The shark floats free — no window, no card */}
          <div className="relative mx-auto w-full max-w-[520px] lg:justify-self-end">
            <FloatingShark />
          </div>
        </div>
      </section>

      <section id="games" className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-24">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">The games shelf</p><h2 className="mt-2 font-display text-4xl font-bold tracking-[-.06em] sm:text-5xl">Pick your pause.</h2></div><p className="max-w-xs text-sm leading-6 text-[var(--muted)]">A deliberately small collection. Because decision fatigue is not a game.</p></div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
          <article className="group relative overflow-hidden rounded-[26px] border border-[var(--line)] bg-[var(--surface)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[var(--accent)] sm:p-7">
            <div className="absolute right-0 top-0 h-1 w-36 shimmer-line opacity-80" />
            <div className="grid gap-7 sm:grid-cols-[154px_1fr] sm:items-center">
              <div className="grid aspect-square place-items-center rounded-[22px] bg-[var(--accent)] text-white shadow-[0_16px_40px_var(--glow)]"><GridMark /></div>
              <div><div className="flex flex-wrap items-center gap-3"><h3 className="font-display text-3xl font-bold tracking-[-.06em]">Sudoku</h3><span className="rounded-full border border-[var(--line)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.12em] text-[var(--muted)]">Focus game</span></div><p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">One grid. Nine digits. A satisfying excuse to stop thinking about emails for a moment.</p><a href="#choose" className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--accent)] transition group-hover:gap-3">Choose difficulty <ArrowIcon /></a></div>
            </div>
          </article>

          <aside className="flex min-h-[190px] flex-col justify-between rounded-[26px] border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-6"><span className="font-mono text-[10px] uppercase tracking-[.15em] text-[var(--muted)]">Up next</span><div><p className="font-display text-2xl font-bold tracking-[-.05em]">More good<br />distractions.</p><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Word, logic and quick-fire games are being lined up.</p></div><span className="font-mono text-[10px] text-[var(--accent)]">02 / IN DEVELOPMENT</span></aside>
        </div>
      </section>

      <section id="choose" className="border-y border-[var(--line)] bg-[var(--surface-soft)]">
        <div className="mx-auto grid max-w-[1240px] gap-9 px-5 py-16 lg:grid-cols-[.74fr_1.26fr] lg:px-8 lg:py-20">
          <div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">Sudoku selection</p><h2 className="mt-2 font-display text-4xl font-bold leading-none tracking-[-.06em] sm:text-5xl">Match the moment.</h2><p className="mt-5 max-w-sm text-sm leading-6 text-[var(--muted)]">This is your starting point — choose how much headspace you&apos;d like to give away.</p></div>
          <div className="grid gap-3">
            {difficulties.map((item, index) => <button key={item.name} onClick={() => setSelected(item.name)} className={`group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border p-4 text-left transition sm:p-5 ${selected === item.name ? 'border-[var(--accent)] bg-[var(--surface)] shadow-[0_12px_30px_var(--glow)]' : 'border-[var(--line)] bg-[var(--canvas)] hover:border-[var(--muted)]'}`} aria-pressed={selected === item.name}><span className={`grid size-10 place-items-center rounded-xl font-display text-lg font-bold ${selected === item.name ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] text-[var(--muted)]'}`}>0{index + 1}</span><span><span className="block font-display text-xl font-bold tracking-[-.04em]">{item.name}</span><span className="mt-1 block text-xs text-[var(--muted)]">{item.note}</span></span><span className="hidden text-right font-mono text-[10px] leading-5 text-[var(--muted)] sm:block">{item.time}<br />{item.cells}</span></button>)}
            <button onClick={() => navigate(`/sudoku?difficulty=${selected}`)} className="mt-2 inline-flex w-fit items-center gap-3 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[var(--accent-deep)]">Play {selected} Sudoku <ArrowIcon /></button>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20"><div className="grid gap-8 border-b border-[var(--line)] pb-12 md:grid-cols-[1fr_2fr]"><h2 className="font-display text-4xl font-bold tracking-[-.06em]">Built for the<br /><span className="text-[var(--accent)]">in-between.</span></h2><div className="grid gap-7 sm:grid-cols-3">{[['01', 'Open', 'No sign-up, no setup.'], ['02', 'Pick', 'Find the pace that fits.'], ['03', 'Reset', 'Go back clearer than before.']].map(([number, title, text]) => <div key={number}><p className="font-mono text-[10px] text-[var(--accent)]">{number}</p><h3 className="mt-3 font-display text-xl font-bold tracking-[-.04em]">{title}</h3><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{text}</p></div>)}</div></div></section>
    </main>
  )
}
