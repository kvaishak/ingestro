import { DUPLICATE_CHECKS } from '../validation/duplicates'
import type { DuplicatePositions } from '../worker/protocol'
import { store } from './store'

/** Write the duplicate code into the overlays at the positions the worker found. */
export function applyDuplicatePositions(duplicates: DuplicatePositions): void {
  for (const check of DUPLICATE_CHECKS) {
    const columnFlags = store.flags[check.columnIndex]
    for (const position of duplicates[check.column]) columnFlags[position] = check.duplicateCode
  }
}
