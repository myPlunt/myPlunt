import { useState, type FormEvent } from "react";

import { ApiError } from "../../lib/api";
import { updatePendingSpecies, type PendingSpecies } from "../../lib/species";

type EditSpeciesFormProps = {
  species: PendingSpecies;
  // The PluntDex regions, so the species lands in one the app's region filter already shows.
  regions: string[];
  sunlightOptions: string[];
  onSaved: (species: PendingSpecies) => void;
  onCancel: () => void;
};

const inputClass =
  "w-full rounded-full border border-sand bg-white px-3 py-1.5 text-sm text-charcoal outline-none focus:border-leaf";
const labelClass =
  "flex flex-col gap-1 text-xs font-semibold tracking-wider text-soil uppercase";

function EditSpeciesForm({
  species,
  regions,
  sunlightOptions,
  onSaved,
  onCancel,
}: EditSpeciesFormProps) {
  const [region, setRegion] = useState(species.region ?? "");
  const [watering, setWatering] = useState(
    String(species.wateringFrequencyDays ?? 7),
  );
  const [sunlight, setSunlight] = useState(species.sunlightNeeds ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A region from before the mapping (e.g. a country list) stays choosable, so opening the form loses nothing.
  const regionOptions =
    region && !regions.includes(region) ? [region, ...regions] : regions;
  const sunlightListId = `sunlight-${species.id}`;

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onSaved(
        await updatePendingSpecies(species.id, {
          region: region || null,
          wateringFrequencyDays: Number(watering),
          sunlightNeeds: sunlight.trim() || null,
        }),
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Can't reach the server.",
      );
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="flex flex-col gap-3 border-t border-sand pt-3"
    >
      <label className={labelClass}>
        Region
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className={inputClass}
        >
          <option value="">No region</option>
          {regionOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Watering (every N days)
        <input
          type="number"
          required
          min={1}
          max={365}
          value={watering}
          onChange={(e) => setWatering(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Sunlight
        <input
          list={sunlightListId}
          value={sunlight}
          maxLength={255}
          onChange={(e) => setSunlight(e.target.value)}
          className={inputClass}
        />
        <datalist id={sunlightListId}>
          {sunlightOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </label>
      {error && (
        <p role="alert" className="text-sm font-semibold text-soil">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-full bg-green px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          Save
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
  );
}

export default EditSpeciesForm;
