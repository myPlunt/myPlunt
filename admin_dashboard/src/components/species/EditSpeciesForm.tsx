import { useState, type FormEvent } from 'react'

import { ApiError } from '../../lib/api'
import { updatePendingSpecies, type PendingSpecies } from '../../lib/species'

type EditSpeciesFormProps = {
  species: PendingSpecies
  // The PluntDex regions, so the species lands in one the app's region filter already shows.
  regions: string[]
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
  const [region, setRegion] = useState(species.region ?? '')
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
          region: region || null,
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
        <label htmlFor={id('region')} className={labelClass}>
          Region
        </label>
        <select id={id('region')} value={region} onChange={(e) => setRegion(e.target.value)} className={fieldClass}>
          <option value="">Not set</option>
          {withCurrent(regions, region).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

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
