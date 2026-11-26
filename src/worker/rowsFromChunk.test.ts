import { test, expect } from 'vitest'
import Papa from 'papaparse'
import { rowsFromChunk } from './rowsFromChunk'

test('drops the header, keeps a quoted comma in one cell, pads and truncates rows to 8 cells', () => {
  const data = [
    ['customer_id', 'first_name', 'last_name', 'email', 'signup_date', 'country', 'plan', 'monthly_spend'],
    ['C-1', 'Anna', 'Smith, Jr.', 'a@b.co', '2024-01-02', 'DE', 'pro', '10'],
    ['C-2', 'Luca', 'Rossi'],
    ['C-3', 'Mia', 'Weber', 'm@b.co', '2024-01-02', 'IT', 'free', '0', 'extra'],
    [''],
  ]
  const rows = rowsFromChunk(data, true)
  expect(rows).toHaveLength(3)
  expect(rows[0][2]).toBe('Smith, Jr.')
  expect(rows[1]).toHaveLength(8)
  expect(rows[1][3]).toBe('')
  expect(rows[2]).toHaveLength(8)
  expect(rows[2][7]).toBe('0')
})

test('keeps the first row when the chunk is not the first one', () => {
  expect(rowsFromChunk([['C-9', 'a', 'b', 'c', 'd', 'e', 'f', 'g']], false)).toHaveLength(1)
})

test('PapaParse keeps a quoted comma in one cell', () => {
  const r = Papa.parse<string[]>('a,"Smith, Jr.",c\n')
  expect(r.data[0]).toEqual(['a', 'Smith, Jr.', 'c'])
})
