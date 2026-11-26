import type { Row } from '../validation/columns'

export type WorkerIn = { type: 'parse'; file: File | Blob }

/** Row positions (file order) that hold a repeated value, per checked column. */
export interface DuplicatePositions {
  email: Uint32Array
  customer_id: Uint32Array
}

export type WorkerOut =
  | {
      type: 'batch'
      rows: Row[]
      /** One Uint8Array per column, rows.length long: the issue codes for this batch. */
      flags: Uint8Array[]
      bytesRead: number
      bytesTotal: number
    }
  /** Every row has been sent; the worker is now running the duplicate check. */
  | { type: 'parsed'; rowCount: number }
  | { type: 'done'; rowCount: number; duplicates: DuplicatePositions }
  | { type: 'error'; message: string }
