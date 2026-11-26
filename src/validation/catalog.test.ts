import { test, expect } from 'vitest'
import { CATALOG, issueByKey, issueFor, codeOf } from './catalog'
import { COLUMNS } from './columns'

test('keys are unique and codes are unique within a column, within 1..255', () => {
  expect(new Set(CATALOG.map((i) => i.key)).size).toBe(CATALOG.length)
  for (const c of COLUMNS) {
    const codes = CATALOG.filter((i) => i.column === c).map((i) => i.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect(codes.every((n) => n >= 1 && n <= 255)).toBe(true)
  }
})

test('every key starts with its column name', () => {
  for (const i of CATALOG) expect(i.key.startsWith(i.column + '.')).toBe(true)
})

test('lookup helpers agree', () => {
  const d = issueByKey('country.invalid')
  expect(issueFor('country', d.code)).toBe(d)
  expect(codeOf('country.invalid')).toBe(d.code)
  expect(issueFor('country', 0)).toBeUndefined()
  expect(() => issueByKey('nope')).toThrow()
})

test('copy is plain language: no jargon', () => {
  for (const i of CATALOG) {
    expect(`${i.title} ${i.what} ${i.good}`).not.toMatch(/\bISO\b|regex|alpha-2|\bnull\b|\bNaN\b/i)
    expect(i.title.length).toBeGreaterThan(5)
    expect(i.good.length).toBeGreaterThan(0)
  }
})

// ---- Stage 4: suggestions hang off catalog entries ----
import { suggestionFor } from './catalog'

test('suggestionFor returns the entry suggestion where one exists, otherwise undefined', () => {
  expect(suggestionFor('country', codeOf('country.invalid'), 'Deutschland')).toBe('DE')
  expect(suggestionFor('country', codeOf('country.invalid'), 'Narnia')).toBeUndefined()
  expect(suggestionFor('email', codeOf('email.invalid'), 'x')).toBeUndefined()
  expect(suggestionFor('country', 0, 'DE')).toBeUndefined()
})
