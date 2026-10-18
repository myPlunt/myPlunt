import { useEffect, useState } from 'react'

import PageHeader from '../components/PageHeader'
import PendingSpeciesCard from '../components/species/PendingSpeciesCard'
import SpeciesCard from '../components/species/SpeciesCard'
import { ApiError } from '../lib/api'
import { getApprovedSpecies, getPendingSpecies, type PendingSpecies, type Species } from '../lib/species'

type Result = { pending?: PendingSpecies[]; approved?: Species[]; error?: string }
type Tab = 'pending' | 'approved'

// Case- and accent-insensitive, so "acer" finds "Acér" too.
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function matches(species: { commonName: string; scientificName: string }, query: string): boolean {
  const q = normalize(query.trim())
  return normalize(species.commonName).includes(q) || normalize(species.scientificName).includes(q)
}

function SpeciesPage() {
  const [result, setResult] = useState<Result | null>(null)
  const [tab, setTab] = useState<Tab>('pending')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([getPendingSpecies(), getApprovedSpecies()])
      .then(([pending, approved]) => !cancelled && setResult({ pending, approved }))
      .catch((err) => {
        if (!cancelled) setResult({ error: err instanceof ApiError ? err.message : "Can't reach the server." })
      })
    return () => {
      cancelled = true
    }
  }, [])

  // An approved species joins the approved list right away instead of waiting for a reload.
  function moveReviewed(reviewed: PendingSpecies, approved: boolean) {
    setResult((current) => ({
      pending: current?.pending?.filter((item) => item.id !== reviewed.id),
      approved: approved
        ? [...(current?.approved ?? []), { ...reviewed, common: false }].sort((a, b) =>
            a.commonName.localeCompare(b.commonName),
          )
        : current?.approved,
    }))
  }

  const pending = result?.pending?.filter((item) => matches(item, query))
  const approved = result?.approved?.filter((item) => matches(item, query))
  const shown = tab === 'pending' ? pending : approved
  const tabs = [
    { id: 'pending' as const, label: 'Waiting for approval', count: result?.pending?.length },
    { id: 'approved' as const, label: 'Approved', count: result?.approved?.length },
  ]

  return (
    <>
      <PageHeader title="Species" />

      {result?.error && (
        <p role="alert" className="text-sm font-semibold text-soil">
          {result.error}
        </p>
      )}

      {shown && (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div role="tablist" aria-label="Species lists" className="flex gap-1 self-start rounded-full bg-cream p-1">
              {tabs.map((item) => {
                const selected = tab === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`${item.id}-tab`}
                    aria-selected={selected}
                    aria-controls="species-panel"
                    onClick={() => setTab(item.id)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      selected ? 'bg-green text-white' : 'text-green hover:bg-sand'
                    }`}
                  >
                    {item.label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${selected ? 'bg-leaf text-white' : 'bg-sand text-soil'}`}
                    >
                      {item.count}
                    </span>
                  </button>
                )
              })}
            </div>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or scientific name"
              aria-label="Search species"
              className="w-full rounded-full border border-sand bg-white px-4 py-2 text-sm text-charcoal outline-none focus:border-leaf sm:w-80"
            />
          </div>

          <div id="species-panel" role="tabpanel" aria-labelledby={`${tab}-tab`}>
            {shown.length === 0 ? (
              <p className="rounded-3xl bg-cream p-6 text-sm text-ink shadow-card">
                {query.trim()
                  ? `No species match "${query.trim()}".`
                  : tab === 'pending'
                    ? 'No species are waiting for approval.'
                    : 'No species have been approved yet.'}
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tab === 'pending'
                  ? pending?.map((item) => <PendingSpeciesCard key={item.id} species={item} onReviewed={moveReviewed} />)
                  : approved?.map((item) => <SpeciesCard key={item.id} {...item} />)}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  )
}

export default SpeciesPage
