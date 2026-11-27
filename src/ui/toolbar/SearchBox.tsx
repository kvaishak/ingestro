import { useEffect, useRef, useState } from 'react'
import { query } from '../../store/query'
import { isLoaded } from '../../store/store'
import { setSearch } from '../actions'

/** Wait this long after the last keystroke before scanning every row. */
const DEBOUNCE_MS = 200

/**
 * Search across all columns, debounced.
 * Typing while a scan is pending replaces the pending scan; it never stacks.
 * Clearing the box applies immediately: an empty search restores the full list without a scan.
 */
export function SearchBox() {
  const ready = isLoaded()
  const [text, setText] = useState(query.search)
  const timer = useRef<number | null>(null)

  const cancelPending = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }

  useEffect(() => cancelPending, [])

  const onChange = (value: string) => {
    setText(value)
    cancelPending()
    if (value.trim() === '') {
      setSearch('')
      return
    }
    timer.current = window.setTimeout(() => {
      timer.current = null
      setSearch(value)
    }, DEBOUNCE_MS)
  }

  return (
    <input
      type="search"
      className="search"
      placeholder={ready ? 'Search all columns…' : 'Search is available once loading finishes'}
      value={text}
      disabled={!ready}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search all columns"
    />
  )
}
