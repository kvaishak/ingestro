import { test, expect } from 'vitest'
import { COLUMNS } from './columns'
import { codeOf } from './catalog'
import { validateCell, validateRow } from './rules'
import { markDuplicates } from './duplicates'
import { row } from './testUtils'

const E = COLUMNS.indexOf('email')
const ID = COLUMNS.indexOf('customer_id')

function flagsFor(rows: string[][]) {
  const flags = COLUMNS.map(() => new Uint8Array(rows.length))
  rows.forEach((r, i) => validateRow(r).forEach((c, k) => { flags[k][i] = c }))
  return flags
}

test('marks both rows of a pair, skips invalid and removed rows, clears stale marks', () => {
  const rows = [row({ email: 'a@b.co' }), row({ email: 'a@b.co' }), row({ email: 'bad' }), row({ email: 'a@b.co' })]
  const flags = flagsFor(rows)
  const removed = new Uint8Array(4); removed[3] = 1
  const dup = codeOf('email.duplicate')
  markDuplicates(rows, 4, flags, removed)
  expect([flags[E][0], flags[E][1], flags[E][2], flags[E][3]]).toEqual([dup, dup, codeOf('email.invalid'), 0])
  rows[1][E] = 'other@b.co'; flags[E][1] = validateCell('email', rows[1][E])
  markDuplicates(rows, 4, flags, removed)
  expect([flags[E][0], flags[E][1]]).toEqual([0, 0])
})

test('customer ids are checked the same way, and removed may be null', () => {
  const rows = [row({ customer_id: 'C-9' }), row({ customer_id: 'C-9' }), row({ customer_id: 'C-10' })]
  const flags = flagsFor(rows)
  markDuplicates(rows, 3, flags, null)
  const dup = codeOf('customer_id.duplicate')
  expect([flags[ID][0], flags[ID][1], flags[ID][2]]).toEqual([dup, dup, 0])
})

test('only the first rowCount rows are considered (overlays may have spare capacity)', () => {
  const rows = [row({ email: 'a@b.co' }), row({ email: 'a@b.co' })]
  const flags = COLUMNS.map(() => new Uint8Array(16))
  rows.forEach((r, i) => validateRow(r).forEach((c, k) => { flags[k][i] = c }))
  markDuplicates(rows, 1, flags, null)
  expect(flags[E][0]).toBe(0)
})
