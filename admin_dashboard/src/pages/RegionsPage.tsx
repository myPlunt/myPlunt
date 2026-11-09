import { useState } from 'react'

import Card from '../components/logs/Card'
import PageHeader from '../components/PageHeader'
import WorldMap from '../components/regions/WorldMap'
import { REGIONS } from '../lib/regions'

// Case- and accent-insensitive, so "reunion" finds Réunion.
function normalize(text: string) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function RegionsPage() {
  const [search, setSearch] = useState('')
  const query = normalize(search.trim())
  // A region match keeps all its countries; matching the parent too, so "Europe" finds its sub-regions.
  const matches = REGIONS.map((region) => ({
    ...region,
    countries: normalize(`${region.name} ${region.parent ?? ''}`).includes(query)
      ? region.countries
      : region.countries.filter((country) => normalize(country).includes(query)),
  })).filter((region) => region.countries.length > 0)
  const shown = new Set(matches.flatMap((region) => region.countries))

  return (
    <>
      <PageHeader title="Regions" />
      <Card title="World map">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search for a region or country"
          aria-label="Search for a region or country"
          className="w-full rounded-full border border-sand bg-white px-4 py-2 text-sm text-charcoal outline-none focus:border-leaf sm:w-80"
        />
        <WorldMap shown={shown} />
      </Card>
      <Card title="Regions and countries">
        {matches.length === 0 && <p className="text-sm text-ink">No region or country matches your search.</p>}
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((region) => (
            <li key={region.name} className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-green">
                {/* style: the color is a CSS variable picked per region, which a class can't express. */}
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: region.color }} />
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
