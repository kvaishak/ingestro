interface Props {
  title: string
  body: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
  testId?: string
}

/** Last stop before a large change: say exactly what is about to happen. Cancel is the default. */
export function ConfirmDialog({ title, body, confirmLabel, onCancel, onConfirm, testId = 'confirm' }: Props) {
  return (
    <div className="overlay" role="presentation" onClick={onCancel}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${testId}-title`}
        onClick={(e) => e.stopPropagation()}
        data-testid={testId}
      >
        <h2 id={`${testId}-title`}>{title}</h2>
        <p>{body}</p>
        <div className="dialog-actions">
          <button className="btn" onClick={onCancel} autoFocus>Cancel</button>
          <button className="btn primary" onClick={onConfirm} data-testid={`${testId}-yes`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
