// Helpers for showing where a plan's data came from and how fresh it is.

// "2026-08-06T14:33:19Z" -> "3 days ago" / "just now". Returns null if absent.
export function timeAgo(iso) {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  const secs = Math.max(0, (Date.now() - then) / 1000)
  const units = [
    ['year', 31536000], ['month', 2592000], ['week', 604800],
    ['day', 86400], ['hour', 3600], ['minute', 60],
  ]
  for (const [name, s] of units) {
    const v = Math.floor(secs / s)
    if (v >= 1) return `${v} ${name}${v > 1 ? 's' : ''} ago`
  }
  return 'just now'
}

// A curated ("manual …") source vs an automatically-fetched one.
export function sourceKind(source) {
  if (!source) return null
  return /^manual/i.test(source) ? 'Curated' : 'Live'
}

// Short host label for a source URL, e.g. "https://www.eir.ie/…" -> "eir.ie".
export function sourceHost(url) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// One-line provenance label for a plan card, e.g. "Live · eir.ie · updated 3 days ago".
export function provenanceLabel(plan) {
  if (!plan) return null
  const kind = sourceKind(plan.source)
  const host = sourceHost(plan.source_url)
  const when = timeAgo(plan.fetched_at)
  const parts = [kind, host, when && `updated ${when}`].filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}
