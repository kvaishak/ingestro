import { COLUMNS, COLUMN_LABEL } from '../validation/columns'
import { CATALOG, issueByKey, type IssueDef } from '../validation/catalog'
import { store } from '../store/store'
import { query, setQuery } from '../store/query'

const fmt = (n: number) => n.toLocaleString('en-US')

/**
 * Right-hand panel. Two states:
 *  - nothing selected: every problem type that occurs, grouped by column, with counts
 *  - a type selected: what is wrong, what a good value looks like, and a way back
 * Clicking a type filters the grid to the rows that have it.
 */
export function IssuePanel() {
  if (store.loading.status !== 'done') return <aside className="panel" />
  const selected = query.issueKey ? issueByKey(query.issueKey) : null
  return (
    <aside className="panel">
      <Readiness />
      {selected ? <IssueDetail issue={selected} /> : <IssueList />}
    </aside>
  )
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
            <button key={issue.key} className="issue-row" onClick={() => setQuery({ issueKey: issue.key })}>
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
    <>
      <button className="btn ghost" onClick={() => setQuery({ issueKey: null })}>← All problems</button>
      <h2>{issue.title}</h2>
      <p className="muted">{fmt(count)} values · showing only those rows</p>
      <h3>What's wrong</h3>
      <p>{issue.what}</p>
      <h3>A good value looks like</h3>
      <p className="example">{issue.good}</p>
    </>
  )
}

/** Problem types for one column that occur at least once, in catalog order. */
function issuesIn(column: (typeof COLUMNS)[number]): IssueDef[] {
  return CATALOG.filter((issue) => issue.column === column && (store.counts.get(issue.key) ?? 0) > 0)
}
