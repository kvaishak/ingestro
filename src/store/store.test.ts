import { test, expect, beforeEach } from 'vitest'
import { store, reset, appendBatch, bump, subscribe } from './store'

const row = (id: string) => [id, 'a', 'b', 'c', 'd', 'e', 'f', 'g']

beforeEach(() => reset())

test('appendBatch accumulates rows across batches', () => {
  appendBatch([row('C-1')])
  appendBatch([row('C-2'), row('C-3')])
  expect(store.rowCount).toBe(3)
  expect(store.rows[2][0]).toBe('C-3')
})

test('subscribers are notified once per bump, and not after unsubscribing', () => {
  let n = 0
  const off = subscribe(() => n++)
  appendBatch([row('C-1')])
  expect(n).toBe(0)
  bump()
  expect(n).toBe(1)
  off()
  bump()
  expect(n).toBe(1)
})

test('reset clears rows and loading state', () => {
  appendBatch([row('C-1')])
  store.loading.status = 'done'
  reset()
  expect(store.rowCount).toBe(0)
  expect(store.rows).toHaveLength(0)
  expect(store.loading.status).toBe('idle')
})

// ---- Stage 2: issue overlays and counts ----
import { COLUMNS } from '../validation/columns'
import { validateCell } from '../validation/rules'
import { recount } from './counts'

const mkRow = (email: string) => ['C', 'Anna', 'M', email, '2024-01-02', 'DE', 'pro', '1']
const flagsFor = (rows: string[][]) =>
  COLUMNS.map((column, c) => Uint8Array.from(rows.map((r) => validateCell(column, r[c]))))

test('appendBatch stores the batch flags in per-column overlays that grow with the rows', () => {
  const batch = [mkRow(''), mkRow('ok@b.co'), mkRow('')]
  appendBatch(batch, flagsFor(batch))
  appendBatch(batch, flagsFor(batch))
  expect(store.rowCount).toBe(6)
  expect(store.flags).toHaveLength(8)
  expect(store.flags[3].length).toBeGreaterThanOrEqual(6)
  expect([...store.flags[3].subarray(0, 6)].filter((code) => code !== 0)).toHaveLength(4)
})

test('recount counts problems per issue key, problem cells and problem rows', () => {
  const batch = [mkRow(''), mkRow('ok@b.co'), mkRow(''), ['', 'Anna', 'M', '', '2024-01-02', 'DE', 'pro', '1']]
  appendBatch(batch, flagsFor(batch))
  recount()
  expect(store.counts.get('email.missing')).toBe(3)
  expect(store.counts.get('customer_id.missing')).toBe(1)
  expect(store.problemCells).toBe(4)
  expect(store.problemRows).toBe(3)
})

test('overlays grow past the initial capacity without losing earlier flags', () => {
  const big = Array.from({ length: 70_000 }, (_, i) => mkRow(i % 2 ? 'ok@b.co' : ''))
  appendBatch(big, flagsFor(big))
  expect(store.flags[3].length).toBeGreaterThanOrEqual(70_000)
  recount()
  expect(store.counts.get('email.missing')).toBe(35_000)
})
