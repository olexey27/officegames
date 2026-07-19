import { Link } from 'react-router-dom'
import { ArrowIcon } from '../../components/icons'
import { CONSENT_KEY, readConsent } from '../../components/CookieBanner'

const STORED_ITEMS: [string, string][] = [
  ['og-theme', 'Chosen color scheme (light/dark)'],
  ['sg-2048-best', 'Best 2048 score'],
  ['sg-memory-unlocked', 'Unlocked Memory levels'],
  ['sg-tetris-best', 'Best Tetris score'],
  ['sg-player-name', 'Freely chosen player name (Durak)'],
  ['sg-consent', 'Your choice in the cookie notice'],
]

export default function Cookies() {
  const consent = readConsent()

  const resetChoice = () => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(CONSENT_KEY)
    window.dispatchEvent(new Event('sg-consent-changed'))
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-68px)] max-w-[820px] px-5 py-10 lg:px-8">
      <Link to="/" className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)] transition hover:text-[var(--accent)]">
        <span className="rotate-180"><ArrowIcon /></span> Back to games
      </Link>
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Cookies</h1>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)]">Cookie &amp; storage notice · last updated: July 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-7">
        <section>
          <h2 className="font-display text-base font-bold uppercase">No cookies, no tracking</h2>
          <p className="mt-3 text-[var(--muted)]">
            SharksGames currently sets <strong className="text-[var(--ink)]">no cookies</strong> and uses no tracking or analytics services. To run the games we only use your browser&apos;s local storage (localStorage) — this data stays on your device and is never transmitted.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">What is stored locally</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-2 border-[var(--line)] text-left">
              <thead>
                <tr className="border-b-2 border-[var(--line)] bg-[var(--surface-soft)]">
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">Key</th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {STORED_ITEMS.map(([key, purpose]) => (
                  <tr key={key} className="border-b border-[var(--line)] last:border-b-0">
                    <td className="px-3 py-2 font-mono text-xs">{key}</td>
                    <td className="px-3 py-2 text-[var(--muted)]">{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[var(--muted)]">
            You can delete all entries at any time via your browser settings (“clear site data”). Doing so will remove saved best scores and progress.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">Future advertising</h2>
          <p className="mt-3 text-[var(--muted)]">
            If advertising (e.g. Google AdSense) is added in the future, cookies or similar technologies from advertising partners will be used for the first time. In that case we will ask for your consent beforehand — without consent, no personalized advertising will be loaded.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">Your current choice</h2>
          <p className="mt-3 text-[var(--muted)]">
            Status: <strong className="text-[var(--ink)]">{consent === 'all' ? 'Everything accepted' : consent === 'essential' ? 'Necessary storage only' : 'No choice made yet'}</strong>
          </p>
          <button onClick={resetChoice} className="retro-btn mt-4 bg-[var(--surface)] px-5 py-2.5 font-display text-[11px] font-bold uppercase">
            Change choice
          </button>
        </section>
      </div>
    </main>
  )
}
