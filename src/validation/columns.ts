export const COLUMNS = [
  'customer_id',
  'first_name',
  'last_name',
  'email',
  'signup_date',
  'country',
  'plan',
  'monthly_spend',
] as const

export type Column = (typeof COLUMNS)[number]

/** A data row: always exactly 8 strings, in COLUMNS order. */
export type Row = string[]

export const COLUMN_COUNT = COLUMNS.length

export const COLUMN_LABEL: Record<Column, string> = {
  customer_id: 'Customer ID',
  first_name: 'First name',
  last_name: 'Last name',
  email: 'Email',
  signup_date: 'Signup date',
  country: 'Country',
  plan: 'Plan',
  monthly_spend: 'Monthly spend',
}

export function columnIndex(column: Column): number {
  return COLUMNS.indexOf(column)
}
