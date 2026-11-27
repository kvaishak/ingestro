import type { BatchMessage, DoneMessage, DuplicatePositions, WorkerIn, WorkerOut } from '../worker/protocol'
import { DUPLICATE_CHECKS } from '../validation/duplicates'
import { store, reset, appendBatch, positionsInFileOrder, bump } from './store'
import { buildView, resetQuery } from './query'
import { recount } from './counts'
import { resetHistory } from './changes'

/**
 * Loading a CSV, start to finish.
 *
 * Per-cell validation happens in the worker batch by batch; the duplicate check (the one rule
 * that needs every row) also runs in the worker once parsing is complete. The main thread only
 * appends rows, writes the duplicate marks it is handed, and counts.
 *
 * Status goes: idle -> loading -> checking -> done, or -> error at any point.
 */

let worker: Worker | null = null
let startedAt = 0

export function loadFile(file: File | Blob): void {
  worker?.terminate()
  reset()
  resetQuery()
  resetHistory()
  store.loading = { status: 'loading', rowsLoaded: 0, bytesRead: 0, bytesTotal: file.size }
  startedAt = performance.now()
  bump()

  worker = new Worker(new URL('../worker/parse.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (e: MessageEvent<WorkerOut>) => {
    const msg = e.data
    switch (msg.type) {
      case 'batch': return onBatch(msg)
      case 'parsed': return onParsed()
      case 'done': return onDone(msg)
      case 'error': return failLoading(msg.message)
    }
  }
  worker.onerror = (e) => failLoading(e.message || 'Could not read the file.')

  const msg: WorkerIn = { type: 'parse', file }
  worker.postMessage(msg)
}

/** Fetch a CSV from /public and load it; refuses HTML fallbacks so a wrong path cannot parse as data. */
export async function fetchCsv(name: string): Promise<void> {
  const res = await fetch(`/${name}`)
  const type = res.headers.get('content-type') ?? ''
  if (!res.ok || type.includes('text/html')) {
    failLoading(`${name} was not found.`)
    return
  }
  loadFile(await res.blob())
}

/** Stop loading and show the message to the user. */
function failLoading(message: string): void {
  stopWorker()
  store.loading.status = 'error'
  store.loading.message = message
  bump()
}

/** Write the duplicate code into the overlays at the positions the worker found. */
export function applyDuplicatePositions(duplicates: DuplicatePositions): void {
  for (const check of DUPLICATE_CHECKS) {
    const columnFlags = store.flags[check.columnIndex]
    for (const position of duplicates[check.column]) columnFlags[position] = check.duplicateCode
  }
}

// ---- worker messages ----

function onBatch(msg: BatchMessage): void {
  appendBatch(msg.rows, msg.flags)
  store.loading.rowsLoaded = store.rowCount
  store.loading.bytesRead = msg.bytesRead
  store.loading.bytesTotal = msg.bytesTotal
  store.view = positionsInFileOrder() // grid is usable while loading
  bump()
}

function onParsed(): void {
  store.loading.status = 'checking'
  bump()
}

function onDone(msg: DoneMessage): void {
  stopWorker()
  applyDuplicatePositions(msg.duplicates)
  recount()
  store.loading.status = 'done'
  store.loading.seconds = (performance.now() - startedAt) / 1000
  store.view = buildView()
  bump()
}

function stopWorker(): void {
  worker?.terminate()
  worker = null
}
