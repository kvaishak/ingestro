import { useRef, type ChangeEvent } from 'react'
import { loadFile, fetchCsv } from '../../store/load'

/** The first screen: pick a CSV from disk, or try the bundled sample. */
export function FilePicker() {
  const input = useRef<HTMLInputElement>(null)

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) loadFile(f)
  }

  const loadSample = () => fetchCsv('sample.csv')

  return (
    <div className="center">
      <div className="card">
        <h1>Import Data</h1>
        <p>Pick the CSV. We'll check every row for problems and help you fix them.</p>
        <div className="drop">
          <div>Choose <b>import-data.csv</b> from your computer</div>
          <div className="actions">
            <button className="btn primary" onClick={() => input.current?.click()}>Choose file</button>
            <button className="btn" onClick={loadSample}>Try with sample data</button>
          </div>
          <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={onChange} />
        </div>
      </div>
    </div>
  )
}
