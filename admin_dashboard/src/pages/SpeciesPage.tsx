import { useEffect, useState } from 'react'

import PageHeader from '../components/PageHeader'
import PendingSpeciesCard from '../components/species/PendingSpeciesCard'
import { ApiError } from '../lib/api'
import { getPendingSpecies, type PendingSpecies } from '../lib/species'

type Result = { species?: PendingSpecies[]; error?: string }

function SpeciesPage() {
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    let cancelled = false
    getPendingSpecies()
      .then((species) => !cancelled && setResult({ species }))
      .catch((err) => {
        if (!cancelled) setResult({ error: err instanceof ApiError ? err.message : "Can't reach the server." })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const species = result?.species

  function removeReviewed(id: string) {
    setResult((current) => ({ species: current?.species?.filter((item) => item.id !== id) }))
  }

  return (
    <>
      <PageHeader
        title="Species"
      />

      {result?.error && (
        <p role="alert" className="text-sm font-semibold text-soil">
          {result.error}
        </p>
      )}

      {species && (
        <section className="flex flex-col gap-4" aria-labelledby="pending-heading">
          <h2 id="pending-heading" className="text-lg font-semibold text-green">
            Waiting for approval{' '}
            <span className="ml-1 rounded-full bg-cream px-2.5 py-0.5 text-sm text-soil">{species.length}</span>
          </h2>
          {species.length === 0 ? (
            <p className="rounded-3xl bg-cream p-6 text-sm text-ink shadow-card">
              No species are waiting for approval.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {species.map((item) => (
                <PendingSpeciesCard key={item.id} species={item} onReviewed={removeReviewed} />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  )
}

export default SpeciesPage
