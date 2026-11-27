import { COLUMNS, COLUMN_LABEL, type Column } from '../../validation/columns'
import { CATALOG, type IssueDef } from '../../validation/catalog'
import { store } from '../../store/store'
import { countOf } from '../../store/counts'
import { formatCount } from '../../format'
import { selectIssue } from '../actions'

/** Every problem type that occurs, grouped under its column, with a count. Click one to filter the grid. */
export function IssueList() {
  const columnsWithProblems = COLUMNS.filter((column) => issuesIn(column).length > 0)
  return (
    <>
      <h2>Problems found</h2>
      <p className="muted">
        {formatCount(store.problemCells)} values in {formatCount(store.problemRows)} rows. Click one to see those rows.
      </p>
      {columnsWithProblems.map((column) => (
        <section key={column}>
          <h3>{COLUMN_LABEL[column]}</h3>
          {issuesIn(column).map((issue) => (
            <button key={issue.key} className="issue-row" onClick={() => selectIssue(issue.key)}>
              <span>{issue.title}</span>
              <span className="count">{formatCount(countOf(issue.key))}</span>
            </button>
          ))}
        </section>
      ))}
    </>
  )
}

/** Problem types for one column that occur at least once, in catalog order. */
function issuesIn(column: Column): IssueDef[] {
  return CATALOG.filter((issue) => issue.column === column && countOf(issue.key) > 0)
}
