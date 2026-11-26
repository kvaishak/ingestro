import type { WorkerIn, WorkerOut } from '../worker/protocol'
import { store, reset, appendBatch, positionsInFileOrder, bump } from './store'
import { buildView, resetQuery } from './query'

let worker: Worker | null = null

export function loadFile(file: File | Blob): void {
  worker?.terminate()
  reset()
  resetQuery()
  store.loading = { status: 'loading', rowsLoaded: 0, bytesRead: 0, bytesTotal: file.size }
  bump()

  worker = new Worker(new URL('../worker/parse.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (e: MessageEvent<WorkerOut>) => {
    const msg = e.data
    if (msg.type === 'batch') {
      appendBatch(msg.rows)
      store.loading.rowsLoaded = store.rowCount
      store.loading.bytesRead = msg.bytesRead
      store.loading.bytesTotal = msg.bytesTotal
      store.view = positionsInFileOrder() // grid is usable while loading
      bump()
    } else if (msg.type === 'done') {
      store.loading.status = 'done'
      store.view = buildView()
      bump()
      worker?.terminate()
      worker = null
    } else {
      store.loading.status = 'error'
      store.loading.message = msg.message
      bump()
      worker?.terminate()
      worker = null
    }
  }
  worker.onerror = (e) => {
    store.loading.status = 'error'
    store.loading.message = e.message || 'Could not read the file.'
    bump()
  }


  const msg: WorkerIn = { type: 'parse', file }
  worker.postMessage(msg)
}
