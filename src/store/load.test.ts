import { test, expect, beforeEach } from 'vitest'
import { COLUMNS } from '../validation/columns'
import { codeOf } from '../validation/catalog'
import { store, reset, appendBatch } from './store'
import { applyDuplicatePositions } from './load'
import { cleanRow } from '../test/fixtures'

const E = COLUMNS.indexOf('email')
const ID = COLUMNS.indexOf('customer_id')

beforeEach(() => {
  reset()
  appendBatch([
    cleanRow({ customer_id: 'C-1', email: 'a@b.co' }),
    cleanRow({ customer_id: 'C-1', email: 'a@b.co' }),
    cleanRow({ customer_id: 'C-2', email: 'c@b.co' }),
  ])
})

test('writes the duplicate code at the given positions for each checked column', () => {
  applyDuplicatePositions({ email: Uint32Array.from([0, 1]), customer_id: Uint32Array.from([0, 1]) })
  expect([...store.flags[E].subarray(0, 3)]).toEqual([codeOf('email.duplicate'), codeOf('email.duplicate'), 0])
  expect([...store.flags[ID].subarray(0, 3)]).toEqual([codeOf('customer_id.duplicate'), codeOf('customer_id.duplicate'), 0])
})
