import type { ReactNode } from 'react'

type SpeciesCardProps = {
  commonName: string
  scientificName: string
  region: string | null
  wateringFrequencyDays: number | null
  sunlightNeeds: string | null
  imageUrl: string | null
  // Shown under the details, e.g. who submitted it and the review buttons.
  children?: ReactNode
}

// The picture, names and care details that approved and pending species share.
function SpeciesCard({
  commonName,
  scientificName,
  region,
  wateringFrequencyDays,
  sunlightNeeds,
  imageUrl,
  children,
}: SpeciesCardProps) {
  const details = [
    { label: 'Region', value: region },
    {
      label: 'Watering',
      value: wateringFrequencyDays && `Every ${wateringFrequencyDays} day${wateringFrequencyDays === 1 ? '' : 's'}`,
    },
    { label: 'Sunlight', value: sunlightNeeds },
  ]

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl bg-cream shadow-card">
      {imageUrl ? (
        <img src={imageUrl} alt={commonName} className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-sand text-sm text-ink">No picture</div>
      )}
      <div className="flex flex-1 flex-col gap-4 p-4">
        <header className="flex flex-col gap-0.5">
          <h3 className="text-lg font-semibold text-green">{commonName}</h3>
          <p className="text-sm text-ink italic">{scientificName}</p>
        </header>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          {details.map((detail) => (
            <div key={detail.label} className="contents">
              <dt className="text-xs font-semibold tracking-wider text-soil uppercase">{detail.label}</dt>
              <dd className="text-charcoal">{detail.value || '—'}</dd>
            </div>
          ))}
        </dl>
        {children}
      </div>
    </article>
  )
}

export default SpeciesCard
