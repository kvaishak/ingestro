import { COLUMNS, type Row } from '../validation/columns'
import { validateCell } from '../validation/rules'
import { markDuplicates } from '../validation/duplicates'
import { store, reset, appendBatch } from './store'
import { resetQuery, buildView } from './query'
import { recount } from './counts'
import { resetHistory } from './changes'

let nextId = 1

/** A row with sensible defaults and a unique customer id, for tests. */
export function r(email: string, country = 'DE', plan = 'pro'): Row {
  return [`C-${nextId++}`, 'Anna', 'Müller', email, '2024-01-02', country, plan, '1']
}

/** Load rows into a fresh store exactly as loadFile would: validated, duplicates marked, counted. */
export function seed(rows: Row[], { withDuplicateCheck = true } = {}): void {
  reset()
  resetQuery()
  resetHistory()
  const flags = COLUMNS.map((column, c) => Uint8Array.from(rows.map((row) => validateCell(column, row[c]))))
  appendBatch(rows, flags)
  if (withDuplicateCheck) markDuplicates(store.rows, store.rowCount, store.flags, null)
  recount()
  store.view = buildView()
  store.loading.status = 'done'
}
