import { useEffect } from 'react'
import { undoLastChange } from '../actions'

/** Cmd/Ctrl+Z undoes the last change, unless the user is typing in a field. */
export function useUndoShortcut(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isTyping = (e.target as HTMLElement | null)?.tagName === 'INPUT'
      const isUndo = (e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z'
      if (!isUndo || isTyping) return
      e.preventDefault()
      undoLastChange()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
