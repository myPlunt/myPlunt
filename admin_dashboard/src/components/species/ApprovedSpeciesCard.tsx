import { useState, type FormEvent } from "react";

import { ApiError } from "../../lib/api";
import {
  REGIONS,
  SUNLIGHT,
  updateSpecies,
  type Species,
} from "../../lib/species";
import SpeciesCard from "./SpeciesCard";

type ApprovedSpeciesCardProps = {
  species: Species;
  onSaved: (species: Species) => void;
};

const inputClass =
  "w-full rounded-xl border border-sand bg-white px-3 py-1.5 text-sm text-charcoal outline-none focus:border-leaf";
// A value off the list (typed before the lists existed) shows as "Not set", so saving clears it.
function OptionSelect({
  name,
  options,
  value,
}: {
  name: string;
  options: string[];
  value: string | null;
}) {
  return (
    <select
      name={name}
      defaultValue={value && options.includes(value) ? value : ""}
      className={inputClass}
    >
      <option value="">Not set</option>
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

const labelClass =
  "flex flex-col gap-1 text-xs font-semibold tracking-wider text-soil uppercase";

function ApprovedSpeciesCard({ species, onSaved }: ApprovedSpeciesCardProps) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "");
    const watering = text("wateringFrequencyDays");
    setBusy(true);
    setError(null);
    try {
      const saved = await updateSpecies(species.id, {
        commonName: text("commonName"),
        scientificName: text("scientificName"),
        region: text("region"),
        wateringFrequencyDays: watering ? Number(watering) : null,
        sunlightNeeds: text("sunlightNeeds"),
        common: form.get("common") === "on",
      });
      onSaved(saved);
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Can't reach the server.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <SpeciesCard {...species}>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-auto rounded-full border border-green px-4 py-2 text-sm font-semibold text-green transition-opacity hover:opacity-80"
        >
          Edit
        </button>
      </SpeciesCard>
    );
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl bg-cream shadow-card">
      {species.imageUrl ? (
        <img
          src={species.imageUrl}
          alt={species.commonName}
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-sand text-sm text-ink">
          No picture
        </div>
      )}
      <form onSubmit={save} className="flex flex-1 flex-col gap-3 p-4">
        <label className={labelClass}>
          Name
          <input
            name="commonName"
            required
            maxLength={255}
            defaultValue={species.commonName}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Scientific name
          <input
            name="scientificName"
            required
            maxLength={255}
            defaultValue={species.scientificName}
            className={`${inputClass} italic`}
          />
        </label>
        <label className={labelClass}>
          Region
          <OptionSelect
            name="region"
            options={REGIONS}
            value={species.region}
          />
        </label>
        <label className={labelClass}>
          Watering every (days)
          <input
            name="wateringFrequencyDays"
            type="number"
            min={1}
            step={1}
            defaultValue={species.wateringFrequencyDays ?? ""}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Sunlight
          <OptionSelect
            name="sunlightNeeds"
            options={SUNLIGHT}
            value={species.sunlightNeeds}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-charcoal">
          <input
            name="common"
            type="checkbox"
            defaultChecked={species.common}
            className="accent-green"
          />
          Show under the Common filter in the PluntDex
        </label>
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
            Save
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setEditing(false);
              setError(null);
            }}
            className="flex-1 rounded-full border border-green px-4 py-2 text-sm font-semibold text-green transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </article>
  );
}

export default ApprovedSpeciesCard;
