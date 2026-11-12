import { apiGet } from './api'

// A PluntDex region. parent is the name of the region it belongs to (Europe), or null. A parent has no
// countries and no species: those go in its sub-regions. countries are spelled as on the world map.
export type Region = {
  id: string
  name: string
  slug: string
  parent: string | null
  countries: string[]
}

// In map order.
export function getRegions(): Promise<Region[]> {
  return apiGet('/v1/admin/regions')
}

// Each region's colour is defined in index.css as --color-region-<slug>.
export function regionColor(region: Region): string {
  return `var(--color-region-${region.slug})`
}

// A species' regions as shown on its card: a species in every part of Europe shows "Europe" instead of the parts.
// Only for display: the species is still stored, filtered and edited by its sub-regions.
export function regionLabels(names: string[], regions: Region[]): string[] {
  const parentOf = new Map(regions.map((region) => [region.name, region.parent]))
  const hasEveryPart = (parent: string) =>
    regions.every((region) => region.parent !== parent || names.includes(region.name))
  return [
    ...new Set(
      names.map((name) => {
        const parent = parentOf.get(name)
        return parent && hasEveryPart(parent) ? parent : name
      }),
    ),
  ]
}

// The regions a species can be put in: every region except the parents.
export function speciesRegions(regions: Region[]): Region[] {
  return regions.filter((region) => region.countries.length > 0)
}
