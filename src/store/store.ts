import { COLUMNS, type Row } from '../validation/columns'

export interface LoadingState {
  /** 'checking' = all rows are in, the duplicate pass is running */
  status: 'idle' | 'loading' | 'checking' | 'done' | 'error'
  rowsLoaded: number
  bytesRead: number
  bytesTotal: number
  message?: string
}

/** Overlays start with room for this many rows and double whenever a batch does not fit. */
const INITIAL_CAPACITY = 65_536

/**
 * The single source of truth, deliberately outside React.
 *
 * Rows never move once appended: every other structure refers to a row by its position.
 * The overlays are parallel arrays indexed by that same position:
 *   flags[column][row]    = issue code for that cell, 0 = fine (see validation/catalog.ts)
 *   changed[column][row]  = 1 when the cell differs from the value that was loaded
 * React components subscribe to `version` and re-read what they need.
 */
export const store = {
  rows: [] as Row[],
  rowCount: 0,

  /** One byte per cell per column: the issue code. Capacity may exceed rowCount. */
  flags: emptyOverlays(),
  /** One byte per cell per column: 1 when the user changed the cell. Same capacity as flags. */
  changed: emptyOverlays(),

  /** Problems per issue key, e.g. 'email.missing' -> 1234. Rebuilt by recount(). */
  counts: new Map<string, number>(),
  /** Cells with any issue, and rows with at least one issue. Rebuilt by recount(). */
  problemCells: 0,
  problemRows: 0,

  /** Row positions to display, in display order. */
  view: new Uint32Array(0) as Uint32Array<ArrayBufferLike>,
  loading: idleLoading(),
  version: 0,
}

function emptyOverlays(): Uint8Array[] {
  return COLUMNS.map(() => new Uint8Array(INITIAL_CAPACITY))
}

function idleLoading(): LoadingState {
  return { status: 'idle', rowsLoaded: 0, bytesRead: 0, bytesTotal: 0 }
}

// ---- subscriptions ----

const listeners = new Set<() => void>()

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Signal "something changed". Call once per batch of mutations, not per cell. */
export function bump(): void {
  store.version++
  for (const fn of listeners) fn()
}

// ---- mutation ----

export function reset(): void {
  store.rows = []
  store.rowCount = 0
  store.flags = emptyOverlays()
  store.changed = emptyOverlays()
  store.counts = new Map()
  store.problemCells = 0
  store.problemRows = 0
  store.view = new Uint32Array(0)
  store.loading = idleLoading()
  bump()
}

/**
 * Append a parsed batch and its issue flags (one Uint8Array per column, batch-length long).
 * Flags may be omitted while a caller has not validated yet; the cells then read as "fine".
 */
export function appendBatch(rows: Row[], flags?: Uint8Array[]): void {
  const start = store.rowCount
  ensureOverlayCapacity(start + rows.length)

  for (const row of rows) store.rows.push(row)
  if (flags) {
    for (let c = 0; c < COLUMNS.length; c++) store.flags[c].set(flags[c], start)
  }
  store.rowCount = start + rows.length
}

/** The view for "no search, no sort": every row, in the order it appeared in the file. */
export function positionsInFileOrder(): Uint32Array {
  const v = new Uint32Array(store.rowCount)
  for (let i = 0; i < v.length; i++) v[i] = i
  return v
}

function ensureOverlayCapacity(needed: number): void {
  const current = store.flags[0].length
  if (needed <= current) return
  let capacity = current
  while (capacity < needed) capacity *= 2
  store.flags = store.flags.map((old) => grow(old, capacity))
  store.changed = store.changed.map((old) => grow(old, capacity))
}

function grow(old: Uint8Array, capacity: number): Uint8Array {
  const grown = new Uint8Array(capacity)
  grown.set(old)
  return grown
}
