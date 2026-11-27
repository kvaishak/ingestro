import { columnIndex, type Row } from './columns'
import { codeOf } from './catalog'

/**
 * Cross-row rule: a value that appears in more than one row is a duplicate in every row it appears in.
 * Checked for email and customer ID.
 *
 * Two entry points share one core:
 *  - positionsWithRepeatedValues(): the core. Used by the worker at the end of loading (keeps the
 *    main thread free) and by markDuplicates().
 *  - markDuplicates(): main-thread version over the store's rows and flags, rerun after every edit.
 *
 * A row is left out when its cell already has another issue (an invalid email cannot also be a duplicate).
 */

export const DUPLICATE_CHECKS = [
  { column: 'email', columnIndex: columnIndex('email'), duplicateCode: codeOf('email.duplicate') },
  { column: 'customer_id', columnIndex: columnIndex('customer_id'), duplicateCode: codeOf('customer_id.duplicate') },
] as const

/** Is this column one of the duplicate-checked ones? Changing such a cell means re-running the check. */
export function isDuplicateChecked(columnIndex: number): boolean {
  return DUPLICATE_CHECKS.some((check) => check.columnIndex === columnIndex)
}

/**
 * Positions whose value occurs more than once. `null` means "do not consider this position".
 * Order: grouped by value, in order of first appearance.
 */
export function positionsWithRepeatedValues(values: (string | null)[]): number[] {
  const positionsByValue = new Map<string, number[]>()
  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    if (value === null) continue
    const group = positionsByValue.get(value)
    if (group) group.push(i)
    else positionsByValue.set(value, [i])
  }

  const repeated: number[] = []
  for (const group of positionsByValue.values()) {
    if (group.length > 1) repeated.push(...group)
  }
  return repeated
}

export function markDuplicates(rows: Row[], rowCount: number, flags: Uint8Array[]): void {
  for (const check of DUPLICATE_CHECKS) {
    const columnFlags = flags[check.columnIndex]
    clearStaleDuplicateMarks(columnFlags, rowCount, check.duplicateCode)

    const values = valuesToCheck(rows, rowCount, check.columnIndex, columnFlags)
    for (const i of positionsWithRepeatedValues(values)) columnFlags[i] = check.duplicateCode
  }
}

function clearStaleDuplicateMarks(columnFlags: Uint8Array, rowCount: number, duplicateCode: number): void {
  for (let i = 0; i < rowCount; i++) {
    if (columnFlags[i] === duplicateCode) columnFlags[i] = 0
  }
}

/** The column's values, with null where the row must not take part in the check. */
function valuesToCheck(rows: Row[], rowCount: number, column: number, columnFlags: Uint8Array): (string | null)[] {
  const values: (string | null)[] = new Array(rowCount)
  for (let i = 0; i < rowCount; i++) {
    const hasOtherIssue = columnFlags[i] !== 0
    values[i] = hasOtherIssue ? null : rows[i][column]
  }
  return values
}
