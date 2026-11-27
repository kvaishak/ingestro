import { test, expect } from 'vitest'
import { COLUMNS } from '../validation/columns'
import { codeOf } from '../validation/catalog'
import { store } from './store'
import { setQuery } from './query'
import { applyChange, editCell, undo, history, originalValue, isChanged, revertAllChanges } from './changes'
import { customerRow, seedStore } from '../test/fixtures'

const FIRST = COLUMNS.indexOf('first_name')
const EMAIL = COLUMNS.indexOf('email')
const COUNTRY = COLUMNS.indexOf('country')
const DUP = codeOf('email.duplicate')

test('editing a cell writes the value, revalidates the row and recounts', () => {
  seedStore([customerRow(''), customerRow('ok@b.co')])
  expect(store.counts.get('email.missing')).toBe(1)
  editCell(0, EMAIL, 'fixed@b.co')
  expect(store.rows[0][EMAIL]).toBe('fixed@b.co')
  expect(store.flags[EMAIL][0]).toBe(0)
  expect(store.counts.get('email.missing') ?? 0).toBe(0)
  expect(isChanged(0, EMAIL)).toBe(true)
})

test('fixing one half of a duplicate pair clears the other; creating a collision flags both', () => {
  seedStore([customerRow('a@b.co'), customerRow('a@b.co'), customerRow('c@b.co')])
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
  seedStore([customerRow('same@b.co'), customerRow('same@b.co')], { withDuplicateCheck: false })
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
  seedStore([customerRow('a@b.co', 'Germany'), customerRow('b@b.co', 'France')])
  applyChange('countries', [{ row: 0, col: COUNTRY, newValue: 'DE' }, { row: 1, col: COUNTRY, newValue: 'FR' }])
  editCell(0, COUNTRY, 'AT')
  expect(history.undo).toHaveLength(2)
  undo()
  expect(store.rows[0][COUNTRY]).toBe('DE')
  undo()
  expect(store.rows[0][COUNTRY]).toBe('Germany')
  expect(store.rows[1][COUNTRY]).toBe('France')
  expect(isChanged(0, COUNTRY)).toBe(false)
  expect(store.flags[COUNTRY][0]).toBe(codeOf('country.invalid'))
  expect(history.undo).toHaveLength(0)
  expect(undo()).toBeUndefined()
})

test('editing back to the original makes the cell unchanged again; originalValue remembers the loaded value', () => {
  seedStore([customerRow('a@b.co')])
  editCell(0, EMAIL, 'x@b.co')
  editCell(0, EMAIL, 'y@b.co')
  expect(originalValue(0, EMAIL)).toBe('a@b.co')
  editCell(0, EMAIL, 'a@b.co')
  expect(isChanged(0, EMAIL)).toBe(false)
})

test('a row fixed while a problem filter is active stays in view until the filter changes', () => {
  seedStore([customerRow(''), customerRow('ok@b.co'), customerRow('')])
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
  seedStore([customerRow('a@b.co')])
  const v = store.version
  editCell(0, FIRST, 'Lena')
  expect(store.version).toBe(v + 1)
  undo()
  expect(store.version).toBe(v + 2)
})

// Revert everything.

test('revertAllChanges restores every changed cell to its loaded value in one undoable change', () => {
  seedStore([customerRow('a@b.co', 'Germany'), customerRow('b@b.co', 'France'), customerRow('c@b.co', 'DE')])
  applyChange('countries', [{ row: 0, col: COUNTRY, newValue: 'DE' }, { row: 1, col: COUNTRY, newValue: 'FR' }])
  editCell(0, EMAIL, 'x@b.co')
  editCell(0, EMAIL, 'y@b.co')
  const before = history.undo.length

  const entry = revertAllChanges()

  expect(entry?.cells).toHaveLength(3) // three distinct cells were changed
  expect(store.rows[0][COUNTRY]).toBe('Germany')
  expect(store.rows[1][COUNTRY]).toBe('France')
  expect(store.rows[0][EMAIL]).toBe('a@b.co')
  expect(isChanged(0, COUNTRY)).toBe(false)
  expect(isChanged(0, EMAIL)).toBe(false)
  expect(store.counts.get('country.invalid')).toBe(2)
  expect(history.undo).toHaveLength(before + 1)

  undo() // the revert itself can be undone
  expect(store.rows[0][COUNTRY]).toBe('DE')
  expect(store.rows[0][EMAIL]).toBe('y@b.co')
})

test('revertAllChanges with nothing changed does nothing', () => {
  seedStore([customerRow('a@b.co')])
  expect(revertAllChanges()).toBeUndefined()
  expect(history.undo).toHaveLength(0)
})

test('revertAllChanges skips cells that were edited back to their original by hand', () => {
  seedStore([customerRow('a@b.co')])
  editCell(0, EMAIL, 'x@b.co')
  editCell(0, EMAIL, 'a@b.co')
  expect(revertAllChanges()).toBeUndefined()
})
