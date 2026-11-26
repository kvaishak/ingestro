import type { Column } from './columns'
import { countryCodeFor } from './countries'

/**
 * Every kind of problem the tool recognises, with the words the user reads.
 * This is the only place user-facing wording about problems lives.
 *
 * A code is a small integer stored one byte per cell per column; 0 means "no issue".
 * Codes are unique within a column and must never change once used.
 */
export interface IssueDef {
  key: string
  column: Column
  code: number
  /** Short title, e.g. "Country is not a two-letter code" */
  title: string
  /** What is wrong, in plain words */
  what: string
  /** What a good value looks like */
  good: string
  /**
   * For problems where the tool can tell what the value should be: the suggested value,
   * or undefined when it cannot tell for this particular value. Computed on demand,
   * never stored, never applied without the user's click.
   */
  suggest?: (value: string) => string | undefined
}

export const CATALOG: IssueDef[] = [
  // customer_id
  { key: 'customer_id.missing', column: 'customer_id', code: 1,
    title: 'Customer ID is empty',
    what: 'Every row needs a customer ID so we can tell customers apart.',
    good: 'C-0001234' },
  { key: 'customer_id.duplicate', column: 'customer_id', code: 2,
    title: 'Same customer ID as another row',
    what: 'Two rows share this ID. Each customer must have an ID of their own.',
    good: 'An ID that no other row uses' },

  // first_name
  { key: 'first_name.missing', column: 'first_name', code: 1,
    title: 'First name is empty',
    what: 'The first name is required.',
    good: 'Anna' },
  { key: 'first_name.spaces', column: 'first_name', code: 2,
    title: 'First name has extra spaces',
    what: 'There are spaces before or after the name.',
    good: 'Anna, without spaces around it' },

  // last_name
  { key: 'last_name.missing', column: 'last_name', code: 1,
    title: 'Last name is empty',
    what: 'The last name is required.',
    good: 'Müller' },
  { key: 'last_name.spaces', column: 'last_name', code: 2,
    title: 'Last name has extra spaces',
    what: 'There are spaces before or after the name.',
    good: 'Müller, without spaces around it' },

  // email
  { key: 'email.missing', column: 'email', code: 1,
    title: 'Email is empty',
    what: 'This customer has no email address at all.',
    good: 'name@company.com' },
  { key: 'email.invalid', column: 'email', code: 2,
    title: "Email doesn't look like an address",
    what: 'An email needs one @ sign and a domain after it, with no spaces. This one is missing a part or has something extra.',
    good: 'luca.schmidt@example.com' },
  { key: 'email.duplicate', column: 'email', code: 3,
    title: 'Same email as another customer',
    what: 'Two customers share this email. Usually one of them is a copy. Give one of them a different address.',
    good: 'An address that no other row uses' },

  // signup_date
  { key: 'signup_date.missing', column: 'signup_date', code: 1,
    title: 'Signup date is empty',
    what: 'Every customer needs a signup date.',
    good: '2024-04-03' },
  { key: 'signup_date.invalid', column: 'signup_date', code: 2,
    title: 'Signup date is not in the right format or is not a real date',
    what: 'Dates must be written as year-month-day with dashes, and the day must exist in that month.',
    good: '2024-04-03' },

  // country
  { key: 'country.missing', column: 'country', code: 1,
    title: 'Country is empty',
    what: 'We need to know which country this customer is in.',
    good: 'DE' },
  { key: 'country.invalid', column: 'country', code: 2,
    title: 'Country is not a two-letter code',
    what: 'Countries must be written as their two-letter code in capitals, not as a name.',
    good: 'DE for Germany, FR for France, US for the United States',
    suggest: countryCodeFor },

  // plan
  { key: 'plan.missing', column: 'plan', code: 1,
    title: 'Plan is empty',
    what: 'Every customer needs a plan.',
    good: 'free, pro or enterprise' },
  { key: 'plan.invalid', column: 'plan', code: 2,
    title: 'Plan is not one of the three plans',
    what: 'The plan must be exactly free, pro or enterprise, in lowercase with no spaces.',
    good: 'pro' },

  // monthly_spend
  { key: 'monthly_spend.missing', column: 'monthly_spend', code: 1,
    title: 'Monthly spend is empty',
    what: 'Monthly spend must be a number. Zero is fine.',
    good: '0' },
  { key: 'monthly_spend.negative', column: 'monthly_spend', code: 2,
    title: 'Monthly spend is negative',
    what: 'Spend cannot be below zero. Check what this should have been.',
    good: '45' },
  { key: 'monthly_spend.invalid', column: 'monthly_spend', code: 3,
    title: 'Monthly spend is not a plain number',
    what: 'Write the amount as digits only, with a dot for decimals: no currency sign, no thousands separator, no text.',
    good: '1500.50' },
]

const issuesByKey = new Map(CATALOG.map((issue) => [issue.key, issue]))
const issuesByColumnAndCode = new Map(CATALOG.map((issue) => [`${issue.column}#${issue.code}`, issue]))

/** The definition for a key like 'email.invalid'. Throws on an unknown key: that is a programming error. */
export function issueByKey(key: string): IssueDef {
  const issue = issuesByKey.get(key)
  if (!issue) throw new Error(`Unknown issue key: ${key}`)
  return issue
}

/** The definition behind a code read from the overlay, or undefined for 0 ("no issue"). */
export function issueFor(column: Column, code: number): IssueDef | undefined {
  if (code === 0) return undefined
  return issuesByColumnAndCode.get(`${column}#${code}`)
}

export function codeOf(key: string): number {
  return issueByKey(key).code
}

/** The suggested value for a cell, if the problem on it comes with one. */
export function suggestionFor(column: Column, code: number, value: string): string | undefined {
  const issue = issueFor(column, code)
  return issue?.suggest?.(value)
}
