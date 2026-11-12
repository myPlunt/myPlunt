import { useEffect, useState } from 'react'

import Card from '../components/logs/Card'
import PageHeader from '../components/PageHeader'
import WorldMap from '../components/regions/WorldMap'
import { ApiError } from '../lib/api'
import { getRegions, regionColor, type Region } from '../lib/regions'

// Case- and accent-insensitive, so "reunion" finds Réunion.
function normalize(text: string) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function RegionsPage() {
  const [regions, setRegions] = useState<Region[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    getRegions()
      .then((loaded) => !cancelled && setRegions(loaded))
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : "Can't reach the server."))
    return () => {
      cancelled = true
    }
  }, [])

  const query = normalize(search.trim())
  // A region match keeps all its countries; matching the parent too, so "Europe" finds its sub-regions.
  const matches = (regions ?? [])
    .map((region) => ({
      ...region,
      countries: normalize(`${region.name} ${region.parent ?? ''}`).includes(query)
        ? region.countries
        : region.countries.filter((country) => normalize(country).includes(query)),
    }))
    .filter((region) => region.countries.length > 0)
  const shown = new Set(matches.flatMap((region) => region.countries))

  return (
    <>
      <PageHeader title="Regions" />
      {error && (
        <p role="alert" className="text-sm font-semibold text-soil">
          {error}
        </p>
      )}
      <Card title="">
        <WorldMap regions={regions ?? []} shown={shown}>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search for a region or country"
            aria-label="Search for a region or country"
            className="min-w-0 flex-1 rounded-full border border-sand bg-white px-4 py-2 text-sm text-charcoal outline-none focus:border-leaf sm:w-80 sm:flex-none"
          />
        </WorldMap>
      </Card>
      <Card title="">
        {regions && matches.length === 0 && (
          <p className="text-sm text-ink">No region or country matches your search.</p>
        )}
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((region) => (
            <li key={region.name} className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-green">
                {/* style: the color is a CSS variable picked per region, which a class can't express. */}
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: regionColor(region) }} />
                {region.name}
                {region.parent && <span className="text-sm font-normal text-ink">in {region.parent}</span>}
              </span>
              <p className="text-sm text-ink">{region.countries.join(', ')}</p>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}

export default RegionsPage
