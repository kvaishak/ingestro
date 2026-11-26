import { test, expect } from 'vitest'
import { COLUMNS } from '../validation/columns'
import { store } from './store'
import { editCell } from './changes'
import { splitBySuggestion } from './suggestions'
import { r, seed } from './testUtils'

const COUNTRY = COLUMNS.indexOf('country')

test('splits flagged values into recognised (with their suggestion) and unrecognised (distinct, counted, by count desc)', () => {
  seed([
    r('a@b.co', 'Germany'), r('b@b.co', 'Deutschland'), r('c@b.co', 'FRANCE'),
    r('d@b.co', 'Narnia'), r('e@b.co', 'Narnia'), r('f@b.co', 'Germny'),
    r('g@b.co', 'DE'), // valid, not flagged, must not appear
    r('h@b.co', ''),   // missing, a different problem, must not appear
  ])
  const split = splitBySuggestion('country.invalid')
  expect(split.recognised.map((x) => [x.row, x.value, x.suggestion])).toEqual([
    [0, 'Germany', 'DE'], [1, 'Deutschland', 'DE'], [2, 'FRANCE', 'FR'],
  ])
  expect(split.unrecognised).toEqual([{ value: 'Narnia', count: 2 }, { value: 'Germny', count: 1 }])
  expect(split.unrecognisedTotal).toBe(3)
})

test('a problem without suggestions puts everything in unrecognised', () => {
  seed([r('bad'), r('bad'), r('ok@b.co')])
  const split = splitBySuggestion('email.invalid')
  expect(split.recognised).toEqual([])
  expect(split.unrecognised).toEqual([{ value: 'bad', count: 2 }])
})

test('the split follows the data: a fixed row drops out', () => {
  seed([r('a@b.co', 'Germany'), r('b@b.co', 'Narnia')])
  expect(splitBySuggestion('country.invalid').recognised).toHaveLength(1)
  editCell(0, COUNTRY, 'DE')
  expect(splitBySuggestion('country.invalid').recognised).toHaveLength(0)
  expect(store.flags[COUNTRY][0]).toBe(0)
})
