import { useState } from 'react'

import { ApiError } from '../../lib/api'
import { importSpecies, rejectAllPendingSpecies } from '../../lib/species'

type ImportSpeciesFormProps = {
  pendingCount: number
  onChanged: () => void
}

const PAGE_KEY = 'perenual-next-page'

// Where the last import stopped, so the next one doesn't spend requests re-reading pages already done.
function savedPage(): number {
  try {
    return Number(localStorage.getItem(PAGE_KEY)) || 1
  } catch {
    return 1
  }
}

function savePage(page: number) {
  try {
    localStorage.setItem(PAGE_KEY, String(page))
  } catch {
    // Starting from page 1 next time only costs a few extra requests.
  }
}

function ImportSpeciesForm({ pendingCount, onChanged }: ImportSpeciesFormProps) {
  const [count, setCount] = useState(1)
  const [busy, setBusy] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function run(action: () => Promise<string>) {
    setBusy(true)
    setMessage(null)
    try {
      setMessage(await action())
      onChanged()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Can't reach the server.")
    } finally {
      setBusy(false)
      setConfirmingDelete(false)
    }
  }

  const runImport = () =>
    run(async () => {
      const result = await importSpecies(count, savedPage())
      if (result.nextPage !== null) savePage(result.nextPage)
      const done = `Imported ${result.imported} species.`
      if (result.limitReached) return `${done} Perenual's daily limit is reached: try again tomorrow.`
      if (result.nextPage === null) return `${done} That was Perenual's last page.`
      return done
    })

  // Back to page 1 too, so the deleted species can be imported again.
  const runDeleteAll = () =>
    run(async () => {
      await rejectAllPendingSpecies()
      savePage(1)
      return 'Deleted every species waiting for approval.'
    })

  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-cream p-4 shadow-card sm:flex-row sm:flex-wrap sm:items-center">
      <label className="flex items-center gap-2 text-sm font-semibold text-green">
        Species to import
        <input
          type="number"
          min={1}
          max={100}
          value={count}
          onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
          className="w-20 rounded-full border border-sand bg-white px-3 py-1.5 text-sm text-charcoal outline-none focus:border-leaf"
        />
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={runImport}
        className="rounded-full bg-green px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {busy ? 'Working…' : 'Import from Perenual'}
      </button>
      {confirmingDelete ? (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={runDeleteAll}
            className="rounded-full bg-charcoal px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            Yes, delete {pendingCount}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmingDelete(false)}
            className="rounded-full border border-green px-4 py-2 text-sm font-semibold text-green transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={busy || pendingCount === 0}
          onClick={() => setConfirmingDelete(true)}
          className="rounded-full border border-green px-4 py-2 text-sm font-semibold text-green transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          Delete all waiting
        </button>
      )}
      {message && (
        <p role="status" className="text-sm text-ink">
          {message}
        </p>
      )}
    </div>
  )
}

export default ImportSpeciesForm
