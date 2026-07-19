import { createContext, useContext, useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import CookieBanner from './CookieBanner'
import { MoonIcon, SunIcon } from './icons'

// ---- Dark mode, shared across all pages and persisted to localStorage ----
const DarkModeContext = createContext<{ dark: boolean; toggle: () => void }>({
  dark: true,
  toggle: () => {},
})

export function useDarkMode() {
  return useContext(DarkModeContext)
}

function readInitialDark(): boolean {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('og-theme')
    if (stored === 'light') return false
    if (stored === 'dark') return true
  }
  return true // default to dark
}

const NAV_LINKS = [
  ['/#about', 'About us'],
  ['/#how-it-works', 'How it works'],
  ['/#games', 'Catalog'],
] as const

export default function Layout() {
  const [dark, setDark] = useState(readInitialDark)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('og-theme', dark ? 'dark' : 'light')
    }
  }, [dark])

  return (
    <DarkModeContext.Provider value={{ dark, toggle: () => setDark((v) => !v) }}>
      <div className="min-h-screen overflow-x-hidden bg-[var(--canvas)] text-[var(--ink)] transition-colors duration-300">
        <header className="sticky top-0 z-40 border-b-2 border-[var(--ink)] bg-[color:var(--canvas)]/95 backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
            <Link to="/" className="group flex items-center gap-2.5" aria-label="SharksGames home">
              <span className="grid size-9 place-items-center border-2 border-[var(--ink)] bg-[var(--accent)] font-display text-xs font-bold text-white transition-transform duration-200 group-hover:-rotate-6">SG</span>
              <span className="font-display text-base font-bold uppercase tracking-tight sm:text-lg">Sharks<span className="text-[var(--accent)]">Games</span></span>
            </Link>

            <nav className="hidden items-center gap-7 font-display text-[11px] font-bold uppercase tracking-wide md:flex">
              {NAV_LINKS.map(([href, label]) => (
                <a key={href} href={href} className="transition-colors hover:text-[var(--accent)]">{label}</a>
              ))}
            </nav>

            <div className="flex items-center gap-2.5">
              <button onClick={() => setDark((value) => !value)} className="retro-btn inline-flex h-9 items-center gap-2 bg-[var(--surface)] px-3 font-display text-[10px] font-bold uppercase" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
                {dark ? <SunIcon /> : <MoonIcon />}<span className="hidden sm:inline">{dark ? 'Light' : 'Dark'}</span>
              </button>
              <button onClick={() => setMenuOpen((value) => !value)} className="grid size-9 place-items-center border-2 border-[var(--ink)] bg-[var(--surface)] text-[var(--ink)] md:hidden" aria-label="Toggle navigation" aria-expanded={menuOpen}>
                <span className="flex w-4 flex-col gap-1"><i className="h-px w-full bg-current" /><i className="h-px w-full bg-current" /><i className="h-px w-full bg-current" /></span>
              </button>
            </div>
          </div>
          {menuOpen && (
            <nav className="border-t-2 border-[var(--ink)] bg-[var(--surface)] px-5 py-4 md:hidden">
              <div className="mx-auto flex max-w-[1240px] flex-col gap-4 font-display text-xs font-bold uppercase">
                {NAV_LINKS.map(([href, label]) => (
                  <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
                ))}
              </div>
            </nav>
          )}
        </header>

        <Outlet />

        <footer className="border-t-2 border-[var(--ink)] bg-[#0b0b0e] text-white">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-7 px-5 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <Link to="/" className="font-display text-base font-bold uppercase">Sharks<span className="text-[#ff4b4d]">Games</span></Link>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[.14em] text-white/45">▸ Insert coffee to continue</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 font-display text-[10px] font-bold uppercase tracking-wide text-white/70">
              <Link to="/privacy" className="transition-colors hover:text-[#ff4b4d]">Privacy</Link>
              <Link to="/cookies" className="transition-colors hover:text-[#ff4b4d]">Cookies</Link>
              <Link to="/imprint" className="transition-colors hover:text-[#ff4b4d]">Imprint</Link>
              <a href="mailto:alexeykrasnokutskiy@googlemail.com" className="transition-colors hover:text-[#ff4b4d]">Contact</a>
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[.13em] text-white/40">© 2026 SharksGames</p>
          </div>
        </footer>

        <CookieBanner />
      </div>
    </DarkModeContext.Provider>
  )
}
