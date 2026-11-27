import { bulkWordingOf, type IssueDef } from '../../validation/catalog'
import { countOf } from '../../store/counts'
import { splitBySuggestion } from '../../store/suggestions'
import { formatCount } from '../../format'
import { clearIssueFilter, openBulkPreview } from '../actions'
import { UnknownSpellings } from './UnknownSpellings'

/** One problem explained: what is wrong, what a good value looks like, and (if the tool can help) what it found. */
export function IssueDetail({ issue }: { issue: IssueDef }) {
  return (
    <div className="detail">
      <div>
        <button className="btn ghost" onClick={clearIssueFilter}>← All problems</button>
        <h2>{issue.title}</h2>
        <p className="muted">{formatCount(countOf(issue.key))} values · showing only those rows</p>
        <h3>What's wrong</h3>
        <p>{issue.what}</p>
        <h3>A good value looks like</h3>
        <p className="example">{issue.good}</p>
      </div>
      {issue.suggest && <WhatWeFound issue={issue} />}
    </div>
  )
}

/** For problems with suggestions: how many we can change for the user, how many we cannot, and the bulk button. */
function WhatWeFound({ issue }: { issue: IssueDef }) {
  const wording = bulkWordingOf(issue)
  const split = splitBySuggestion(issue.key)
  const example = split.recognised[0]
  return (
    <div data-testid="what-we-found">
      <h3>What we found</h3>
      <div className="found recognised">
        <b>{formatCount(split.recognised.length)}</b> are names or spellings we recognise
        {example && <span className="hint">, e.g. {example.value} → {example.suggestion}</span>}
        {split.recognised.length > 0 && (
          <div className="row">
            <button className="btn primary" onClick={openBulkPreview} data-testid="bulk-open">
              Review the {formatCount(split.recognised.length)} suggested changes
            </button>
          </div>
        )}
      </div>
      <div className="found unrecognised">
        <b>{formatCount(split.unrecognisedTotal)}</b> we don't recognise
        <UnknownSpellings spellings={split.unrecognised} />
        {split.unrecognisedTotal > 0 && <div className="hint">{wording.manualFixHint}</div>}
      </div>
    </div>
  )
}
