/**
 * Test data shared by every test file. Rows here are valid unless a test overrides a value,
 * so each test only spells out the cells it is about.
 */
import { COLUMNS, type Column, type Row } from '../validation/columns'
import { validateRows } from '../validation/rules'
import { markDuplicates } from '../validation/duplicates'
import { store, reset, appendBatch } from '../store/store'
import { resetQuery, buildView } from '../store/query'
import { recount } from '../store/counts'
import { resetHistory } from '../store/changes'

const CLEAN: Record<Column, string> = {
  customer_id: 'C-1', first_name: 'Anna', last_name: 'Müller', email: 'a@b.co',
  signup_date: '2024-01-02', country: 'DE', plan: 'pro', monthly_spend: '10',
}

/** A valid row, with any cells overridden. Every call has customer_id 'C-1' unless overridden. */
export function cleanRow(overrides: Partial<Record<Column, string>> = {}): Row {
  return COLUMNS.map((column) => overrides[column] ?? CLEAN[column])
}

let nextId = 1

/** A valid row with a unique customer ID, for tests where IDs must not collide. */
export function customerRow(email: string, country = 'DE'): Row {
  return cleanRow({ customer_id: `C-${nextId++}`, email, country })
}

/** Load rows into a fresh store exactly as loadFile would: validated, duplicates marked, counted. */
export function seedStore(rows: Row[], { withDuplicateCheck = true } = {}): void {
  reset()
  resetQuery()
  resetHistory()
  appendBatch(rows, validateRows(rows))
  if (withDuplicateCheck) markDuplicates(store.rows, store.rowCount, store.flags)
  recount()
  store.view = buildView()
  store.loading.status = 'done'
}
