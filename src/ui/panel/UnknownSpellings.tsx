import type { UnrecognisedSpelling } from '../../store/suggestions'
import { formatCount } from '../../format'

const MAX_SPELLINGS_SHOWN = 6

/** "Narnia (3) · Atlantis (2) · and 4 more": the values the tool has no suggestion for. */
export function UnknownSpellings({ spellings }: { spellings: UnrecognisedSpelling[] }) {
  if (spellings.length === 0) return null
  const shown = spellings.slice(0, MAX_SPELLINGS_SHOWN)
  const more = spellings.length - shown.length
  return (
    <div className="spellings">
      {shown.map((s) => `${s.value || '(empty)'} (${formatCount(s.count)})`).join(' · ')}
      {more > 0 && ` · and ${formatCount(more)} more`}
    </div>
  )
}
