import { useState, type FormEvent } from 'react'

import { ApiError } from '../../lib/api'
import type { Region } from '../../lib/regions'
import { updatePendingSpecies, type PendingSpecies } from '../../lib/species'

type EditSpeciesFormProps = {
  species: PendingSpecies
  // The regions a species can be in (no parents like Europe), in map order.
  regions: Region[]
  sunlightOptions: string[]
  onSaved: (species: PendingSpecies) => void
  onCancel: () => void
}

const fieldClass =
  'w-full min-w-0 rounded-full border border-sand bg-white px-3 py-1 text-sm text-charcoal outline-none focus:border-leaf'
const labelClass = 'text-xs font-semibold tracking-wider text-soil uppercase'

// Suggested while typing; any number from 1 to 365 is allowed.
const WATERING_DAYS = ['1', '2', '3', '4', '5', '7', '10', '14', '21', '30']

// Takes the place of the care details, in the same label/value grid, so the card doesn't grow.
function EditSpeciesForm({ species, regions, sunlightOptions, onSaved, onCancel }: EditSpeciesFormProps) {
  const [chosen, setChosen] = useState(species.regions)
  const [watering, setWatering] = useState(species.wateringFrequencyDays ? String(species.wateringFrequencyDays) : '')
  const [sunlight, setSunlight] = useState(species.sunlightNeeds ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // A value from before (e.g. an unmapped region) stays choosable, so opening the form loses nothing.
  const withCurrent = (options: string[], current: string) =>
    current && !options.includes(current) ? [current, ...options] : options
  const id = (field: string) => `${field}-${species.id}`

  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onSaved(
        await updatePendingSpecies(species.id, {
          // In map order, whatever order they were ticked in.
          regions: regions.filter((region) => chosen.includes(region.name)).map((region) => region.name),
          wateringFrequencyDays: Number(watering),
          sunlightNeeds: sunlight || null,
        }),
      )
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Can't reach the server.")
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="flex flex-1 flex-col gap-4">
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
        <span id={id('regions')} className={labelClass}>
          Regions
        </span>
        {/* A closed list keeps the card small; open, it shows every region to tick. */}
        <details className="relative min-w-0">
          <summary className={`${fieldClass} cursor-pointer list-none truncate`} aria-labelledby={id('regions')}>
            {chosen.length > 0 ? chosen.join(', ') : 'Not set'}
          </summary>
          <fieldset
            aria-labelledby={id('regions')}
            className="absolute z-10 mt-1 flex max-h-64 w-64 flex-col gap-1 overflow-y-auto rounded-2xl bg-white p-3 shadow-card"
          >
            {regions.map((region) => (
              <label key={region.name} className="flex items-center gap-2 text-sm text-charcoal">
                <input
                  type="checkbox"
                  checked={chosen.includes(region.name)}
                  onChange={(e) =>
                    setChosen((current) =>
                      e.target.checked ? [...current, region.name] : current.filter((name) => name !== region.name),
                    )
                  }
                  className="accent-leaf"
                />
                {region.name}
                {region.parent && <span className="text-ink">in {region.parent}</span>}
              </label>
            ))}
          </fieldset>
        </details>

        <label htmlFor={id('watering')} className={labelClass}>
          Watering
        </label>
        {/* Any number of days, styled like the selects; required, since reminders need it. */}
        <div className="flex w-full min-w-0 items-center rounded-full border border-sand bg-white px-3 py-1 text-sm focus-within:border-leaf">
          <input
            id={id('watering')}
            type="number"
            inputMode="numeric"
            required
            min={1}
            max={365}
            placeholder="e.g. 7"
            list={id('watering-days')}
            value={watering}
            onChange={(e) => setWatering(e.target.value)}
            className="w-full min-w-0 [appearance:textfield] bg-transparent text-charcoal outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="shrink-0 text-ink">days</span>
          <datalist id={id('watering-days')}>
            {WATERING_DAYS.map((days) => (
              <option key={days} value={days} />
            ))}
          </datalist>
        </div>

        <label htmlFor={id('sunlight')} className={labelClass}>
          Sunlight
        </label>
        <select
          id={id('sunlight')}
          value={sunlight}
          onChange={(e) => setSunlight(e.target.value)}
          className={fieldClass}
        >
          <option value="">Not set</option>
          {withCurrent(sunlightOptions, sunlight).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="text-sm font-semibold text-soil">
          {error}
        </p>
      )}
      <div className="mt-auto flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-full bg-green px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="flex-1 rounded-full border border-green px-4 py-2 text-sm font-semibold text-green transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default EditSpeciesForm
