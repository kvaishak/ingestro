import { useState } from 'react'
import { COLUMNS, COLUMN_LABEL } from '../validation/columns'
import { CATALOG, issueByKey, type IssueDef } from '../validation/catalog'
import { store } from '../store/store'
import { query, setQuery } from '../store/query'
import { splitBySuggestion } from '../store/suggestions'
import { planBulk } from '../store/bulk'
import { session, setPanelMode } from './session'
import { applyBulkPlan, undoLastChange } from './actions'
import { ConfirmDialog } from './ConfirmDialog'

const fmt = (n: number) => n.toLocaleString('en-US')
const MAX_SPELLINGS_SHOWN = 6

/**
 * Left-hand panel. Import readiness on top, then one of:
 *  - the list of problem types with counts (nothing selected)
 *  - a problem's detail: explanation, and for problems with suggestions, what we found and the bulk button
 *  - the bulk preview (grid stays visible behind; amber cells are the ones that will change)
 *  - the result of a bulk apply: what changed, undo, what is left
 */
export function IssuePanel() {
  if (store.loading.status !== 'done') return <aside className="panel" />
  const selected = query.issueKey ? issueByKey(query.issueKey) : null
  return (
    <aside className="panel">
      <Readiness />
      {!selected && <IssueList />}
      {selected && session.panelMode === 'detail' && <IssueDetail issue={selected} />}
      {selected && session.panelMode === 'preview' && <BulkPreview issue={selected} />}
      {selected && session.panelMode === 'applied' && <BulkApplied issue={selected} />}
    </aside>
  )
}

function selectIssue(key: string | null) {
  setPanelMode('detail')
  setQuery({ issueKey: key })
}

/** How close the file is to importable: rows with no problem at all, over all rows. */
function Readiness() {
  const total = store.rowCount
  const ready = total - store.problemRows
  const pct = total ? Math.round((ready / total) * 100) : 0
  return (
    <div className="readiness" data-testid="readiness">
      <h2>Import readiness</h2>
      <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <i style={{ width: `${pct}%` }} />
      </div>
      <span className="hint">{fmt(ready)} of {fmt(total)} rows ready · {pct}%</span>
    </div>
  )
}

function IssueList() {
  const columnsWithProblems = COLUMNS.filter((column) => issuesIn(column).length > 0)
  return (
    <>
      <h2>Problems found</h2>
      <p className="muted">
        {fmt(store.problemCells)} values in {fmt(store.problemRows)} rows. Click one to see those rows.
      </p>
      {columnsWithProblems.map((column) => (
        <section key={column}>
          <h3>{COLUMN_LABEL[column]}</h3>
          {issuesIn(column).map((issue) => (
            <button key={issue.key} className="issue-row" onClick={() => selectIssue(issue.key)}>
              <span>{issue.title}</span>
              <span className="count">{fmt(store.counts.get(issue.key) ?? 0)}</span>
            </button>
          ))}
        </section>
      ))}
    </>
  )
}

function IssueDetail({ issue }: { issue: IssueDef }) {
  const count = store.counts.get(issue.key) ?? 0
  return (
    <div className="detail">
      <div>
        <button className="btn ghost" onClick={() => selectIssue(null)}>← All problems</button>
        <h2>{issue.title}</h2>
        <p className="muted">{fmt(count)} values · showing only those rows</p>
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
  const split = splitBySuggestion(issue.key)
  const example = split.recognised[0]
  return (
    <div data-testid="what-we-found">
      <h3>What we found</h3>
      <div className="found recognised">
        <b>{fmt(split.recognised.length)}</b> are names or spellings we recognise
        {example && <span className="hint">, e.g. {example.value} → {example.suggestion}</span>}
        {split.recognised.length > 0 && (
          <div className="row">
            <button className="btn primary" onClick={() => setPanelMode('preview')} data-testid="bulk-open">
              Review the {fmt(split.recognised.length)} suggested changes
            </button>
          </div>
        )}
      </div>
      <div className="found unrecognised">
        <b>{fmt(split.unrecognisedTotal)}</b> we don't recognise
        <UnknownSpellings spellings={split.unrecognised} />
        {split.unrecognisedTotal > 0 && <div className="hint">You'll need to type the code yourself.</div>}
      </div>
    </div>
  )
}

function UnknownSpellings({ spellings }: { spellings: { value: string; count: number }[] }) {
  if (spellings.length === 0) return null
  const shown = spellings.slice(0, MAX_SPELLINGS_SHOWN)
  const more = spellings.length - shown.length
  return (
    <div className="spellings">
      {shown.map((s) => `${s.value || '(empty)'} (${fmt(s.count)})`).join(' · ')}
      {more > 0 && ` · and ${fmt(more)} more`}
    </div>
  )
}

function BulkPreview({ issue }: { issue: IssueDef }) {
  const plan = planBulk(issue.key)
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="preview" data-testid="bulk-preview">
      <button className="btn ghost" onClick={() => setPanelMode('detail')}>← Back</button>
      <h2>Change country names to codes</h2>
      <p className="muted">Nothing changes until you press Apply. You can undo afterwards.</p>

      <table className="plan">
        <thead>
          <tr><th>Currently</th><th>Will become</th><th className="num">Rows</th></tr>
        </thead>
        <tbody>
          {plan.groups.map((g) => (
            <tr key={`${g.from}→${g.to}`}>
              <td title={g.from}>{g.from}</td>
              <td><b>{g.to}</b></td>
              <td className="num">{fmt(g.rows.length)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={2}>Total</td><td className="num">{fmt(plan.total)}</td></tr>
        </tfoot>
      </table>

      <p className="hint">Amber cells in the grid are the ones that will change.</p>

      <div className="actions">
        <button className="btn" onClick={() => setPanelMode('detail')}>Cancel</button>
        <button className="btn primary" onClick={() => setConfirming(true)} data-testid="bulk-apply">
          Apply to {fmt(plan.total)} rows
        </button>
      </div>

      {confirming && (
        <ConfirmDialog
          testId="confirm-apply"
          title={`Apply ${fmt(plan.total)} changes?`}
          body={`Country names will be replaced by their two-letter codes in ${fmt(plan.total)} rows. You can undo this afterwards.`}
          confirmLabel="Yes, apply"
          onCancel={() => setConfirming(false)}
          onConfirm={() => { setConfirming(false); applyBulkPlan(plan) }}
        />
      )}
    </div>
  )
}

function BulkApplied({ issue }: { issue: IssueDef }) {
  const changed = session.lastBulk?.changed ?? 0
  const split = splitBySuggestion(issue.key)
  const left = store.counts.get(issue.key) ?? 0
  return (
    <div className="detail" data-testid="bulk-applied">
      <div>
        <button className="btn ghost" onClick={() => selectIssue(null)}>← All problems</button>
        <h2>{issue.title}</h2>
        <div className="success">
          ✓ Changed {fmt(changed)} country values to codes.
          <button className="btn" onClick={undoLastChange} data-testid="bulk-undo">Undo</button>
        </div>
        {left > 0 ? (
          <>
            <h3>{fmt(left)} left</h3>
            <p>These are spellings we don't recognise:</p>
            <UnknownSpellings spellings={split.unrecognised} />
            <p className="hint">Type the correct code into each cell.</p>
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
  const next = CATALOG.find((issue) => issue.key !== except && (store.counts.get(issue.key) ?? 0) > 0)
  if (!next) return <p>Every problem is resolved. The file is ready to import.</p>
  const count = store.counts.get(next.key) ?? 0
  return (
    <div>
      <h3>Up next</h3>
      <button className="btn primary wide" onClick={() => selectIssue(next.key)} data-testid="next-problem">
        <span>{next.title}</span>
        <span className="hint-light">{fmt(count)} values →</span>
      </button>
    </div>
  )
}

/** Problem types for one column that occur at least once, in catalog order. */
function issuesIn(column: (typeof COLUMNS)[number]): IssueDef[] {
  return CATALOG.filter((issue) => issue.column === column && (store.counts.get(issue.key) ?? 0) > 0)
}
