import { useState } from 'react'

import { ApiError } from '../../lib/api'
import { approveSpecies, rejectSpecies, type PendingSpecies } from '../../lib/species'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

type PendingSpeciesCardProps = {
  species: PendingSpecies
  // Called once the species is approved or rejected, so the page can drop it from the list.
  onReviewed: (id: string) => void
}

function PendingSpeciesCard({ species, onReviewed }: PendingSpeciesCardProps) {
  const [busy, setBusy] = useState(false)
  const [confirmingReject, setConfirmingReject] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function review(action: (id: string) => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action(species.id)
      onReviewed(species.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Can't reach the server.")
      setBusy(false)
      setConfirmingReject(false)
    }
  }

  const details = [
    { label: 'Region', value: species.region },
    {
      label: 'Watering',
      value: species.wateringFrequencyDays && `Every ${species.wateringFrequencyDays} day${species.wateringFrequencyDays === 1 ? '' : 's'}`,
    },
    { label: 'Sunlight', value: species.sunlightNeeds },
  ]

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl bg-cream shadow-card">
      {species.imageUrl ? (
        <img src={species.imageUrl} alt={species.commonName} className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-sand text-sm text-ink">No picture</div>
      )}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <header className="flex flex-col gap-0.5">
          <h2 className="text-lg font-semibold text-green">{species.commonName}</h2>
          <p className="text-sm text-ink italic">{species.scientificName}</p>
        </header>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          {details.map((detail) => (
            <div key={detail.label} className="contents">
              <dt className="text-xs font-semibold tracking-wider text-soil uppercase">{detail.label}</dt>
              <dd className="text-charcoal">{detail.value || '—'}</dd>
            </div>
          ))}
        </dl>
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
                onClick={() => review(rejectSpecies)}
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
                onClick={() => review(approveSpecies)}
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
      </div>
    </article>
  )
}

export default PendingSpeciesCard
