import { store } from '../store/store'

interface Props {
  row: number // position in store.rows
  col: number // index into COLUMNS
}

/** One cell: single line, ellipsis when too long, full value on hover. Styling by issue arrives in Stage 2. */
export function Cell({ row, col }: Props) {
  const value = store.rows[row][col]
  return (
    <div className="cell" title={value}>
      {value}
    </div>
  )
}
