import { columnIndex, type Row } from './columns'
import { codeOf } from './catalog'

/**
 * Cross-row rule: a value that appears in more than one row is a duplicate in every row it appears in.
 * Checked for email and customer ID. One full pass over the rows, safe to rerun after any edit.
 *
 * A row is skipped when it is removed, or when its cell already has another issue
 * (an invalid email cannot also be a duplicate).
 */

const DUPLICATE_CHECKS = [
  { columnIndex: columnIndex('email'), duplicateCode: codeOf('email.duplicate') },
  { columnIndex: columnIndex('customer_id'), duplicateCode: codeOf('customer_id.duplicate') },
]

export function markDuplicates(rows: Row[], rowCount: number, flags: Uint8Array[], removed: Uint8Array | null): void {
  for (const check of DUPLICATE_CHECKS) {
    const columnFlags = flags[check.columnIndex]
    clearStaleDuplicateMarks(columnFlags, rowCount, check.duplicateCode)
    const rowsByValue = groupRowsByValue(rows, rowCount, check.columnIndex, columnFlags, removed)
    markRepeatedValues(rowsByValue, columnFlags, check.duplicateCode)
  }
}

function clearStaleDuplicateMarks(columnFlags: Uint8Array, rowCount: number, duplicateCode: number): void {
  for (let i = 0; i < rowCount; i++) {
    if (columnFlags[i] === duplicateCode) columnFlags[i] = 0
  }
}

function groupRowsByValue(
  rows: Row[], rowCount: number, column: number, columnFlags: Uint8Array, removed: Uint8Array | null,
): Map<string, number[]> {
  const rowsByValue = new Map<string, number[]>()
  for (let i = 0; i < rowCount; i++) {
    const hasOtherIssue = columnFlags[i] !== 0
    const isRemoved = removed !== null && removed[i] === 1
    if (hasOtherIssue || isRemoved) continue

    const value = rows[i][column]
    const group = rowsByValue.get(value)
    if (group) group.push(i)
    else rowsByValue.set(value, [i])
  }
  return rowsByValue
}

function markRepeatedValues(rowsByValue: Map<string, number[]>, columnFlags: Uint8Array, duplicateCode: number): void {
  for (const group of rowsByValue.values()) {
    if (group.length < 2) continue
    for (const i of group) columnFlags[i] = duplicateCode
  }
}
