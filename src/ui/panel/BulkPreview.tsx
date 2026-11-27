import { useState } from 'react'
import { bulkWordingOf, type IssueDef } from '../../validation/catalog'
import { planBulk } from '../../store/bulk'
import { formatCount } from '../../format'
import { applyBulkPlan, closeBulkPreview } from '../actions'
import { ConfirmDialog } from '../common/ConfirmDialog'

/** Every suggested change, grouped "from -> to" with a row count. Nothing changes until Apply and the confirm. */
export function BulkPreview({ issue }: { issue: IssueDef }) {
  const wording = bulkWordingOf(issue)
  const plan = planBulk(issue.key)
  const [confirming, setConfirming] = useState(false)
  const total = formatCount(plan.total)
  return (
    <div className="preview" data-testid="bulk-preview">
      <button className="btn ghost" onClick={closeBulkPreview}>← Back</button>
      <h2>{wording.previewTitle}</h2>
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
              <td className="num">{formatCount(g.rows.length)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={2}>Total</td><td className="num">{total}</td></tr>
        </tfoot>
      </table>

      <p className="hint">Amber cells in the grid are the ones that will change.</p>

      <div className="actions">
        <button className="btn" onClick={closeBulkPreview}>Cancel</button>
        <button className="btn primary" onClick={() => setConfirming(true)} data-testid="bulk-apply">
          Apply to {total} rows
        </button>
      </div>

      {confirming && (
        <ConfirmDialog
          testId="confirm-apply"
          title={`Apply ${total} changes?`}
          body={wording.confirmBody(total)}
          confirmLabel="Yes, apply"
          onCancel={() => setConfirming(false)}
          onConfirm={() => { setConfirming(false); applyBulkPlan(plan) }}
        />
      )}
    </div>
  )
}
