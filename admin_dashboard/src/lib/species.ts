import { apiAction, apiGet, apiPost, apiPut } from './api'

// The care fields and imageUrl are null when the submitter left them out; submittedBy (a
// username) when no user submitted it or the account was deleted.
export type PendingSpecies = {
  id: string
  commonName: string
  scientificName: string
  // Every region the plant is native to, in map order; empty when not set yet.
  regions: string[]
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
  regions: string[]
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

// What an admin can correct before approving. Empty regions or a null sunlight clear them.
export type SpeciesCare = {
  regions: string[]
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

// nextPage is the Trefle page the next import starts at, null after the last one; limitReached means
// Trefle's 60 requests a minute ran out.
export type SpeciesImport = {
  imported: number
  skipped: number
  nextPage: number | null
  limitReached: boolean
}

// Adds up to count new species to the pending list, looking from Trefle page `page` on. Watering stays empty:
// Trefle has none, so the admin sets it with Edit. Species we
// already have are skipped.
export function importSpecies(count: number, page: number): Promise<SpeciesImport> {
  return apiPost(`/v1/admin/species/import?count=${count}&page=${page}`)
}

// Rejects every imported pending species; users' submissions and approved ones stay.
export function rejectAllPendingSpecies(): Promise<void> {
  return apiAction('/v1/admin/species/pending', 'DELETE')
}
