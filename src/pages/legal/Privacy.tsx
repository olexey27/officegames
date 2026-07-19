import { Link } from 'react-router-dom'
import { ArrowIcon } from '../../components/icons'

export default function Privacy() {
  return (
    <main className="mx-auto min-h-[calc(100vh-68px)] max-w-[820px] px-5 py-10 lg:px-8">
      <Link to="/" className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)] transition hover:text-[var(--accent)]">
        <span className="rotate-180"><ArrowIcon /></span> Back to games
      </Link>
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Datenschutz</h1>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)]">Datenschutzerklärung · Stand: Juli 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-7">
        <section>
          <h2 className="font-display text-base font-bold uppercase">1. Verantwortlicher</h2>
          <p className="mt-3">
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br />
            Alexej Krasnokutskij, Rua Jose Maria Nicolau 3, 1500-312 Lisboa, Portugal<br />
            E-Mail: <a href="mailto:allxyog@gmail.com" className="font-bold text-[var(--accent)] hover:underline">allxyog@gmail.com</a>
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">2. Das Wichtigste in Kürze</h2>
          <p className="mt-3 text-[var(--muted)]">
            SharksGames ist eine reine Spiele-Website. Es gibt <strong className="text-[var(--ink)]">kein Benutzerkonto, kein Tracking, keine Analyse-Tools und keine Werbe-Cookies</strong>. Alle Spielstände werden ausschließlich lokal in Ihrem Browser gespeichert und verlassen Ihr Gerät nicht. Schriftarten werden von unserem eigenen Server geladen — es werden keine Verbindungen zu Google Fonts oder anderen Drittanbieter-CDNs aufgebaut.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">3. Hosting (Vercel)</h2>
          <p className="mt-3 text-[var(--muted)]">
            Diese Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA gehostet. Beim Aufruf der Website verarbeitet Vercel technisch notwendige Daten (insbesondere IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite, Browser-Typ) in automatischen Server-Logs. Diese Verarbeitung ist für den Betrieb und die Sicherheit der Website erforderlich (Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse an einer sicheren und stabilen Bereitstellung). Mit Vercel besteht ein Auftragsverarbeitungsvertrag; für Übermittlungen in die USA stützt sich Vercel auf die EU-Standardvertragsklauseln sowie das EU-US Data Privacy Framework. Weitere Informationen: <span className="break-all">vercel.com/legal/privacy-policy</span>
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">4. Lokale Speicherung im Browser (localStorage)</h2>
          <p className="mt-3 text-[var(--muted)]">
            Für den Spielbetrieb speichern wir kleine Datensätze im localStorage Ihres Browsers: das gewählte Farbschema, Bestwerte und Spielfortschritte (z.&nbsp;B. 2048-Highscore, Memory-Level), einen frei wählbaren Spielernamen für das Kartenspiel Durak sowie Ihre Auswahl im Cookie-Hinweis. Diese Daten werden <strong className="text-[var(--ink)]">nicht an uns oder Dritte übertragen</strong>, enthalten keine Identifikatoren und können jederzeit über die Browsereinstellungen gelöscht werden. Diese Speicherung ist für den ausdrücklich gewünschten Dienst unbedingt erforderlich (Art. 5 Abs. 3 ePrivacy-Richtlinie 2002/58/EG, in Portugal umgesetzt durch Lei n.º 41/2004); Rechtsgrundlage im Übrigen ist Art. 6 Abs. 1 lit. f DSGVO.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">5. Werbung (geplant)</h2>
          <p className="mt-3 text-[var(--muted)]">
            Derzeit wird auf dieser Website <strong className="text-[var(--ink)]">keine Werbung</strong> ausgespielt; die sichtbaren „Ad space“-Flächen sind leere Platzhalter ohne Datenverarbeitung. Sollten wir künftig Werbung (z.&nbsp;B. Google AdSense) einbinden, geschieht dies erst nach einer Aktualisierung dieser Datenschutzerklärung und — soweit erforderlich — nach Ihrer ausdrücklichen Einwilligung über eine Consent-Abfrage (Art. 6 Abs. 1 lit. a DSGVO, Art. 5 Abs. 3 ePrivacy-Richtlinie 2002/58/EG).
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">6. Kontakt per E-Mail</h2>
          <p className="mt-3 text-[var(--muted)]">
            Wenn Sie uns per E-Mail kontaktieren, verarbeiten wir die übermittelten Daten (E-Mail-Adresse, Inhalt) zur Bearbeitung Ihrer Anfrage (Art. 6 Abs. 1 lit. f DSGVO). Die Daten werden gelöscht, sobald sie für die Bearbeitung nicht mehr erforderlich sind.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">7. Ihre Rechte</h2>
          <p className="mt-3 text-[var(--muted)]">
            Sie haben gegenüber dem Verantwortlichen das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO). Außerdem besteht ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO) — zuständig ist insbesondere die portugiesische Aufsichtsbehörde CNPD (Comissão Nacional de Proteção de Dados, cnpd.pt) oder die Behörde Ihres gewöhnlichen Aufenthaltsorts.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">8. Keine automatisierte Entscheidungsfindung</h2>
          <p className="mt-3 text-[var(--muted)]">
            Eine automatisierte Entscheidungsfindung einschließlich Profiling findet nicht statt. Die Bereitstellung personenbezogener Daten ist weder gesetzlich noch vertraglich vorgeschrieben — die Website ist ohne Angabe von Daten nutzbar.
          </p>
        </section>
      </div>
    </main>
  )
}
