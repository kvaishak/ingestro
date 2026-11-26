import type { Row } from '../validation/columns'

export type WorkerIn = { type: 'parse'; file: File | Blob }

export type WorkerOut =
  | {
      type: 'batch'
      rows: Row[]
      /** One Uint8Array per column, rows.length long. Filled from Stage 2 onwards. */
      flags?: Uint8Array[]
      bytesRead: number
      bytesTotal: number
    }
  | { type: 'done'; rowCount: number }
  | { type: 'error'; message: string }
