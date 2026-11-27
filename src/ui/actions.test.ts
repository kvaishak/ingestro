import { test, expect, vi } from 'vitest'
import { planBulk } from '../store/bulk'
import { customerRow, seedStore } from '../test/fixtures'
import { session } from './session'
import { selectIssue, applyBulkPlan, undoLastChange } from './actions'

// Tests run in Node; the toast only needs timers from `window`.
vi.stubGlobal('window', { setTimeout: () => 0, clearTimeout: () => {} })

test('applying a bulk fix shows its result with undo; undoing returns the panel to the detail view', () => {
  seedStore([customerRow('a@b.co', 'Germany'), customerRow('b@b.co', 'Narnia')])
  selectIssue('country.invalid')

  applyBulkPlan(planBulk('country.invalid'))
  expect(session.panelMode).toBe('applied')
  expect(session.lastBulk).toEqual({ changed: 1 })
  expect(session.toast?.canUndo).toBe(true)

  undoLastChange()
  expect(session.panelMode).toBe('detail')
})
