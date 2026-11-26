import { test, expect } from 'vitest'
import { COLUMNS } from '../validation/columns'
import { codeOf } from '../validation/catalog'
import { store } from './store'
import { setQuery } from './query'
import { applyChange, editCell, undo, history, originalValue } from './changes'
import { r, seed } from './testUtils'

const FIRST = COLUMNS.indexOf('first_name')
const EMAIL = COLUMNS.indexOf('email')
const COUNTRY = COLUMNS.indexOf('country')
const DUP = codeOf('email.duplicate')

test('editing a cell writes the value, revalidates the row and recounts', () => {
  seed([r(''), r('ok@b.co')])
  expect(store.counts.get('email.missing')).toBe(1)
  editCell(0, EMAIL, 'fixed@b.co')
  expect(store.rows[0][EMAIL]).toBe('fixed@b.co')
  expect(store.flags[EMAIL][0]).toBe(0)
  expect(store.counts.get('email.missing') ?? 0).toBe(0)
  expect(store.changed[EMAIL][0]).toBe(1)
})

test('fixing one half of a duplicate pair clears the other; creating a collision flags both', () => {
  seed([r('a@b.co'), r('a@b.co'), r('c@b.co')])
  expect(store.flags[EMAIL][0]).toBe(DUP)
  editCell(1, EMAIL, 'b@b.co')
  expect(store.flags[EMAIL][0]).toBe(0)
  expect(store.flags[EMAIL][1]).toBe(0)
  editCell(2, EMAIL, 'b@b.co')
  expect(store.flags[EMAIL][1]).toBe(DUP)
  expect(store.flags[EMAIL][2]).toBe(DUP)
})

test('the duplicate check only runs when an email or customer id was touched', () => {
  // Seeded without the duplicate pass, so the pair is unmarked until something triggers the check.
  seed([r('same@b.co'), r('same@b.co')], { withDuplicateCheck: false })
  expect(store.flags[EMAIL][0]).toBe(0)
  editCell(0, FIRST, 'Lena')
  expect(store.flags[EMAIL][0]).toBe(0) // still unmarked: a name edit must not trigger the check
  editCell(1, COUNTRY, 'FR')
  expect(store.flags[EMAIL][0]).toBe(0)
  editCell(0, EMAIL, 'same@b.co')
  expect(store.flags[EMAIL][0]).toBe(DUP) // an email edit does
  expect(store.flags[EMAIL][1]).toBe(DUP)
})

test('undo restores values in reverse order after a multi-cell change followed by a single edit', () => {
  seed([r('a@b.co', 'Germany'), r('b@b.co', 'France')])
  applyChange('countries', [{ row: 0, col: COUNTRY, newValue: 'DE' }, { row: 1, col: COUNTRY, newValue: 'FR' }])
  editCell(0, COUNTRY, 'AT')
  expect(history.undo).toHaveLength(2)
  undo()
  expect(store.rows[0][COUNTRY]).toBe('DE')
  undo()
  expect(store.rows[0][COUNTRY]).toBe('Germany')
  expect(store.rows[1][COUNTRY]).toBe('France')
  expect(store.changed[COUNTRY][0]).toBe(0)
  expect(store.flags[COUNTRY][0]).toBe(codeOf('country.invalid'))
  expect(history.undo).toHaveLength(0)
  expect(undo()).toBeUndefined()
})

test('editing back to the original clears the changed mark; originalValue remembers the loaded value', () => {
  seed([r('a@b.co')])
  editCell(0, EMAIL, 'x@b.co')
  editCell(0, EMAIL, 'y@b.co')
  expect(originalValue(0, EMAIL)).toBe('a@b.co')
  editCell(0, EMAIL, 'a@b.co')
  expect(store.changed[EMAIL][0]).toBe(0)
})

test('a row fixed while a problem filter is active stays in view until the filter changes', () => {
  seed([r(''), r('ok@b.co'), r('')])
  setQuery({ issueKey: 'email.missing' })
  expect([...store.view]).toEqual([0, 2])
  editCell(0, EMAIL, 'fixed@b.co')
  expect([...store.view]).toEqual([0, 2])
  expect(store.counts.get('email.missing')).toBe(1)
  setQuery({ issueKey: null })
  setQuery({ issueKey: 'email.missing' })
  expect([...store.view]).toEqual([2])
})

test('every change bumps the version once', () => {
  seed([r('a@b.co')])
  const v = store.version
  editCell(0, FIRST, 'Lena')
  expect(store.version).toBe(v + 1)
  undo()
  expect(store.version).toBe(v + 2)
})
