import type { Row } from '../validation/columns'

export type WorkerIn = { type: 'parse'; file: File | Blob }

/** Row positions (file order) that hold a repeated value, per checked column. */
export interface DuplicatePositions {
  email: Uint32Array
  customer_id: Uint32Array
}

/** A chunk of parsed rows with their issue codes. */
export interface BatchMessage {
  type: 'batch'
  rows: Row[]
  /** One Uint8Array per column, rows.length long: the issue codes for this batch. */
  flags: Uint8Array[]
  bytesRead: number
  bytesTotal: number
}

/** Every row has been sent; the worker is now running the duplicate check. */
export interface ParsedMessage {
  type: 'parsed'
  rowCount: number
}

/** The duplicate check is finished: these positions hold a repeated value. */
export interface DoneMessage {
  type: 'done'
  rowCount: number
  duplicates: DuplicatePositions
}

export interface ErrorMessage {
  type: 'error'
  message: string
}

/** Messages from the worker to the main thread, in the order they arrive: batch*, parsed, done (or error). */
export type WorkerOut = BatchMessage | ParsedMessage | DoneMessage | ErrorMessage
