import { test, expect } from 'vitest'
import { COLUMNS } from './columns'
import { codeOf } from './catalog'
import { validateCell, validateRow, validateRows } from './rules'
import { markDuplicates, positionsWithRepeatedValues } from './duplicates'
import { cleanRow } from '../test/fixtures'

const E = COLUMNS.indexOf('email')
const ID = COLUMNS.indexOf('customer_id')

test('marks both rows of a pair, skips invalid rows, clears stale marks', () => {
  const rows = [cleanRow({ email: 'a@b.co' }), cleanRow({ email: 'a@b.co' }), cleanRow({ email: 'bad' })]
  const flags = validateRows(rows)
  const dup = codeOf('email.duplicate')
  markDuplicates(rows, 3, flags)
  expect([flags[E][0], flags[E][1], flags[E][2]]).toEqual([dup, dup, codeOf('email.invalid')])
  rows[1][E] = 'other@b.co'; flags[E][1] = validateCell('email', rows[1][E])
  markDuplicates(rows, 3, flags)
  expect([flags[E][0], flags[E][1]]).toEqual([0, 0])
})

test('customer ids are checked the same way', () => {
  const rows = [cleanRow({ customer_id: 'C-9' }), cleanRow({ customer_id: 'C-9' }), cleanRow({ customer_id: 'C-10' })]
  const flags = validateRows(rows)
  markDuplicates(rows, 3, flags)
  const dup = codeOf('customer_id.duplicate')
  expect([flags[ID][0], flags[ID][1], flags[ID][2]]).toEqual([dup, dup, 0])
})

test('only the first rowCount rows are considered (overlays may have spare capacity)', () => {
  const rows = [cleanRow({ email: 'a@b.co' }), cleanRow({ email: 'a@b.co' })]
  const flags = COLUMNS.map(() => new Uint8Array(16))
  rows.forEach((r, i) => validateRow(r).forEach((c, k) => { flags[k][i] = c }))
  markDuplicates(rows, 1, flags)
  expect(flags[E][0]).toBe(0)
})

// The shared core, also used by the worker at the end of loading.
test('positionsWithRepeatedValues returns every position whose value appears more than once, skipping nulls', () => {
  expect(positionsWithRepeatedValues(['a', 'b', 'a', null, null, 'c', 'b'])).toEqual([0, 2, 1, 6])
  expect(positionsWithRepeatedValues(['x', 'y'])).toEqual([])
  expect(positionsWithRepeatedValues([])).toEqual([])
})
