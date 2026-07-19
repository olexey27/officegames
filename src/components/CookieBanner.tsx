import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export const CONSENT_KEY = 'sg-consent'

export type Consent = 'all' | 'essential' | null

export function readConsent(): Consent {
  if (typeof localStorage === 'undefined') return null
  const stored = localStorage.getItem(CONSENT_KEY)
  return stored === 'all' || stored === 'essential' ? stored : null
}

// Consent banner. Today the site only uses functional localStorage, so this
// is mostly informational — but the stored choice is the gate future ad
// scripts (e.g. AdSense) must check before loading anything.
export default function CookieBanner() {
  const [consent, setConsent] = useState<Consent>(readConsent)

  // The cookies page can reset the choice; re-read when that happens.
  useEffect(() => {
    const onChange = () => setConsent(readConsent())
    window.addEventListener('sg-consent-changed', onChange)
    return () => window.removeEventListener('sg-consent-changed', onChange)
  }, [])

  const choose = (value: Exclude<Consent, null>) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(CONSENT_KEY, value)
    setConsent(value)
  }

  if (consent !== null) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-[var(--ink)] bg-[var(--surface)] shadow-[0_-8px_30px_rgba(0,0,0,.25)]" role="dialog" aria-label="Cookie notice">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p className="max-w-[640px] text-xs leading-5 text-[var(--muted)]">
          <span className="font-display text-[11px] font-bold uppercase text-[var(--ink)]">🍪 No cookies, no tracking.</span>{' '}
          SharksGames only stores game scores and settings locally in your browser. If we ever add ads, we&apos;ll ask you first.{' '}
          <Link to="/cookies" className="font-bold text-[var(--accent)] hover:underline">Details</Link>
        </p>
        <div className="flex shrink-0 gap-2.5">
          <button onClick={() => choose('essential')} className="retro-btn bg-[var(--surface)] px-4 py-2 font-display text-[10px] font-bold uppercase">
            Necessary only
          </button>
          <button onClick={() => choose('all')} className="retro-btn bg-[var(--accent)] px-4 py-2 font-display text-[10px] font-bold uppercase text-white">
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
