import { COLUMNS } from '../validation/columns'
import { issueFor, suggestionFor } from '../validation/catalog'
import { store } from '../store/store'
import { originalValue } from '../store/changes'
import { session } from './session'
import { CellEditor } from './CellEditor'

interface Props {
  row: number // position in store.rows
  col: number // index into COLUMNS
}

/**
 * One cell. Reads its value, issue code and changed mark straight from the store.
 * With an issue: red, issue title on hover. With an issue the tool has a suggestion for: amber,
 * the suggestion shown inline. Changed by the user: green tint, original on hover.
 * While being edited: the inline editor instead of the value.
 */
export function Cell({ row, col }: Props) {
  const isEditing = session.editing?.row === row && session.editing.col === col
  if (isEditing) {
    return (
      <div className="cell editing">
        <CellEditor row={row} col={col} />
      </div>
    )
  }

  const value = store.rows[row][col]
  const code = store.flags[col][row]
  const issue = issueFor(COLUMNS[col], code)
  const suggestion = issue ? suggestionFor(COLUMNS[col], code, value) : undefined
  const wasChanged = store.changed[col][row] === 1

  const classes = ['cell']
  if (issue) classes.push(suggestion !== undefined ? 'suggestion' : 'issue')
  if (wasChanged) classes.push('changed')
  if (value === '') classes.push('empty')

  return (
    <div className={classes.join(' ')} title={hoverText(value, issue?.title, wasChanged ? originalValue(row, col) : undefined)}>
      {value === '' ? 'empty' : value}
      {suggestion !== undefined && <span className="hint-arrow">→ {suggestion}</span>}
    </div>
  )
}

function hoverText(value: string, issueTitle?: string, original?: string): string {
  const parts: string[] = []
  if (issueTitle) parts.push(issueTitle)
  if (original !== undefined) parts.push(`was: ${original === '' ? '(empty)' : original}`)
  return parts.length ? parts.join(' · ') : value
}
