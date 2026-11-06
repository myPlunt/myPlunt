import { useState } from 'react'

import { ApiError } from '../../lib/api'
import { importSpecies } from '../../lib/species'

type ImportSpeciesFormProps = {
  onImported: () => void
}

// Pages already imported cost one request each, so moving on to nextPage saves the free plan's quota.
function ImportSpeciesForm({ onImported }: ImportSpeciesFormProps) {
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function run() {
    setBusy(true)
    setMessage(null)
    try {
      const result = await importSpecies(page)
      const done = `Imported ${result.imported}, skipped ${result.skipped}.`
      if (result.limitReached) setMessage(`${done} Daily Perenual limit reached: continue page ${page} tomorrow.`)
      else if (result.nextPage === null) setMessage(`${done} That was the last page.`)
      else setMessage(done)
      if (result.nextPage !== null) setPage(result.nextPage)
      if (result.imported > 0) onImported()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Can't reach the server.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-cream p-4 shadow-card sm:flex-row sm:items-center">
      <label className="flex items-center gap-2 text-sm font-semibold text-green">
        Perenual page
        <input
          type="number"
          min={1}
          value={page}
          onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))}
          className="w-20 rounded-full border border-sand bg-white px-3 py-1.5 text-sm text-charcoal outline-none focus:border-leaf"
        />
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={run}
        className="rounded-full bg-green px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {busy ? 'Importing…' : 'Import species'}
      </button>
      {message && (
        <p role="status" className="text-sm text-ink">
          {message}
        </p>
      )}
    </div>
  )
}

export default ImportSpeciesForm
