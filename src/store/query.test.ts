import { test, expect, beforeEach } from 'vitest'
import { store, reset, appendBatch, positionsInFileOrder } from './store'
import { setQuery, resetQuery, query, nextSort } from './query'
import { validateRows } from '../validation/rules'
import { cleanRow } from '../test/fixtures'

const mk = (spend: string, last: string) => cleanRow({ monthly_spend: spend, last_name: last })

beforeEach(() => {
  reset()
  resetQuery()
  appendBatch([mk('€ 120', 'a'), mk('n/a', 'b'), mk('32', 'c'), mk('-45', 'd'), mk('7', 'Needle')])
  store.view = Uint32Array.from([0, 1, 2, 3, 4])
})

test('search is a case-insensitive substring match over all columns', () => {
  setQuery({ search: 'needle' })
  expect([...store.view]).toEqual([4])
  setQuery({ search: 'N/A' })
  expect([...store.view]).toEqual([1])
})

test('clearing the search restores every row in file order', () => {
  setQuery({ search: 'needle' })
  setQuery({ search: '' })
  expect([...store.view]).toEqual([0, 1, 2, 3, 4])
})

test('sort by spend is numeric where both sides parse and never throws on junk', () => {
  setQuery({ sort: { column: 'monthly_spend', dir: 'asc' } })
  const order = [...store.view].map((i) => store.rows[i][7])
  expect(order).toHaveLength(5)
  expect(order.indexOf('7')).toBeLessThan(order.indexOf('32'))
  expect(order.indexOf('-45')).toBeLessThan(order.indexOf('7'))
})

test('text sorts dictionary-style: case does not split the alphabet', () => {
  setQuery({ sort: { column: 'last_name', dir: 'asc' } })
  expect([...store.view].map((i) => store.rows[i][2])).toEqual(['a', 'b', 'c', 'd', 'Needle'])
  setQuery({ sort: { column: 'last_name', dir: 'desc' } })
  expect([...store.view].map((i) => store.rows[i][2])).toEqual(['Needle', 'd', 'c', 'b', 'a'])
})

test('sort applies to search results', () => {
  setQuery({ search: 'e', sort: { column: 'last_name', dir: 'desc' } })
  // 'e' matches the country 'DE' of every row, so all rows, sorted descending
  expect([...store.view].map((i) => store.rows[i][2])).toEqual(['Needle', 'd', 'c', 'b', 'a'])
})

test('blanks are not special-cased: they sort as the empty string, first ascending', () => {
  appendBatch([cleanRow({ last_name: '', monthly_spend: '0' })])
  setQuery({ sort: { column: 'last_name', dir: 'asc' } })
  expect(store.rows[store.view[0]][2]).toBe('')
})

test('setQuery merges partial updates and bumps the version', () => {
  const v = store.version
  setQuery({ search: 'a' })
  expect(query.search).toBe('a')
  expect(query.sort).toBeNull()
  expect(store.version).toBe(v + 1)
})

// Filter by problem type.

const withEmail = (email: string) => cleanRow({ email })

test('issue filter keeps only rows whose cell has that problem, and composes with search and sort', () => {
  reset()
  resetQuery()
  const rows = [withEmail(''), withEmail('ok@b.co'), withEmail(''), withEmail('x'), withEmail('ok2@b.co')]
  appendBatch(rows, validateRows(rows))
  store.view = positionsInFileOrder()

  setQuery({ issueKey: 'email.missing' })
  expect([...store.view]).toEqual([0, 2])

  setQuery({ issueKey: 'email.invalid' })
  expect([...store.view]).toEqual([3])

  setQuery({ issueKey: null })
  expect(store.view.length).toBe(5)

  setQuery({ issueKey: 'email.missing', sort: { column: 'customer_id', dir: 'desc' } })
  expect([...store.view]).toHaveLength(2)
})

test('nextSort cycles one column asc -> desc -> none, and a new column starts at asc', () => {
  const asc = nextSort(null, 'email')
  expect(asc).toEqual({ column: 'email', dir: 'asc' })
  const desc = nextSort(asc, 'email')
  expect(desc).toEqual({ column: 'email', dir: 'desc' })
  expect(nextSort(desc, 'email')).toBeNull()
  expect(nextSort(desc, 'plan')).toEqual({ column: 'plan', dir: 'asc' })
})
