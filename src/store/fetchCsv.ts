import { loadFile } from './load'
import { store, bump } from './store'

/** Fetch a CSV from /public and load it; refuses HTML fallbacks so a wrong path cannot parse as data. */
export async function fetchCsv(name: string): Promise<void> {
  const res = await fetch(`/${name}`)
  const type = res.headers.get('content-type') ?? ''
  if (!res.ok || type.includes('text/html')) {
    store.loading = { status: 'error', rowsLoaded: 0, bytesRead: 0, bytesTotal: 0, message: `${name} was not found.` }
    bump()
    return
  }
  loadFile(await res.blob())
}
