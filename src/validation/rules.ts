import { COLUMNS, type Column, type Row } from './columns'
import { codeOf } from './catalog'
import { ISO_ALPHA2 } from './countries'

/**
 * Strict per-cell rules against the brief's target formats. Pure: no DOM, no store.
 * Runs in the worker during load and on the main thread after an edit.
 *
 * One function per column. Each checks, in this order: missing, then wrong, then cosmetic.
 * Cross-row rules (duplicates) live in duplicates.ts; nothing here returns a duplicate code.
 */

const NO_ISSUE = 0

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ISO_DATE_SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/
const PLAIN_NUMBER_SHAPE = /^\d+(\.\d+)?$/
const PLANS = new Set(['free', 'pro', 'enterprise'])

function isBlank(value: string): boolean {
  return value.trim() === ''
}

function hasSurroundingSpaces(value: string): boolean {
  return value !== value.trim()
}

function isRealIsoDate(value: string): boolean {
  const match = ISO_DATE_SHAPE.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  // Build the date and check nothing rolled over (e.g. Feb 30 becomes Mar 1 or 2).
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function checkCustomerId(value: string): number {
  if (isBlank(value)) return codeOf('customer_id.missing')
  return NO_ISSUE
}

function checkFirstName(value: string): number {
  if (isBlank(value)) return codeOf('first_name.missing')
  if (hasSurroundingSpaces(value)) return codeOf('first_name.spaces')
  return NO_ISSUE
}

function checkLastName(value: string): number {
  if (isBlank(value)) return codeOf('last_name.missing')
  if (hasSurroundingSpaces(value)) return codeOf('last_name.spaces')
  return NO_ISSUE
}

function checkEmail(value: string): number {
  if (isBlank(value)) return codeOf('email.missing')
  if (!EMAIL_SHAPE.test(value)) return codeOf('email.invalid')
  return NO_ISSUE
}

function checkSignupDate(value: string): number {
  if (isBlank(value)) return codeOf('signup_date.missing')
  if (!isRealIsoDate(value)) return codeOf('signup_date.invalid')
  return NO_ISSUE
}

function checkCountry(value: string): number {
  if (isBlank(value)) return codeOf('country.missing')
  if (!ISO_ALPHA2.has(value)) return codeOf('country.invalid')
  return NO_ISSUE
}

function checkPlan(value: string): number {
  if (isBlank(value)) return codeOf('plan.missing')
  if (!PLANS.has(value)) return codeOf('plan.invalid')
  return NO_ISSUE
}

function checkMonthlySpend(value: string): number {
  if (isBlank(value)) return codeOf('monthly_spend.missing')
  if (PLAIN_NUMBER_SHAPE.test(value)) return NO_ISSUE
  const asNumber = Number(value)
  if (Number.isFinite(asNumber) && asNumber < 0) return codeOf('monthly_spend.negative')
  return codeOf('monthly_spend.invalid')
}

/** The issue code for one cell, or 0 when the value is fine. */
export function validateCell(column: Column, value: string): number {
  switch (column) {
    case 'customer_id':
      return checkCustomerId(value)
    case 'first_name':
      return checkFirstName(value)
    case 'last_name':
      return checkLastName(value)
    case 'email':
      return checkEmail(value)
    case 'signup_date':
      return checkSignupDate(value)
    case 'country':
      return checkCountry(value)
    case 'plan':
      return checkPlan(value)
    case 'monthly_spend':
      return checkMonthlySpend(value)
  }
}

/** Issue codes for every cell of a row, in COLUMNS order. Pass `into` to reuse an array. */
export function validateRow(row: Row, into: Uint8Array = new Uint8Array(COLUMNS.length)): Uint8Array {
  for (let c = 0; c < COLUMNS.length; c++) {
    into[c] = validateCell(COLUMNS[c], row[c])
  }
  return into
}
