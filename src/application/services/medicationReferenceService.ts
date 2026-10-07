import {
  getAllMedicationReferences as getAllDbMedicationReferences,
  getMedicationReferenceById as getDbMedicationReferenceById,
  searchMedicationReferencesByName as searchDbMedicationReferencesByName,
  searchMedicationReferencesByUse as searchDbMedicationReferencesByUse,
} from "@/data/local/sqlite/medicationReference"

import { MedicationReferenceDomain } from "../domain/MedicationReference"

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Asthma: ["asthma"],
  Diabetes: ["diabetes", "diabetic", "insulin"],
  Pain: ["pain", "analgesia", "headache", "migraine"],
  Hypertension: ["hypertension", "blood pressure"],
  Heart: ["heart failure", "angina", "cardiac", "arrhythmia"],
  Infection: ["infection", "bacterial", "viral", "fungal"],
  Allergy: ["allergy", "allergic", "anaphylaxis"],
}

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

export function getMedicationCategories() {
  const medications = getAllMedicationReferenceRows()

  return Object.entries(CATEGORY_KEYWORDS)
    .map(([label, keywords]) => ({
      label,
      medications: medications.filter((medication) => {
        const text = medication.commonUse.toLowerCase()
        return keywords.some((keyword) => text.includes(keyword))
      }),
    }))
    .filter((category) => category.medications.length > 0)
}
