import { createContext, useContext, useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
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
        <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color:var(--canvas)]/90 backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
            <Link to="/" className="group flex items-center gap-2.5" aria-label="OfficeGames home">
              <span className="grid size-9 place-items-center rounded-[11px] bg-[var(--accent)] font-display text-sm font-bold text-white shadow-[0_7px_20px_var(--glow)] transition-transform duration-200 group-hover:-rotate-6">OG</span>
              <span className="font-display text-xl font-bold tracking-[-0.06em]">Office<span className="text-[var(--accent)]">Games</span></span>
            </Link>

            <nav className="hidden items-center gap-7 text-sm font-semibold md:flex">
              <NavLink to="/" className="transition-colors hover:text-[var(--accent)]">Games</NavLink>
              <a href="/#how-it-works" className="transition-colors hover:text-[var(--accent)]">How it works</a>
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
          {menuOpen && <nav className="border-t border-[var(--line)] bg-[var(--surface)] px-5 py-4 md:hidden"><div className="mx-auto flex max-w-[1240px] flex-col gap-4 text-sm font-bold"><Link to="/" onClick={() => setMenuOpen(false)}>Games</Link><a href="/#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a></div></nav>}
        </header>

        <Outlet />

        <footer className="bg-[var(--surface)]"><div className="mx-auto flex max-w-[1240px] flex-col gap-7 px-5 py-10 lg:flex-row lg:items-end lg:justify-between lg:px-8"><div><Link to="/" className="font-display text-xl font-bold tracking-[-0.06em]">Office<span className="text-[var(--accent)]">Games</span></Link><p className="mt-2 max-w-sm text-xs leading-5 text-[var(--muted)]">A small European browser-games corner for better workday breaks.</p></div><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[var(--muted)]"><a href="#privacy" className="hover:text-[var(--accent)]">Privacy</a><a href="#cookies" className="hover:text-[var(--accent)]">Cookies</a><a href="#imprint" className="hover:text-[var(--accent)]">Imprint</a><a href="#contact" className="hover:text-[var(--accent)]">Contact</a></div><p className="font-mono text-[9px] uppercase tracking-[.13em] text-[var(--muted)]">© 2026 OfficeGames</p></div></footer>
      </div>
    </DarkModeContext.Provider>
  )
}
