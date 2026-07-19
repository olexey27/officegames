import { Link } from 'react-router-dom'
import { ArrowIcon } from '../../components/icons'

export default function Privacy() {
  return (
    <main className="mx-auto min-h-[calc(100vh-68px)] max-w-[820px] px-5 py-10 lg:px-8">
      <Link to="/" className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)] transition hover:text-[var(--accent)]">
        <span className="rotate-180"><ArrowIcon /></span> Back to games
      </Link>
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Privacy</h1>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[.14em] text-[var(--muted)]">Privacy policy · last updated: July 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-7">
        <section>
          <h2 className="font-display text-base font-bold uppercase">1. Controller</h2>
          <p className="mt-3">
            The controller responsible for data processing on this website is:<br />
            Alexej Krasnokutskij, Rua Jose Maria Nicolau 3, 1500-312 Lisboa, Portugal<br />
            Email: <a href="mailto:allxyog@gmail.com" className="font-bold text-[var(--accent)] hover:underline">allxyog@gmail.com</a>
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">2. The short version</h2>
          <p className="mt-3 text-[var(--muted)]">
            SharksGames is a plain games website. There are <strong className="text-[var(--ink)]">no user accounts, no tracking, no analytics tools and no advertising cookies</strong>. All game progress is stored locally in your browser and never leaves your device. Fonts are served from our own server — no connections to Google Fonts or other third-party CDNs are made.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">3. Hosting (Vercel)</h2>
          <p className="mt-3 text-[var(--muted)]">
            This website is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. When you visit the site, Vercel processes technically necessary data (in particular your IP address, date and time of access, requested page, browser type) in automatic server logs. This processing is required to operate and secure the website (Art. 6(1)(f) GDPR — legitimate interest in providing a secure and stable service). A data processing agreement is in place with Vercel; for transfers to the USA, Vercel relies on the EU Standard Contractual Clauses and the EU-US Data Privacy Framework. More information: <span className="break-all">vercel.com/legal/privacy-policy</span>
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">4. Local storage in your browser (localStorage)</h2>
          <p className="mt-3 text-[var(--muted)]">
            To run the games, we store small records in your browser&apos;s localStorage: your color scheme, best scores and game progress (e.g. 2048 high score, Memory levels), a freely chosen player name for the card game Durak, and your choice in the cookie notice. This data is <strong className="text-[var(--ink)]">never transmitted to us or to third parties</strong>, contains no identifiers, and can be deleted at any time via your browser settings. This storage is strictly necessary for the service you explicitly request (Art. 5(3) ePrivacy Directive 2002/58/EC, implemented in Portugal by Lei n.º 41/2004); the legal basis otherwise is Art. 6(1)(f) GDPR.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">5. Advertising (planned)</h2>
          <p className="mt-3 text-[var(--muted)]">
            No advertising is currently served on this website; the visible “ad space” areas are empty placeholders without any data processing. Should we integrate advertising in the future (e.g. Google AdSense), this will only happen after this privacy policy has been updated and — where required — after your explicit consent via a consent prompt (Art. 6(1)(a) GDPR, Art. 5(3) ePrivacy Directive 2002/58/EC).
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">6. Contact by email</h2>
          <p className="mt-3 text-[var(--muted)]">
            If you contact us by email, we process the data you provide (email address, message content) to handle your request (Art. 6(1)(f) GDPR). The data is deleted once it is no longer needed to process the request.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">7. Your rights</h2>
          <p className="mt-3 text-[var(--muted)]">
            You have the right to access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and to object to processing based on legitimate interests (Art. 21 GDPR). You also have the right to lodge a complaint with a data protection supervisory authority (Art. 77 GDPR) — in particular the Portuguese authority CNPD (Comissão Nacional de Proteção de Dados, cnpd.pt) or the authority of your habitual residence.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold uppercase">8. No automated decision-making</h2>
          <p className="mt-3 text-[var(--muted)]">
            No automated decision-making, including profiling, takes place. You are neither legally nor contractually required to provide personal data — the website can be used without providing any.
          </p>
        </section>
      </div>
    </main>
  )
}
