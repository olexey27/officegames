import { useEffect, useState } from 'react'

type Difficulty = 'Easy' | 'Classic' | 'Hard'

const difficulties: { name: Difficulty; note: string; time: string; cells: string }[] = [
  { name: 'Easy', note: 'A gentle reset between calls.', time: '4–6 min', cells: '46 clues' },
  { name: 'Classic', note: 'The right amount of brain stretch.', time: '7–10 min', cells: '36 clues' },
  { name: 'Hard', note: 'For when the spreadsheet can wait.', time: '12+ min', cells: '28 clues' },
]

function SunIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-none stroke-current stroke-[1.8]"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
}
function MoonIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-none stroke-current stroke-[1.8]"><path d="M20.6 15.6A9 9 0 0 1 8.4 3.4 9 9 0 1 0 20.6 15.6Z" /></svg>
}
function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-none stroke-current stroke-[2]"><path d="M5 12h13M14 6l6 6-6 6" /></svg>
}
function GridMark() {
  return <svg viewBox="0 0 48 48" aria-hidden="true" className="size-12"><rect x="2" y="2" width="44" height="44" rx="10" fill="currentColor" /><path d="M16 8v32M32 8v32M8 16h32M8 32h32" stroke="white" strokeWidth="2.5" /><path d="M16 8v32M32 8v32M8 16h32M8 32h32" stroke="white" strokeOpacity=".35" strokeWidth="1" /></svg>
}

export default function App() {
  const [dark, setDark] = useState(true)
  const [selected, setSelected] = useState<Difficulty>('Classic')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notice, setNotice] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const current = difficulties.find((item) => item.name === selected)!

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--canvas)] text-[var(--ink)] transition-colors duration-300">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color:var(--canvas)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <a href="#top" className="group flex items-center gap-2.5" aria-label="OfficeGames home">
            <span className="grid size-9 place-items-center rounded-[11px] bg-[var(--accent)] font-display text-sm font-bold text-white shadow-[0_7px_20px_var(--glow)] transition-transform duration-200 group-hover:-rotate-6">OG</span>
            <span className="font-display text-xl font-bold tracking-[-0.06em]">Office<span className="text-[var(--accent)]">Games</span></span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-semibold md:flex">
            <a href="#games" className="transition-colors hover:text-[var(--accent)]">Games</a>
            <a href="#how-it-works" className="transition-colors hover:text-[var(--accent)]">How it works</a>
            <span className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--muted)]">EU edition</span>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => setDark((value) => !value)} className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-bold transition hover:border-[var(--accent)]" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? <SunIcon /> : <MoonIcon />}<span className="hidden sm:inline">{dark ? 'Light' : 'Dark'}</span>
            </button>
            <button onClick={() => setMenuOpen((value) => !value)} className="grid size-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] md:hidden" aria-label="Toggle navigation" aria-expanded={menuOpen}>
              <span className="flex w-4 flex-col gap-1"><i className="h-px w-full bg-current" /><i className="h-px w-full bg-current" /><i className="h-px w-full bg-current" /></span>
            </button>
          </div>
        </div>
        {menuOpen && <nav className="border-t border-[var(--line)] bg-[var(--surface)] px-5 py-4 md:hidden"><div className="mx-auto flex max-w-[1240px] flex-col gap-4 text-sm font-bold"><a href="#games" onClick={() => setMenuOpen(false)}>Games</a><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a></div></nav>}
      </header>

      <div className="border-b border-[var(--line)] bg-[var(--surface-soft)]">
        <div className="mx-auto flex max-w-[1240px] items-center justify-center gap-3 px-5 py-2.5 text-center font-mono text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">
          <span className="size-1.5 rounded-full bg-[var(--accent)]" /> Ad space — designed to stay out of your way
        </div>
      </div>

      <section id="top" className="office-grid relative isolate overflow-hidden border-b border-[var(--line)]">
        <div className="absolute -right-24 top-[-120px] -z-10 size-[510px] rounded-full bg-[var(--accent)] opacity-[.08] blur-3xl" />
        <div className="absolute right-[12%] top-24 -z-10 hidden size-64 rotate-12 rounded-[42px] border border-[var(--accent)] opacity-20 lg:block" />
        <div className="mx-auto grid min-h-[540px] max-w-[1240px] items-center gap-10 px-5 py-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-20">
          <div className="max-w-[700px]">
            <p className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.18em] text-[var(--accent)]"><span className="h-px w-8 bg-current" /> Better breaks begin here</p>
            <h1 className="font-display text-[clamp(3.2rem,7vw,6.5rem)] font-bold leading-[.87] tracking-[-.075em]">Press pause.<br /><span className="text-[var(--accent)]">Play smart.</span></h1>
            <p className="mt-7 max-w-[545px] text-base leading-7 text-[var(--muted)] sm:text-lg">Tiny games for the in-between moments: no downloads, no accounts, just a clearer head before the next thing on your calendar.</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a href="#games" className="inline-flex items-center gap-3 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_28px_var(--glow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-deep)]">Explore games <ArrowIcon /></a>
              <span className="font-mono text-[10px] uppercase tracking-[.13em] text-[var(--muted)]">Made for a 5-minute reset</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[445px] lg:justify-self-end">
            <div className="absolute inset-8 rounded-[32px] bg-[var(--accent)] opacity-15 blur-2xl" />
            <div className="relative overflow-hidden rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_24px_70px_rgba(0,0,0,.13)] sm:p-7">
              <div className="mb-7 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.15em] text-[var(--muted)]">Today&apos;s desk break</span><span className="rounded-full bg-[var(--accent)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.11em] text-white">01 live</span></div>
              <div className="grid grid-cols-3 gap-2.5" aria-label="Preview Sudoku grid">
                {Array.from({ length: 81 }, (_, index) => {
                  const values: Record<number, string> = { 0: '7', 2: '4', 5: '8', 7: '2', 12: '3', 15: '9', 20: '5', 24: '8', 28: '9', 31: '6', 35: '4', 37: '6', 40: '2', 43: '9', 45: '4', 49: '7', 53: '3', 56: '8', 60: '1', 64: '5', 68: '6', 71: '8', 73: '2', 77: '4', 80: '7' }
                  const block = Math.floor(index / 27) * 3 + Math.floor((index % 9) / 3)
                  return <div key={index} className={`grid aspect-square place-items-center rounded-[3px] text-xs font-bold sm:text-sm ${block % 2 === 0 ? 'bg-[var(--surface-soft)]' : 'bg-[var(--canvas)]'} ${values[index] ? 'text-[var(--ink)]' : ''}`}>{values[index]}</div>
                })}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-5"><span className="font-display text-lg font-bold tracking-[-.04em]">Sudoku</span><span className="font-mono text-[10px] text-[var(--muted)]">05:00 avg.</span></div>
            </div>
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
            <button onClick={() => setNotice(true)} className="mt-2 inline-flex w-fit items-center gap-3 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[var(--accent-deep)]">Play {selected} Sudoku <ArrowIcon /></button>
            {notice && <div role="status" className="rounded-xl border border-[var(--accent)] bg-[var(--surface)] px-4 py-3 text-sm"><span className="font-bold text-[var(--accent)]">{current.name} selected.</span> The Sudoku board is ready to open from this choice in the next step.</div>}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20"><div className="grid gap-8 border-b border-[var(--line)] pb-12 md:grid-cols-[1fr_2fr]"><h2 className="font-display text-4xl font-bold tracking-[-.06em]">Built for the<br /><span className="text-[var(--accent)]">in-between.</span></h2><div className="grid gap-7 sm:grid-cols-3">{[['01', 'Open', 'No sign-up, no setup.'], ['02', 'Pick', 'Find the pace that fits.'], ['03', 'Reset', 'Go back clearer than before.']].map(([number, title, text]) => <div key={number}><p className="font-mono text-[10px] text-[var(--accent)]">{number}</p><h3 className="mt-3 font-display text-xl font-bold tracking-[-.04em]">{title}</h3><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{text}</p></div>)}</div></div></section>

      <footer className="bg-[var(--surface)]"><div className="mx-auto flex max-w-[1240px] flex-col gap-7 px-5 py-10 lg:flex-row lg:items-end lg:justify-between lg:px-8"><div><a href="#top" className="font-display text-xl font-bold tracking-[-.06em]">Office<span className="text-[var(--accent)]">Games</span></a><p className="mt-2 max-w-sm text-xs leading-5 text-[var(--muted)]">A small European browser-games corner for better workday breaks.</p></div><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[var(--muted)]"><a href="#privacy" className="hover:text-[var(--accent)]">Privacy</a><a href="#cookies" className="hover:text-[var(--accent)]">Cookies</a><a href="#imprint" className="hover:text-[var(--accent)]">Imprint</a><a href="#contact" className="hover:text-[var(--accent)]">Contact</a></div><p className="font-mono text-[9px] uppercase tracking-[.13em] text-[var(--muted)]">© 2026 OfficeGames</p></div></footer>
    </main>
  )
}
