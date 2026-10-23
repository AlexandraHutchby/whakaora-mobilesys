import { describe, expect, it } from "@jest/globals"

import { MedicationCombination } from "../src/application/domain/MedicationCombination"

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  userMedicationId: 10,
  interactingMedicationId: 20,
  description: "May increase bleeding risk",
  notes: "Space doses apart",
  dateRecorded: "2026-01-15",
  ...overrides,
})

describe("MedicationCombination.fromRow", () => {
  it("maps every column", () => {
    expect(MedicationCombination.fromRow(row())).toMatchObject({
      id: 1,
      userMedicationId: 10,
      interactingMedicationId: 20,
      description: "May increase bleeding risk",
      notes: "Space doses apart",
      dateRecorded: "2026-01-15",
    })
  })

  it("uses null for missing description and notes", () => {
    const withUndefined = MedicationCombination.fromRow(
      row({ description: undefined, notes: undefined }),
    )
    const withNull = MedicationCombination.fromRow(row({ description: null, notes: null }))

    expect(withUndefined.description).toBeNull()
    expect(withUndefined.notes).toBeNull()
    expect(withNull.description).toBeNull()
    expect(withNull.notes).toBeNull()
  })

  it("keeps empty string as they are", () => {
    const combo = MedicationCombination.fromRow(row({ description: "", notes: "" }))
    expect(combo.description).toBe("")
    expect(combo.notes).toBe("")
  })
})

describe("MedicationCombination.involves", () => {
  const combo = MedicationCombination.fromRow(row())

  it("is true for the user medication", () => {
    expect(combo.involves(10)).toBe(true)
  })

  it("is true for the interacting medication", () => {
    expect(combo.involves(20)).toBe(true)
  })

  it("is false for an unrelated medication", () => {
    expect(combo.involves(30)).toBe(false)
  })
})

describe("Medication Combination.otherMedicationId", () => {
  const combo = MedicationCombination.fromRow(row())

  it("returns the interacting medication when given the user medication", () => {
    expect(combo.otherMedicationId(10)).toBe(20)
  })

  it("returns the user medication when given the interacting medication", () => {
    expect(combo.otherMedicationId(20)).toBe(10)
  })
})
