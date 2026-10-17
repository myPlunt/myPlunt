import type { PendingSpecies } from '../../lib/species'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function PendingSpeciesCard({ species }: { species: PendingSpecies }) {
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
      </div>
    </article>
  )
}

export default PendingSpeciesCard
