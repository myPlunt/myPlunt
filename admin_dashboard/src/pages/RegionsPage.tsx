import worldMap from '../assets/world-map.json'
import Card from '../components/logs/Card'
import PageHeader from '../components/PageHeader'
import { REGIONS } from '../lib/regions'

function RegionsPage() {
  return (
    <>
      <PageHeader title="Regions" />
      <Card title="World map" subtitle="Every country belongs to one region. Hover a country to see its name.">
        <svg viewBox="0 0 960 419" role="img" aria-label="World map coloured by region" className="w-full">
          {REGIONS.flatMap((region) =>
            region.countries.map((country) => (
              <path key={country} d={worldMap[country]} fill={region.color} className="stroke-cream" strokeWidth={0.4}>
                <title>{`${country} (${region.name})`}</title>
              </path>
            )),
          )}
        </svg>
      </Card>
      <Card title="Regions and countries">
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {REGIONS.map((region) => (
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
