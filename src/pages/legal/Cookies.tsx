import { Link } from 'react-router-dom'
import { ArrowIcon } from '../../components/icons'
import { CONSENT_KEY, readConsent } from '../../components/CookieBanner'

const STORED_ITEMS: [string, string][] = [
  ['og-theme', 'Gewähltes Farbschema (hell/dunkel)'],
  ['sg-2048-best', 'Bester 2048-Punktestand'],
  ['sg-memory-unlocked', 'Freigeschaltete Memory-Level'],
  ['sg-tetris-best', 'Bester Tetris-Punktestand'],
  ['sg-player-name', 'Frei gewählter Spielername (Durak)'],
  ['sg-consent', 'Ihre Auswahl im Cookie-Hinweis'],
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
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)]">Cookie- und Speicher-Hinweise · Stand: Juli 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-7">
        <section>
          <h2 className="font-display text-base font-bold uppercase">Keine Cookies, kein Tracking</h2>
          <p className="mt-3 text-[var(--muted)]">
            SharksGames setzt derzeit <strong className="text-[var(--ink)]">keine Cookies</strong> und verwendet keine Tracking- oder Analyse-Dienste. Für den Spielbetrieb nutzen wir ausschließlich die lokale Speicherung Ihres Browsers (localStorage) — diese Daten bleiben auf Ihrem Gerät und werden nicht übertragen.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">Was lokal gespeichert wird</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-2 border-[var(--line)] text-left">
              <thead>
                <tr className="border-b-2 border-[var(--line)] bg-[var(--surface-soft)]">
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">Eintrag</th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">Zweck</th>
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
            Alle Einträge können Sie jederzeit über die Einstellungen Ihres Browsers löschen („Websitedaten löschen“). Dabei gehen gespeicherte Bestwerte und Fortschritte verloren.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">Zukünftige Werbung</h2>
          <p className="mt-3 text-[var(--muted)]">
            Wenn künftig Werbung (z.&nbsp;B. Google AdSense) eingebunden wird, kommen erstmals Cookies bzw. vergleichbare Technologien von Werbepartnern zum Einsatz. In diesem Fall fragen wir Ihre Einwilligung vorab über eine Consent-Abfrage ab — ohne Einwilligung wird keine personalisierte Werbung geladen.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">Ihre aktuelle Auswahl</h2>
          <p className="mt-3 text-[var(--muted)]">
            Status: <strong className="text-[var(--ink)]">{consent === 'all' ? 'Alles akzeptiert' : consent === 'essential' ? 'Nur notwendige Speicherung' : 'Noch keine Auswahl getroffen'}</strong>
          </p>
          <button onClick={resetChoice} className="retro-btn mt-4 bg-[var(--surface)] px-5 py-2.5 font-display text-[11px] font-bold uppercase">
            Auswahl ändern
          </button>
        </section>
      </div>
    </main>
  )
}
