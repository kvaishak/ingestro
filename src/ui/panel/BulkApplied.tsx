import { CATALOG, bulkWordingOf, type IssueDef } from '../../validation/catalog'
import { countOf } from '../../store/counts'
import { splitBySuggestion } from '../../store/suggestions'
import { formatCount } from '../../format'
import { session } from '../session'
import { selectIssue, clearIssueFilter, undoLastChange } from '../actions'
import { UnknownSpellings } from './UnknownSpellings'

/** After a bulk fix: what changed (with undo), what is left, and the next problem once this one is clear. */
export function BulkApplied({ issue }: { issue: IssueDef }) {
  const wording = bulkWordingOf(issue)
  const changed = session.lastBulk?.changed ?? 0
  const split = splitBySuggestion(issue.key)
  const left = countOf(issue.key)
  return (
    <div className="detail" data-testid="bulk-applied">
      <div>
        <button className="btn ghost" onClick={clearIssueFilter}>← All problems</button>
        <h2>{issue.title}</h2>
        <div className="success">
          ✓ {wording.appliedText(formatCount(changed))}
          <button className="btn" onClick={undoLastChange} data-testid="bulk-undo">Undo</button>
        </div>
        {left > 0 ? (
          <>
            <h3>{formatCount(left)} left</h3>
            <p>These are spellings we don't recognise:</p>
            <UnknownSpellings spellings={split.unrecognised} />
            <p className="hint">{wording.manualFixInstruction}</p>
          </>
        ) : (
          <p className="muted">Nothing left for this problem.</p>
        )}
      </div>
      {left === 0 && <NextProblem except={issue.key} />}
    </div>
  )
}

/** Pinned to the bottom of the panel once a problem is cleared: the next problem that still has values. */
function NextProblem({ except }: { except: string }) {
  const next = CATALOG.find((issue) => issue.key !== except && countOf(issue.key) > 0)
  if (!next) return <p>Every problem is resolved. The file is ready to import.</p>
  return (
    <div>
      <h3>Up next</h3>
      <button className="btn primary wide" onClick={() => selectIssue(next.key)} data-testid="next-problem">
        <span>{next.title}</span>
        <span className="hint-light">{formatCount(countOf(next.key))} values →</span>
      </button>
    </div>
  )
}
