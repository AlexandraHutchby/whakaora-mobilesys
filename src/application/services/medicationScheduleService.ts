import { getAllInteractionRecords } from "@/data/local/sqlite/interactionRecord"
import { getAllMealSchedules } from "@/data/local/sqlite/mealSchedule"
import {
  addMedicationSchedule,
  deleteMedicationSchedule,
  getAllMedicationSchedule,
  updateMedicationSchedule,
} from "@/data/local/sqlite/medicationSchedule"
import { getAllUserMedications } from "@/data/local/sqlite/userMedication"

import { MealTiming } from "../domain/MealTiming"
import { medicationScheduleEntry, seraliseInstructions } from "../domain/MedicationScheduleEntry"
import {
  FoodRule,
  ScheduleResult,
  SchedulableMedication,
  generateSchedule,
  parseTime,
} from "../domain/Scheduler"
import { UserMedication } from "../domain/UserMedication"

export function listMedicationSchedules(): medicationScheduleEntry[] {
  return getAllMedicationSchedule().map(medicationScheduleEntry.fromRow)
}

export type SaveScheduleInput = {
  id?: number
  userMedicationId: number
  frequency: number
  frequencyType: "Day" | "Week" | "Month"
  doseAmount: number
  doseUnit: string
  foodRule: FoodRule
  preferredTime: string | null
  notes?: string | null
  startDate?: string
  endDate?: string | null
}

export function previewSchedule(): ScheduleResult {
  const meds = getAllUserMedications().map(UserMedication.fromRow)
  const nameById = new Map(meds.map((m) => [m.id, m.displayName]))
  const today = new Date().toISOString().slice(0, 10)

  const active = listMedicationSchedules().filter(
    (e) => e.enabled && nameById.has(e.userMedicationId) && e.isActiveOn(today),
  )

  const schedulable: SchedulableMedication[] = active.map((e) => ({
    userMedicationId: e.userMedicationId,
    name: nameById.get(e.userMedicationId)!,
    dosesPerDay: e.dosesPerDay,
    intervalDays: e.intervalDays,
    foodRule: e.instructions.foodRule,
    preferredMinutes: parseTime(e.instructions.preferredTime),
  }))

  const meals = getAllMealSchedules()
    .map(MealTiming.fromRow)
    .filter((m) => m.isUsable)
    .map((m) => ({ mealType: m.mealType, minutes: m.minutes! }))

  const conflicts = getAllInteractionRecords().map(
    (r) => [r.userMedicationId, r.interactingMedicationId] as [number, number],
  )

  return generateSchedule(schedulable, meals, conflicts)
}

export function regenerateSchedule(): ScheduleResult {
  const result = previewSchedule()

  for (const entry of listMedicationSchedules()) {
    const times = result.doses
      .filter((d) => d.userMedicationId === entry.userMedicationId)
      .map((d) => d.time)
    const next = times.join(",")
    if (next !== entry.times.join(",")) {
      updateMedicationSchedule(entry.id, {
        scheduleTime: next,
      })
    }
  }

  return result
}

export function saveMedicationSchedule(input: SaveScheduleInput): number {
  const existing = listMedicationSchedules().find(
    (e) => e.id === input.id || (!input.id && e.userMedicationId === input.userMedicationId),
  )

  const fields = {
    userMedicationId: input.userMedicationId,
    frequency: input.frequency,
    frequencyType: input.frequencyType,
    doseAmount: input.doseAmount,
    doseUnit: input.doseUnit,
    instructions: seraliseInstructions({
      foodRule: input.foodRule,
      preferredTime: input.preferredTime,
      notes: input.notes ?? null,
    }),
    startDate: input.startDate ?? existing?.startDate ?? new Date().toISOString().slice(0, 10),
    endDate: input.endDate ?? existing?.endDate ?? null,
  }

  let id: number
  if (existing) {
    updateMedicationSchedule(existing.id, fields)
    id = existing.id
  } else {
    id = addMedicationSchedule({ ...fields, scheduleTime: "", enabled: "1" })
  }

  regenerateSchedule()
  return id
}

export function setScheduleEnabled(id: number, enabled: boolean): void {
  updateMedicationSchedule(id, { enabled: enabled ? "1" : "0" })
  regenerateSchedule()
}

export function removeMedicationSchedule(id: number): void {
  deleteMedicationSchedule(id)
  regenerateSchedule()
}

export function removeSchedulesForMedication(userMedicationId: number): void {
  for (const e of listMedicationSchedules()) {
    if (e.userMedicationId === userMedicationId) {
      deleteMedicationSchedule(e.id)
    }
  }
  regenerateSchedule()
}
