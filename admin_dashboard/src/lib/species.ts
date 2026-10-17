import { apiGet } from './api'

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

export function getPendingSpecies(): Promise<PendingSpecies[]> {
  return apiGet('/v1/admin/species/pending')
}
