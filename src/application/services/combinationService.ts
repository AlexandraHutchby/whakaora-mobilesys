import {
  addInteractionRecord,
  deleteInteractionRecord,
  getAllInteractionRecords,
} from "@/data/local/sqlite/interactionRecord"

import { regenerateSchedule } from "./medicationScheduleService"
import { MedicationCombination } from "../domain/MedicationCombination"

export function listCombinations(): MedicationCombination[] {
  return getAllInteractionRecords().map(MedicationCombination.fromRow)
}

export function getCombinationsFor(medicationId: number): MedicationCombination[] {
  return listCombinations().filter((c) => c.involves(medicationId))
}

export function addCombination(
  userMedicationId: number,
  interactingMedicationId: number,
  description: string | null = null,
  notes: string | null = null,
): number | null {
  if (userMedicationId === interactingMedicationId) return null
  const duplicate = listCombinations().some(
    (c) => c.involves(userMedicationId) && c.involves(interactingMedicationId),
  )
  if (duplicate) return null

  const id = addInteractionRecord({
    userMedicationId,
    interactingMedicationId,
    description,
    notes,
    dateRecorded: new Date().toISOString(),
  } as Parameters<typeof addInteractionRecord>[0])
  regenerateSchedule()
  return id
}

export function removeCombination(id: number): void {
  deleteInteractionRecord(id)
  regenerateSchedule()
}

export function removeCombinationsForMedication(medicationId: number): void {
  for (const c of listCombinations()) {
    if (c.involves(medicationId)) deleteInteractionRecord(c.id)
  }
  regenerateSchedule()
}
