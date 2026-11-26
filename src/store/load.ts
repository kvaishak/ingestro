import type { WorkerIn, WorkerOut } from '../worker/protocol'
import { store, reset, appendBatch, positionsInFileOrder, bump } from './store'
import { buildView, resetQuery } from './query'
import { recount } from './counts'
import { applyDuplicatePositions } from './duplicateMarks'
import { resetHistory } from './changes'

let worker: Worker | null = null

/**
 * Load a CSV through the parse worker.
 * Per-cell validation happens in the worker batch by batch; the duplicate check (the one rule
 * that needs every row) also runs in the worker once parsing is complete. The main thread only
 * appends rows, writes the duplicate marks it is handed, and counts.
 */
export function loadFile(file: File | Blob): void {
  worker?.terminate()
  reset()
  resetQuery()
  resetHistory()
  store.loading = { status: 'loading', rowsLoaded: 0, bytesRead: 0, bytesTotal: file.size }
  bump()

  worker = new Worker(new URL('../worker/parse.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (e: MessageEvent<WorkerOut>) => {
    const msg = e.data
    switch (msg.type) {
      case 'batch': return onBatch(msg)
      case 'parsed': return onParsed()
      case 'done': return onDone(msg)
      case 'error': return onError(msg.message)
    }
  }
  worker.onerror = (e) => onError(e.message || 'Could not read the file.')

  const msg: WorkerIn = { type: 'parse', file }
  worker.postMessage(msg)
}

function onBatch(msg: Extract<WorkerOut, { type: 'batch' }>): void {
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

function onDone(msg: Extract<WorkerOut, { type: 'done' }>): void {
  stopWorker()
  applyDuplicatePositions(msg.duplicates)
  recount()
  store.loading.status = 'done'
  store.view = buildView()
  bump()
}

function onError(message: string): void {
  stopWorker()
  store.loading.status = 'error'
  store.loading.message = message
  bump()
}

function stopWorker(): void {
  worker?.terminate()
  worker = null
}
