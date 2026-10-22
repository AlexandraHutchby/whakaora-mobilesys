import { describe, expect, it, jest } from "@jest/globals"

import { useFreshDatabase as setupFreshDatabase } from "./setupdb"
import { MealTiming } from "../src/application/domain/MealTiming"
import { MedicationCombination } from "../src/application/domain/MedicationCombination"
import { MedicationReferenceDomain } from "../src/application/domain/MedicationReference"
import { medicationScheduleEntry } from "../src/application/domain/MedicationScheduleEntry"
import { UserMedication } from "../src/application/domain/UserMedication"
import {
  addInteractionRecord,
  getAllInteractionRecords,
} from "../src/data/local/sqlite/interactionRecord"
import { addMealSchedule, getAllMealSchedules } from "../src/data/local/sqlite/mealSchedule"
import {
  addMedicationReference,
  getAllMedicationReferences,
} from "../src/data/local/sqlite/medicationReference"
import {
  addMedicationSchedule,
  getAllMedicationSchedule,
} from "../src/data/local/sqlite/medicationSchedule"
import { addUserMedication, getAllUserMedications } from "../src/data/local/sqlite/userMedication"

jest.mock("@/data/local/sqlite/database", () => require("./db"))

setupFreshDatabase()

type AddInteractionArg = Parameters<typeof addInteractionRecord>[0]

const newUserMedication = (medicationName: string, overrides = {}) =>
  addUserMedication({ medicationReferenceId: null, medicationName, customName: null, ...overrides })

describe("MealTiming reading a mealSchedule row", () => {
  it("reads the meal time, enabled flag and minutes", () => {
    addMealSchedule({ mealType: "Breakfast", scheduleTime: "08:00", enabled: 1 })

    const meal = MealTiming.fromRow(getAllMealSchedules()[0])

    expect(meal).toMatchObject({ mealType: "Breakfast", scheduleTime: "08:00", enabled: true })
    expect(meal.minutes).toBe(480)
    expect(meal.isUsable).toBe(true)
  })

  it("treats a disabled meal as not usable", () => {
    addMealSchedule({ mealType: "Lunch", scheduleTime: "13:00", enabled: 0 })

    expect(MealTiming.fromRow(getAllMealSchedules()[0]).isUsable).toBe(false)
  })
})

describe("medicationScheduleEntry reading a medicationSchedule row", () => {
  const addSchedule = () => {
    const userMedicationId = newUserMedication("Paracetamol")
    addMedicationSchedule({
      userMedicationId,
      frequency: 2,
      frequencyType: "Day",
      scheduleTime: "08:00,12:00",
      startDate: "2026-01-01",
      endDate: null,
      doseAmount: 500,
      doseUnit: "mg",
      instructions: JSON.stringify({ foodRule: "with" }),
      enabled: "1",
    })
    return { userMedicationId, row: getAllMedicationSchedule()[0] }
  }

  it("reads the frequency, dose, dates, instructions and enabled flag", () => {
    const { userMedicationId, row } = addSchedule()

    expect(medicationScheduleEntry.fromRow(row)).toMatchObject({
      userMedicationId,
      frequency: 2,
      frequencyType: "Day",
      startDate: "2026-01-01",
      endDate: null,
      doseAmount: 500,
      doseUnit: "mg",
      instructions: { foodRule: "with" },
      enabled: true,
    })
  })

  it("reads the stored dose times", () => {
    const { row } = addSchedule()

    expect(medicationScheduleEntry.fromRow(row).times).toEqual(["08:00", "12:00"])
  })
})

describe("UserMedication reading a userMedication row", () => {
  it("reads an unlinked medication with a custom name", () => {
    newUserMedication("Paracetamol", { customName: "Panadol" })

    const medication = UserMedication.fromRow(getAllUserMedications()[0])

    expect(medication.displayName).toBe("Panadol")
    expect(medication.isLinkedToReference()).toBe(false)
  })

  it("reads a medication linked to a reference", () => {
    const referenceId = addMedicationReference({
      medicationName: "Paracetamol",
      commonName: null,
      commonUse: null,
      contraIndication: null,
      cautions: null,
      sideEffects: null,
      patientAdvice: null,
    })
    newUserMedication("Paracetamol", { medicationReferenceId: referenceId })

    const medication = UserMedication.fromRow(getAllUserMedications()[0])

    expect(medication.medicationReferenceId).toBe(referenceId)
    expect(medication.isLinkedToReference()).toBe(true)
  })
})

describe("MedicationCombination reading an interactionRecord row", () => {
  it("reads both medications and the optional text", () => {
    const first = newUserMedication("A")
    const second = newUserMedication("B")
    addInteractionRecord({
      userMedicationId: first,
      interactingMedicationId: second,
      description: null,
      notes: "Space doses",
      dateRecorded: "2026-03-15T10:00:00.000Z",
    } as AddInteractionArg)

    const combination = MedicationCombination.fromRow(getAllInteractionRecords()[0])

    expect(combination.involves(first)).toBe(true)
    expect(combination.otherMedicationIs(first)).toBe(second)
    expect(combination.description).toBeNull()
    expect(combination.notes).toBe("Space doses")
    expect(combination.dateRecorded).toBe("2026-03-15T10:00:00.000Z")
  })
})

describe("MedicationReferenceDomain reading a medicationReference row", () => {
  it("reads every text field and builds the display name", () => {
    addMedicationReference({
      medicationName: "Paracetamol",
      commonName: "Panadol",
      commonUse: "Pain",
      contraIndication: "Liver disease",
      cautions: "Avoid overdose",
      sideEffects: "Nausea",
      patientAdvice: "Take with water",
    })

    const reference = MedicationReferenceDomain.fromRow(getAllMedicationReferences()[0])

    expect(reference).toMatchObject({
      medicationName: "Paracetamol",
      commonName: "Panadol",
      commonUse: "Pain",
      contraIndication: "Liver disease",
      cautions: "Avoid overdose",
      sideEffects: "Nausea",
      patientAdvice: "Take with water",
    })
    expect(reference.displayName).toBe("Paracetamol (Panadol)")
  })

  it("turns missing text into empty strings", () => {
    addMedicationReference({
      medicationName: "Paracetamol",
      commonName: null,
      commonUse: null,
      contraIndication: null,
      cautions: null,
      sideEffects: null,
      patientAdvice: null,
    })

    const reference = MedicationReferenceDomain.fromRow(getAllMedicationReferences()[0])

    expect(reference.commonUse).toBe("")
    expect(reference.displayName).toBe("Paracetamol")
  })
})
