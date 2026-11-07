import { apiAction, apiGet, apiPost, apiPut } from './api'

// The care fields and imageUrl are null when the submitter left them out; submittedBy (a
// username) when no user submitted it or the account was deleted.
export type PendingSpecies = {
  id: string
  commonName: string
  scientificName: string
  region: string | null
  wateringFrequencyDays: number | null
  sunlightNeeds: string | null
  imageUrl: string | null
  submittedBy: string | null
  submittedAt: string
}

// An approved species, as the app's Pluntdex shows it. common marks the species most people grow.
export type Species = {
  id: string
  commonName: string
  scientificName: string
  wateringFrequencyDays: number | null
  region: string | null
  sunlightNeeds: string | null
  common: boolean
  imageUrl: string | null
}

export function getApprovedSpecies(): Promise<Species[]> {
  return apiGet('/v1/admin/species')
}

export function getPendingSpecies(): Promise<PendingSpecies[]> {
  return apiGet('/v1/admin/species/pending')
}

export function approveSpecies(id: string): Promise<void> {
  return apiAction(`/v1/admin/species/pending/${id}/approve`, 'POST')
}

// What an admin can correct before approving. A null region or sunlight clears it.
export type SpeciesCare = {
  region: string | null
  wateringFrequencyDays: number
  sunlightNeeds: string | null
}

export function updatePendingSpecies(id: string, care: SpeciesCare): Promise<PendingSpecies> {
  return apiPut(`/v1/admin/species/pending/${id}`, care)
}

// Deletes the submission; plants that used it keep their own data.
export function rejectSpecies(id: string): Promise<void> {
  return apiAction(`/v1/admin/species/pending/${id}`, 'DELETE')
}

// nextPage is the Perenual page the next import starts at, null after the last one; limitReached means
// the free plan's 100 daily requests ran out.
export type SpeciesImport = {
  imported: number
  skipped: number
  nextPage: number | null
  limitReached: boolean
}

// Adds up to count new species to the pending list, looking from Perenual page `page` on. Species we
// already have are skipped.
export function importSpecies(count: number, page: number): Promise<SpeciesImport> {
  return apiPost(`/v1/admin/species/import?count=${count}&page=${page}`)
}

// Rejects every pending species; approved ones stay.
export function rejectAllPendingSpecies(): Promise<void> {
  return apiAction('/v1/admin/species/pending', 'DELETE')
}
