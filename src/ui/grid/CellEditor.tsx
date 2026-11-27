import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { COLUMNS } from '../../validation/columns'
import { issueFor } from '../../validation/catalog'
import { validateCell } from '../../validation/rules'
import { store } from '../../store/store'
import { stopEditing } from '../session'
import { saveCell } from '../actions'

interface Props {
  row: number
  col: number
}

/**
 * In-place editor for one cell. Shows what the rules think of the value as the user types,
 * before anything is saved. Enter saves (through the change engine), Escape cancels,
 * leaving the field saves if the value changed.
 */
export function CellEditor({ row, col }: Props) {
  const column = COLUMNS[col]
  const [value, setValue] = useState(store.rows[row][col])
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    input.current?.focus()
    input.current?.select()
  }, [])

  const issue = issueFor(column, validateCell(column, value))

  const save = () => {
    saveCell(row, col, value)
    stopEditing()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') save()
    else if (e.key === 'Escape') stopEditing()
    e.stopPropagation()
  }

  return (
    <div className="editor">
      <input
        ref={input}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={save}
        aria-label={`Edit ${column}`}
      />
      <div className={`feedback ${issue ? 'bad' : 'ok'}`} data-testid="feedback">
        {issue ? issue.title : 'Looks good. Press Enter to save.'}
      </div>
    </div>
  )
}
