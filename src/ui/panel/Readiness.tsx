import { store } from '../../store/store'
import { formatCount } from '../../format'

/** How close the file is to importable: rows with no problem at all, over all rows. */
export function Readiness() {
  const total = store.rowCount
  const ready = total - store.problemRows
  const pct = total ? Math.round((ready / total) * 100) : 0
  return (
    <div className="readiness" data-testid="readiness">
      <h2>Import readiness</h2>
      <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <i style={{ width: `${pct}%` }} />
      </div>
      <span className="hint">{formatCount(ready)} of {formatCount(total)} rows ready · {pct}%</span>
    </div>
  )
}
