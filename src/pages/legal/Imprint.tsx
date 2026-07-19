import { Link } from 'react-router-dom'
import { ArrowIcon } from '../../components/icons'

export default function Imprint() {
  return (
    <main className="mx-auto min-h-[calc(100vh-68px)] max-w-[820px] px-5 py-10 lg:px-8">
      <Link to="/" className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)] transition hover:text-[var(--accent)]">
        <span className="rotate-180"><ArrowIcon /></span> Back to games
      </Link>
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Imprint</h1>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)]">Legal notice · provider identification</p>

      <div className="mt-8 space-y-8 text-sm leading-7">
        <section>
          <h2 className="font-display text-base font-bold uppercase">Service provider (Art. 5 E-Commerce Directive 2000/31/EC)</h2>
          <p className="mt-3">
            Alexej Krasnokutskij<br />
            Rua Jose Maria Nicolau 3<br />
            1500-312 Lisboa<br />
            Portugal
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">Contact</h2>
          <p className="mt-3">
            Email: <a href="mailto:allxyog@gmail.com" className="font-bold text-[var(--accent)] hover:underline">allxyog@gmail.com</a>
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">Responsible for content</h2>
          <p className="mt-3">
            Alexej Krasnokutskij, address as above.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">Liability for links</h2>
          <p className="mt-3 text-[var(--muted)]">
            This website currently contains no links to external third-party websites. Should external links be added in the future, the respective provider is always responsible for the content of linked pages; no legal violations were identifiable at the time of linking.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">Copyright</h2>
          <p className="mt-3 text-[var(--muted)]">
            The content and works created by the site operator on this website are subject to copyright. Reproduction, editing and distribution beyond the limits of copyright law require the operator&apos;s consent.
          </p>
        </section>
      </div>
    </main>
  )
}
