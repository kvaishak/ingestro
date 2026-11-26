import type { Row } from '../validation/columns'

export interface LoadingState {
  status: 'idle' | 'loading' | 'done' | 'error'
  rowsLoaded: number
  bytesRead: number
  bytesTotal: number
  message?: string
}

/**
 * The single source of truth, deliberately outside React.
 * Rows never move once appended: every other structure refers to a row by its position.
 * React components subscribe to `version` and re-read what they need.
 */
export const store = {
  rows: [] as Row[],
  rowCount: 0,
  /** Row positions to display, in display order. */
  view: new Uint32Array(0) as Uint32Array<ArrayBufferLike>,
  loading: idleLoading(),
  version: 0,
}

function idleLoading(): LoadingState {
  return { status: 'idle', rowsLoaded: 0, bytesRead: 0, bytesTotal: 0 }
}

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

export function reset(): void {
  store.rows = []
  store.rowCount = 0
  store.view = new Uint32Array(0)
  store.loading = idleLoading()
  bump()
}

export function appendBatch(rows: Row[]): void {
  for (const r of rows) store.rows.push(r)
  store.rowCount += rows.length
}
