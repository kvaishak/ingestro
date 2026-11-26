/**
 * Small UI-only state that is not part of the data: which cell is being edited, and the
 * current toast. Kept outside React state so any component can read it after a bump.
 */
import { bump } from '../store/store'

export interface EditingCell {
  row: number
  col: number
}

export interface Toast {
  text: string
  /** Present while an undo is still possible from this toast. */
  canUndo: boolean
}

export const session = {
  editing: null as EditingCell | null,
  toast: null as Toast | null,
}

let toastTimer: number | null = null
const TOAST_MS = 6000

export function startEditing(row: number, col: number): void {
  session.editing = { row, col }
  bump()
}

export function stopEditing(): void {
  session.editing = null
  bump()
}

export function showToast(text: string, canUndo: boolean): void {
  session.toast = { text, canUndo }
  if (toastTimer !== null) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(hideToast, TOAST_MS)
  bump()
}

export function hideToast(): void {
  session.toast = null
  if (toastTimer !== null) window.clearTimeout(toastTimer)
  toastTimer = null
  bump()
}
