import { Link } from 'react-router'

import { timeAgo } from '../../lib/server'
import type { PendingSpecies } from '../../lib/species'
import Card from '../logs/Card'

const SHOWN = 3

function ReviewSpeciesCard({ pending, now }: { pending: PendingSpecies[]; now: number }) {
  const newestFirst = pending.toSorted((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  const oldest = newestFirst.at(-1)

  return (
    <Card title="Species to review">
      <div className="flex items-baseline gap-3">
        <span className="font-primary text-[72px] leading-[0.8] font-semibold text-green">{pending.length}</span>
        <span className="text-sm text-ink">
          waiting for approval{oldest && ` · oldest ${timeAgo(oldest.submittedAt, now)}`}
        </span>
      </div>
      {newestFirst.length > 0 && (
        <ul className="flex flex-col gap-2">
          {newestFirst.slice(0, SHOWN).map((species) => (
            <li key={species.id} className="flex flex-col rounded-xl bg-sand px-3.5 py-2.5">
              <span className="text-sm font-bold text-charcoal">{species.commonName}</span>
              <span className="text-[13px] text-ink">
                {species.submittedBy ? `@${species.submittedBy}` : 'Deleted account'} ·{' '}
                {timeAgo(species.submittedAt, now)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link
        to="/species"
        className="mt-auto inline-flex min-h-11 items-center justify-center rounded-full bg-green px-4 text-sm font-semibold text-white transition-opacity hover:opacity-80"
      >
        Review species
      </Link>
    </Card>
  )
}

export default ReviewSpeciesCard
