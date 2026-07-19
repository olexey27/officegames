import { Link } from 'react-router-dom'
import { ArrowIcon } from '../../components/icons'

export default function Imprint() {
  return (
    <main className="mx-auto min-h-[calc(100vh-68px)] max-w-[820px] px-5 py-10 lg:px-8">
      <Link to="/" className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)] transition hover:text-[var(--accent)]">
        <span className="rotate-180"><ArrowIcon /></span> Back to games
      </Link>
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Impressum</h1>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)]">Anbieterkennzeichnung · Legal notice</p>

      <div className="mt-8 space-y-8 text-sm leading-7">
        <section>
          <h2 className="font-display text-base font-bold uppercase">Diensteanbieter gemäß Art. 5 E-Commerce-Richtlinie 2000/31/EG</h2>
          <p className="mt-3">
            Alexej Krasnokutskij<br />
            Rua Jose Maria Nicolau 3<br />
            1500-312 Lisboa<br />
            Portugal
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">Kontakt</h2>
          <p className="mt-3">
            E-Mail: <a href="mailto:allxyog@gmail.com" className="font-bold text-[var(--accent)] hover:underline">allxyog@gmail.com</a>
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">Verantwortlich für den Inhalt</h2>
          <p className="mt-3">
            Alexej Krasnokutskij, Anschrift wie oben.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">Haftung für Links</h2>
          <p className="mt-3 text-[var(--muted)]">
            Diese Website enthält derzeit keine Links zu externen Websites Dritter. Sollten künftig externe Links aufgenommen werden, gilt: Für die Inhalte verlinkter Seiten ist stets der jeweilige Anbieter verantwortlich; zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">Urheberrecht</h2>
          <p className="mt-3 text-[var(--muted)]">
            Die durch den Seitenbetreiber erstellten Inhalte und Werke auf dieser Website unterliegen dem Urheberrecht. Vervielfältigung, Bearbeitung und Verbreitung außerhalb der Grenzen des Urheberrechts bedürfen der Zustimmung des Betreibers.
          </p>
        </section>
      </div>
    </main>
  )
}
