import { COLUMN_COUNT, type Row } from '../validation/columns'

/**
 * Turns raw parsed CSV lines into data rows.
 * - drops the header line when this is the first chunk
 * - drops lines that are a single empty cell (blank lines)
 * - pads or truncates every row to exactly COLUMN_COUNT cells so a malformed
 *   line can never shift columns; validation later flags what is missing
 */
export function rowsFromChunk(data: string[][], isFirstChunk: boolean): Row[] {
  const out: Row[] = []
  for (let i = isFirstChunk ? 1 : 0; i < data.length; i++) {
    const line = data[i]
    if (line.length === 1 && line[0] === '') continue
    if (line.length === COLUMN_COUNT) {
      out.push(line)
      continue
    }
    const row: Row = new Array(COLUMN_COUNT)
    for (let c = 0; c < COLUMN_COUNT; c++) row[c] = c < line.length ? line[c] : ''
    out.push(row)
  }
  return out
}
