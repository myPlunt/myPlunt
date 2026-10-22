import { apiAction, apiGet } from './api'

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

// Deletes the submission; plants that used it keep their own data.
export function rejectSpecies(id: string): Promise<void> {
  return apiAction(`/v1/admin/species/pending/${id}`, 'DELETE')
}
