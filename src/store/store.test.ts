import { test, expect, beforeEach } from 'vitest'
import { store, reset, appendBatch, bump, subscribe } from './store'

const row = (id: string) => [id, 'a', 'b', 'c', 'd', 'e', 'f', 'g']

beforeEach(() => reset())

test('appendBatch accumulates rows across batches', () => {
  appendBatch([row('C-1')])
  appendBatch([row('C-2'), row('C-3')])
  expect(store.rowCount).toBe(3)
  expect(store.rows[2][0]).toBe('C-3')
})

test('subscribers are notified once per bump, and not after unsubscribing', () => {
  let n = 0
  const off = subscribe(() => n++)
  appendBatch([row('C-1')])
  expect(n).toBe(0)
  bump()
  expect(n).toBe(1)
  off()
  bump()
  expect(n).toBe(1)
})

test('reset clears rows and loading state', () => {
  appendBatch([row('C-1')])
  store.loading.status = 'done'
  reset()
  expect(store.rowCount).toBe(0)
  expect(store.rows).toHaveLength(0)
  expect(store.loading.status).toBe('idle')
})
