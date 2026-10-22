import { describe, expect, it } from "@jest/globals"

import { MedicationReferenceDomain } from "../src/application/domain/MedicationReference"

type Row = Parameters<typeof MedicationReferenceDomain.fromRow>[0]

const makeRow = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 1,
    medicationName: "Paracetamol",
    commonName: "Panadol",
    commonUse: "Pain and fever",
    contraIndication: "Liver disease",
    cautions: "Avoid overdose",
    sideEffects: "Nausea",
    patientAdvice: "Take with water",
    ...overrides,
  }) as Row

describe("MedicationReference.fromRow", () => {
  it("Maps every column", () => {
    expect(MedicationReferenceDomain.fromRow(makeRow())).toMatchObject({
      id: 1,
      medicationName: "Paracetamol",
      commonName: "Panadol",
      commonUse: "Pain and fever",
      contraIndication: "Liver disease",
      cautions: "Avoid overdose",
      sideEffects: "Nausea",
      patientAdvice: "Take with water",
    })
  })

  it("trims whitespace from text fields", () => {
    const domain = MedicationReferenceDomain.fromRow(
      makeRow({ medicationName: "  Paracetamol  ", commonName: " Panadol ", cautions: "\tCare\n" }),
    )
    expect(domain.medicationName).toBe("Paracetamol")
    expect(domain.commonName).toBe("Panadol")
    expect(domain.cautions).toBe("Care")
  })

  it("turns null and undefined into empty strings", () => {
    const domain = MedicationReferenceDomain.fromRow(
      makeRow({
        commonName: null,
        commonUse: undefined,
        contraIndication: null,
        cautions: undefined,
        sideEffects: null,
        patientAdvice: undefined,
      }),
    )
    expect(domain.commonName).toBe("")
    expect(domain.commonUse).toBe("")
    expect(domain.contraIndication).toBe("")
    expect(domain.cautions).toBe("")
    expect(domain.sideEffects).toBe("")
    expect(domain.patientAdvice).toBe("")
  })
})

describe("MedicationReference.displayName", () => {
  it("includes the common name when it differs", () => {
    expect(MedicationReferenceDomain.fromRow(makeRow()).displayName).toBe("Paracetamol (Panadol)")
  })

  it("is just the medication name when there is no common name", () => {
    const domain = MedicationReferenceDomain.fromRow(makeRow({ commonName: null }))
    expect(domain.displayName).toBe("Paracetamol")
  })

  it("is just the medication name when the common name is identical", () => {
    const domain = MedicationReferenceDomain.fromRow(makeRow({ commonName: "Paracetamol" }))
    expect(domain.displayName).toBe("Paracetamol")
  })
})

describe("MedicationReference.toRow", () => {
  it("returns every field except the id", () => {
    const row = MedicationReferenceDomain.fromRow(makeRow()).toRow()

    expect(row).not.toHaveProperty("id")
    expect(row).toEqual({
      medicationName: "Paracetamol",
      commonName: "Panadol",
      commonUse: "Pain and fever",
      contraIndication: "Liver disease",
      cautions: "Avoid overdose",
      sideEffects: "Nausea",
      patientAdvice: "Take with water",
    })
  })

  it("turns empty optionsal fields back into null", () => {
    const row = MedicationReferenceDomain.fromRow(
      makeRow({
        commonName: "",
        commonUse: null,
        contraIndication: "  ",
        cautions: undefined,
        sideEffects: "",
        patientAdvice: null,
      }),
    ).toRow()

    expect(row).toEqual({
      medicationName: "Paracetamol",
      commonName: null,
      commonUse: null,
      contraIndication: null,
      cautions: null,
      sideEffects: null,
      patientAdvice: null,
    })
  })
})
