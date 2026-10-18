import { useState } from 'react'

import { ApiError } from '../../lib/api'
import { approveSpecies, rejectSpecies, type PendingSpecies } from '../../lib/species'
import SpeciesCard from './SpeciesCard'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

type PendingSpeciesCardProps = {
  species: PendingSpecies
  // Called once the species is approved or rejected, so the page can move it out of the list.
  onReviewed: (species: PendingSpecies, approved: boolean) => void
}

function PendingSpeciesCard({ species, onReviewed }: PendingSpeciesCardProps) {
  const [busy, setBusy] = useState(false)
  const [confirmingReject, setConfirmingReject] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function review(action: (id: string) => Promise<void>, approved: boolean) {
    setBusy(true)
    setError(null)
    try {
      await action(species.id)
      onReviewed(species, approved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Can't reach the server.")
      setBusy(false)
      setConfirmingReject(false)
    }
  }

  return (
    <SpeciesCard {...species}>
      <p className="mt-auto border-t border-sand pt-3 text-sm text-ink">
        {species.submittedBy ? (
          <>
            Submitted by <span className="font-semibold text-charcoal">@{species.submittedBy}</span>
          </>
        ) : (
          'Submitted by a deleted account'
        )}{' '}
        on {formatDate(species.submittedAt)}
      </p>
      {error && (
        <p role="alert" className="text-sm font-semibold text-soil">
          {error}
        </p>
      )}
      {/* Rejecting deletes the submission, so it asks once more before doing it. */}
      <div className="flex gap-2">
        {confirmingReject ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => review(rejectSpecies, false)}
              className="flex-1 rounded-full bg-charcoal px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              Yes, reject
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmingReject(false)}
              className="flex-1 rounded-full border border-green px-4 py-2 text-sm font-semibold text-green transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => review(approveSpecies, true)}
              className="flex-1 rounded-full bg-green px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmingReject(true)}
              className="flex-1 rounded-full border border-green px-4 py-2 text-sm font-semibold text-green transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}
      </div>
    </SpeciesCard>
  )
}

export default PendingSpeciesCard
