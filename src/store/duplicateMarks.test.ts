import { test, expect, beforeEach } from 'vitest'
import { COLUMNS } from '../validation/columns'
import { codeOf } from '../validation/catalog'
import { store, reset, appendBatch } from './store'
import { applyDuplicatePositions } from './duplicateMarks'

const E = COLUMNS.indexOf('email')
const ID = COLUMNS.indexOf('customer_id')

beforeEach(() => {
  reset()
  appendBatch([
    ['C-1', 'A', 'B', 'a@b.co', '2024-01-02', 'DE', 'pro', '1'],
    ['C-1', 'A', 'B', 'a@b.co', '2024-01-02', 'DE', 'pro', '1'],
    ['C-2', 'A', 'B', 'c@b.co', '2024-01-02', 'DE', 'pro', '1'],
  ])
})

test('writes the duplicate code at the given positions for each checked column', () => {
  applyDuplicatePositions({ email: Uint32Array.from([0, 1]), customer_id: Uint32Array.from([0, 1]) })
  expect([...store.flags[E].subarray(0, 3)]).toEqual([codeOf('email.duplicate'), codeOf('email.duplicate'), 0])
  expect([...store.flags[ID].subarray(0, 3)]).toEqual([codeOf('customer_id.duplicate'), codeOf('customer_id.duplicate'), 0])
})
