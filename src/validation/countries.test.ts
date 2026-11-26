import { test, expect } from 'vitest'
import { ISO_ALPHA2, countryCodeFor } from './countries'

test('every ISO code is known, 249 of them', () => {
  expect(ISO_ALPHA2.size).toBe(249)
  expect(ISO_ALPHA2.has('DE')).toBe(true)
  expect(ISO_ALPHA2.has('XX')).toBe(false)
})

test.each([
  ['DE', 'DE'], ['de', 'DE'], ['Germany', 'DE'], ['Deutschland', 'DE'], [' germany ', 'DE'],
  ['France', 'FR'], ['FRANCE', 'FR'], ['fr', 'FR'],
  ['Italy', 'IT'], ['Italia', 'IT'],
  ['Spain', 'ES'], ['España', 'ES'],
  ['Netherlands', 'NL'], ['Nederland', 'NL'], ['The Netherlands', 'NL'], ['Holland', 'NL'],
  ['Poland', 'PL'], ['Polska', 'PL'],
  ['United Kingdom', 'GB'], ['UK', 'GB'], ['Great Britain', 'GB'],
  ['United States', 'US'], ['USA', 'US'], ['U.S.', 'US'], ['United States of America', 'US'],
  ['Austria', 'AT'], ['Österreich', 'AT'], ['AT', 'AT'],
])('countryCodeFor(%j) = %s', (value, code) => {
  expect(countryCodeFor(value)).toBe(code)
})

test.each([['Germny'], [''], ['Pro'], ['Narnia'], ['D'], ['DEU']])('countryCodeFor(%j) is undefined: never guessed', (value) => {
  expect(countryCodeFor(value)).toBeUndefined()
})
