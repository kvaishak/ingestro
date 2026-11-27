import { useState } from 'react'
import { hasChanges } from '../../store/changes'
import { revertEverything } from '../actions'
import { ConfirmDialog } from '../common/ConfirmDialog'

/** Shown once anything differs from the file. Asks before putting every value back. */
export function RevertAllButton() {
  const [confirming, setConfirming] = useState(false)
  const canRevert = hasChanges()

  return (
    <>
      {canRevert && (
        <button className="btn" onClick={() => setConfirming(true)} data-testid="revert-all">
          Revert all changes
        </button>
      )}
      {confirming && (
        <ConfirmDialog
          testId="confirm-revert"
          title="Revert all changes?"
          body="Every value you changed goes back to what was in the file. You can undo this afterwards."
          confirmLabel="Yes, revert everything"
          onCancel={() => setConfirming(false)}
          onConfirm={() => { setConfirming(false); revertEverything() }}
        />
      )}
    </>
  )
}
