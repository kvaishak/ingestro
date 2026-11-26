import { test, expect } from 'vitest'
import { codeOf } from './catalog'
import { validateCell, validateRow } from './rules'
import { row } from './testUtils'

test('a clean row has no issues', () => {
  expect([...validateRow(row())]).toEqual([0, 0, 0, 0, 0, 0, 0, 0])
})

test.each([
  ['email', '', 'email.missing'],
  ['email', 'luca.schmidt2example.com', 'email.invalid'],
  ['email', 'a@@b.co', 'email.invalid'],
  ['email', 'omar.khan34@', 'email.invalid'],
  ['email', ' a@b.co ', 'email.invalid'],
  ['country', '', 'country.missing'],
  ['country', 'Germany', 'country.invalid'],
  ['country', 'de', 'country.invalid'],
  ['country', 'XX', 'country.invalid'],
  ['signup_date', '', 'signup_date.missing'],
  ['signup_date', '2021-02-30', 'signup_date.invalid'],
  ['signup_date', '03/04/2024', 'signup_date.invalid'],
  ['signup_date', '12 Mar 2023', 'signup_date.invalid'],
  ['signup_date', '2024-13-01', 'signup_date.invalid'],
  ['plan', 'PRO', 'plan.invalid'],
  ['plan', ' free', 'plan.invalid'],
  ['plan', 'enterprize', 'plan.invalid'],
  ['plan', '', 'plan.missing'],
  ['monthly_spend', '€ 120', 'monthly_spend.invalid'],
  ['monthly_spend', '1,500.50', 'monthly_spend.invalid'],
  ['monthly_spend', '750,50', 'monthly_spend.invalid'],
  ['monthly_spend', 'n/a', 'monthly_spend.invalid'],
  ['monthly_spend', '-45', 'monthly_spend.negative'],
  ['monthly_spend', '', 'monthly_spend.missing'],
  ['first_name', ' Anna  ', 'first_name.spaces'],
  ['first_name', '   ', 'first_name.missing'],
  ['last_name', '', 'last_name.missing'],
  ['customer_id', '', 'customer_id.missing'],
] as const)('%s = %j -> %s', (col, value, key) => {
  expect(validateCell(col, value)).toBe(codeOf(key))
})

test.each([
  ['country', 'AT'], ['country', 'US'], ['country', 'GB'],
  ['signup_date', '2024-02-29'], ['signup_date', '2019-12-31'],
  ['monthly_spend', '0'], ['monthly_spend', '123.45'], ['monthly_spend', '9000'],
  ['plan', 'free'], ['plan', 'enterprise'],
  ['email', 'mia.weber+test@mail.test'],
  ['last_name', "O'Brien"], ['last_name', 'Smith, Jr.'],
] as const)('%s = %j is valid', (col, value) => {
  expect(validateCell(col, value)).toBe(0)
})

test('validateCell never returns a duplicate code', () => {
  expect(validateCell('email', 'a@b.co')).toBe(0)
  expect(validateCell('customer_id', 'C-1')).toBe(0)
})

test('validateRow reuses the output array when given one', () => {
  const out = new Uint8Array(8)
  const res = validateRow(row({ email: '' }), out)
  expect(res).toBe(out)
  expect(out[3]).toBe(codeOf('email.missing'))
})
