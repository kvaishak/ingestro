import { session, hideToast } from '../session'
import { undoLastChange } from '../actions'

/** Bottom-centre confirmation of the last change, with Undo while that is still possible. */
export function Toast() {
  const toast = session.toast
  if (!toast) return null
  return (
    <div className="toast" role="status" data-testid="toast">
      <span>{toast.text}</span>
      {toast.canUndo && (
        <button onClick={undoLastChange} data-testid="toast-undo">
          Undo
        </button>
      )}
      <button className="close" onClick={hideToast} aria-label="Dismiss">✕</button>
    </div>
  )
}
