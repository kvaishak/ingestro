import { test, expect } from 'vitest'
import { COLUMNS } from '../validation/columns'
import { codeOf } from '../validation/catalog'
import { store } from './store'
import { history, undo } from './changes'
import { setQuery } from './query'
import { planBulk, applyBulk } from './bulk'
import { customerRow, seedStore } from '../test/fixtures'

const COUNTRY = COLUMNS.indexOf('country')
const INVALID = codeOf('country.invalid')

const rows = () => [
  customerRow('a@b.co', 'Germany'), customerRow('b@b.co', 'Deutschland'), customerRow('c@b.co', 'FRANCE'),
  customerRow('d@b.co', 'Germany'), customerRow('e@b.co', 'Narnia'), customerRow('f@b.co', ''),
]

test('planBulk groups recognised values by from -> to, biggest group first, and reports what is left untouched', () => {
  seedStore(rows())
  const plan = planBulk('country.invalid')
  expect(plan.column).toBe('country')
  expect(plan.groups.map((g) => [g.from, g.to, g.rows])).toEqual([
    ['Germany', 'DE', [0, 3]], ['Deutschland', 'DE', [1]], ['FRANCE', 'FR', [2]],
  ])
  expect(plan.total).toBe(4)
  expect(plan.untouched).toEqual([{ value: 'Narnia', count: 1 }])
  expect(plan.untouchedTotal).toBe(1)
})

test('applyBulk is one undoable change that fixes the recognised rows and leaves the rest flagged', () => {
  seedStore(rows())
  setQuery({ issueKey: 'country.invalid' })
  expect(store.view.length).toBe(5) // 4 recognised + Narnia; the empty one is a different problem

  applyBulk(planBulk('country.invalid'))

  expect(history.undo).toHaveLength(1)
  expect(history.undo[0].cells).toHaveLength(4)
  expect([0, 1, 2, 3].map((i) => store.rows[i][COUNTRY])).toEqual(['DE', 'DE', 'FR', 'DE'])
  expect([0, 1, 2, 3].map((i) => store.flags[COUNTRY][i])).toEqual([0, 0, 0, 0])
  expect(store.flags[COUNTRY][4]).toBe(INVALID)
  expect(store.counts.get('country.invalid')).toBe(1)
  expect([...store.view]).toEqual([4]) // no pinning for bulk: the grid narrows to what is left

  undo()
  expect([0, 1, 2, 3].map((i) => store.rows[i][COUNTRY])).toEqual(['Germany', 'Deutschland', 'FRANCE', 'Germany'])
  expect(store.counts.get('country.invalid')).toBe(5)
  expect(store.view.length).toBe(5)
})

test('applyBulk with nothing recognised changes nothing and records nothing', () => {
  seedStore([customerRow('a@b.co', 'Narnia')])
  const entry = applyBulk(planBulk('country.invalid'))
  expect(entry).toBeUndefined()
  expect(history.undo).toHaveLength(0)
})
