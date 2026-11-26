import Papa from 'papaparse'
import type { WorkerIn, WorkerOut } from './protocol'
import { rowsFromChunk } from './rowsFromChunk'

const CHUNK_BYTES = 1 << 20 // ~1 MB of CSV per batch, roughly 12k rows

const post = (msg: WorkerOut, transfer: Transferable[] = []) =>
  (self as unknown as Worker).postMessage(msg, transfer)

self.onmessage = (e: MessageEvent<WorkerIn>) => {
  if (e.data.type !== 'parse') return
  const file = e.data.file
  let first = true
  let rowCount = 0

  // PapaParse's typings name File only; at runtime it reads any Blob via FileReader.
  Papa.parse<string[]>(file as File, {
    chunkSize: CHUNK_BYTES,
    skipEmptyLines: true,
    chunk(results) {
      const rows = rowsFromChunk(results.data, first)
      first = false
      rowCount += rows.length
      post({ type: 'batch', rows, bytesRead: results.meta.cursor, bytesTotal: file.size })
    },
    complete() {
      post({ type: 'done', rowCount })
    },
    error(err) {
      post({ type: 'error', message: err.message })
    },
  })
}
