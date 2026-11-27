import Papa from 'papaparse'
import type { Row } from '../validation/columns'
import { validateRows } from '../validation/rules'
import { DUPLICATE_CHECKS, positionsWithRepeatedValues } from '../validation/duplicates'
import type { DuplicatePositions, WorkerIn, WorkerOut } from './protocol'
import { rowsFromChunk } from './rowsFromChunk'

const CHUNK_BYTES = 1 << 20 // ~1 MB of CSV per batch, roughly 12k rows

const post = (msg: WorkerOut, transfer: Transferable[] = []) =>
  (self as unknown as Worker).postMessage(msg, transfer)

/**
 * The duplicate check needs every row, so the worker keeps just the two checked columns
 * (email and customer ID) while batches stream out, and runs the check once at the end.
 * A cell that already has another issue is kept as null so it never counts as a duplicate.
 */
class DuplicateCollector {
  private values: Record<'email' | 'customer_id', (string | null)[]> = { email: [], customer_id: [] }

  add(rows: Row[], flags: Uint8Array[]): void {
    for (const check of DUPLICATE_CHECKS) {
      const column = check.columnIndex
      const list = this.values[check.column]
      for (let i = 0; i < rows.length; i++) {
        list.push(flags[column][i] === 0 ? rows[i][column] : null)
      }
    }
  }

  result(): DuplicatePositions {
    return {
      email: Uint32Array.from(positionsWithRepeatedValues(this.values.email)),
      customer_id: Uint32Array.from(positionsWithRepeatedValues(this.values.customer_id)),
    }
  }
}

self.onmessage = (e: MessageEvent<WorkerIn>) => {
  if (e.data.type !== 'parse') return
  const file = e.data.file
  const duplicates = new DuplicateCollector()
  let isFirstChunk = true
  let rowCount = 0

  // PapaParse's typings name File only; at runtime it reads any Blob via FileReader.
  Papa.parse<string[]>(file as File, {
    chunkSize: CHUNK_BYTES,
    skipEmptyLines: true,
    chunk(results) {
      const rows = rowsFromChunk(results.data, isFirstChunk)
      isFirstChunk = false
      rowCount += rows.length
      const flags = validateRows(rows) // reads only, never changes a value
      duplicates.add(rows, flags)
      post(
        { type: 'batch', rows, flags, bytesRead: results.meta.cursor, bytesTotal: file.size },
        flags.map((f) => f.buffer), // hand the buffers over instead of copying them
      )
    },
    complete() {
      post({ type: 'parsed', rowCount })
      const found = duplicates.result()
      post({ type: 'done', rowCount, duplicates: found }, [found.email.buffer, found.customer_id.buffer])
    },
    error(err) {
      post({ type: 'error', message: err.message })
    },
  })
}
