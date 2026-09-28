import {
  getAllMedicationReferences as getAllDbMedicationReferences,
  getMedicationReferenceById as getDbMedicationReferenceById,
  searchMedicationReferencesByName as searchDbMedicationReferencesByName,
  searchMedicationReferencesByUse as searchDbMedicationReferencesByUse,
} from "@/data/local/sqlite/medicationReference"

import { MedicationReferenceDomain } from "../domain/MedicationReference"

export function getAllMedicationReferenceRows(): MedicationReferenceDomain[] {
  return getAllDbMedicationReferences().map(MedicationReferenceDomain.fromRow)
}

export function searchMedicationReferenceRowsByName(term: string): MedicationReferenceDomain[] {
  const trimmed = term.trim()
  if (!trimmed) return getAllMedicationReferenceRows()
  return searchDbMedicationReferencesByName(trimmed).map(MedicationReferenceDomain.fromRow)
}

export function getMedicationReferenceRowsById(id: number): MedicationReferenceDomain | null {
  const row = getDbMedicationReferenceById(id)
  return row ? MedicationReferenceDomain.fromRow(row) : null
}

export function getMedicationReferenceByType(commonUse: string): MedicationReferenceDomain[] {
  const trimmed = commonUse.trim()
  if (!trimmed) return []
  return searchDbMedicationReferencesByUse(trimmed).map(MedicationReferenceDomain.fromRow)
}
