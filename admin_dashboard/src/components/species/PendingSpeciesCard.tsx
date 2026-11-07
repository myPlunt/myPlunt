import { useState } from 'react'

import { ApiError } from '../../lib/api'
import { approveSpecies, rejectSpecies, type PendingSpecies } from '../../lib/species'
import EditSpeciesForm from './EditSpeciesForm'
import SpeciesCard from './SpeciesCard'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

type PendingSpeciesCardProps = {
  species: PendingSpecies
  // Called once the species is approved or rejected, so the page can move it out of the list.
  onReviewed: (species: PendingSpecies, approved: boolean) => void
  regions: string[]
  sunlightOptions: string[]
  onEdited: (species: PendingSpecies) => void
}

const primaryButton =
  'w-full rounded-full bg-green px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButton =
  'flex-1 rounded-full border border-green px-4 py-2 text-sm font-semibold text-green transition-opacity hover:opacity-80 disabled:opacity-50'
const dangerButton =
  'flex-1 rounded-full bg-charcoal px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50'

function PendingSpeciesCard({ species, onReviewed, regions, sunlightOptions, onEdited }: PendingSpeciesCardProps) {
  const [busy, setBusy] = useState(false)
  const [confirmingReject, setConfirmingReject] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Watering drives the app's reminders, so a species can't reach the PluntDex without it.
  const missingWatering = !species.wateringFrequencyDays

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

  if (editing) {
    return (
      <SpeciesCard
        {...species}
        details={
          <EditSpeciesForm
            species={species}
            regions={regions}
            sunlightOptions={sunlightOptions}
            onSaved={(updated) => {
              onEdited(updated)
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
          />
        }
      />
    )
  }

  return (
    <SpeciesCard {...species}>
      <p className="mt-auto border-t border-sand pt-3 text-xs text-ink">
        {species.submittedBy ? (
          <>
            Submitted by <span className="font-semibold text-charcoal">@{species.submittedBy}</span> on{' '}
          </>
        ) : (
          'Added on '
        )}
        {formatDate(species.submittedAt)}
      </p>
      {error && (
        <p role="alert" className="text-sm font-semibold text-soil">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {confirmingReject ? (
          <>
            <p className="text-sm text-charcoal">Reject {species.commonName}? This deletes it.</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => review(rejectSpecies, false)}
                className={dangerButton}
              >
                Yes, reject
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmingReject(false)}
                className={secondaryButton}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={busy || missingWatering}
              title={missingWatering ? 'Set watering with Edit first' : undefined}
              onClick={() => review(approveSpecies, true)}
              className={primaryButton}
            >
              {missingWatering ? 'Set watering to approve' : 'Approve'}
            </button>
            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={() => setEditing(true)} className={secondaryButton}>
                Edit
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmingReject(true)}
                className={secondaryButton}
              >
                Reject
              </button>
            </div>
          </>
        )}
      </div>
    </SpeciesCard>
  )
}

export default PendingSpeciesCard
