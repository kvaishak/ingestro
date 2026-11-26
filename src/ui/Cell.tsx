import { COLUMNS } from '../validation/columns'
import { issueFor } from '../validation/catalog'
import { store } from '../store/store'

interface Props {
  row: number // position in store.rows
  col: number // index into COLUMNS
}

/**
 * One cell. Reads its value and its issue code straight from the store.
 * With an issue: coloured, and the issue title on hover. Empty values show a muted placeholder.
 */
export function Cell({ row, col }: Props) {
  const value = store.rows[row][col]
  const issue = issueFor(COLUMNS[col], store.flags[col][row])

  const classes = ['cell']
  if (issue) classes.push('issue')
  if (value === '') classes.push('empty')

  return (
    <div className={classes.join(' ')} title={issue ? issue.title : value}>
      {value === '' ? 'empty' : value}
    </div>
  )
}
