import { COLUMNS, type Column, type Row } from './columns'

const base: Record<Column, string> = {
  customer_id: 'C-1', first_name: 'Anna', last_name: 'Müller', email: 'a@b.co',
  signup_date: '2024-01-02', country: 'DE', plan: 'pro', monthly_spend: '10',
}

/** A clean row with optional overrides, for tests. */
export const row = (o: Partial<Record<Column, string>> = {}): Row => COLUMNS.map((c) => o[c] ?? base[c])
