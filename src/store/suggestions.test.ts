import { test, expect } from 'vitest'
import { COLUMNS } from '../validation/columns'
import { store } from './store'
import { editCell } from './changes'
import { splitBySuggestion } from './suggestions'
import { customerRow, seedStore } from '../test/fixtures'

const COUNTRY = COLUMNS.indexOf('country')

test('splits flagged values into recognised (with their suggestion) and unrecognised (distinct, counted, by count desc)', () => {
  seedStore([
    customerRow('a@b.co', 'Germany'), customerRow('b@b.co', 'Deutschland'), customerRow('c@b.co', 'FRANCE'),
    customerRow('d@b.co', 'Narnia'), customerRow('e@b.co', 'Narnia'), customerRow('f@b.co', 'Germny'),
    customerRow('g@b.co', 'DE'), // valid, not flagged, must not appear
    customerRow('h@b.co', ''),   // missing, a different problem, must not appear
  ])
  const split = splitBySuggestion('country.invalid')
  expect(split.recognised.map((x) => [x.row, x.value, x.suggestion])).toEqual([
    [0, 'Germany', 'DE'], [1, 'Deutschland', 'DE'], [2, 'FRANCE', 'FR'],
  ])
  expect(split.unrecognised).toEqual([{ value: 'Narnia', count: 2 }, { value: 'Germny', count: 1 }])
  expect(split.unrecognisedTotal).toBe(3)
})

test('a problem without suggestions puts everything in unrecognised', () => {
  seedStore([customerRow('bad'), customerRow('bad'), customerRow('ok@b.co')])
  const split = splitBySuggestion('email.invalid')
  expect(split.recognised).toEqual([])
  expect(split.unrecognised).toEqual([{ value: 'bad', count: 2 }])
})

test('the split follows the data: a fixed row drops out', () => {
  seedStore([customerRow('a@b.co', 'Germany'), customerRow('b@b.co', 'Narnia')])
  expect(splitBySuggestion('country.invalid').recognised).toHaveLength(1)
  editCell(0, COUNTRY, 'DE')
  expect(splitBySuggestion('country.invalid').recognised).toHaveLength(0)
  expect(store.flags[COUNTRY][0]).toBe(0)
})
