import { beforeEach, describe, expect, it, jest } from "@jest/globals"

import { useFreshDatabase as setupFreshDatabase } from "./setupdb"
import {
  addMedicationReference,
  countMedicationReferences,
  deleteMedicationReference,
  getAllMedicationReferences,
  getMedicationReferenceById,
  importMedicationReferences,
  searchMedicationReferencesByName,
  searchMedicationReferencesByUse,
  updateMedicationReference,
} from "../src/data/local/sqlite/medicationReference"

jest.mock("../src/data/local/sqlite/database", () => require("./db"))

setupFreshDatabase()

const add = (medicationName: string, overrides = {}) =>
  addMedicationReference({
    medicationName,
    commonName: null,
    commonUse: null,
    contraIndication: null,
    cautions: null,
    sideEffects: null,
    patientAdvice: null,
    ...overrides,
  })

describe("addMedicationReference", () => {
  it("stores every field and returns the new id", () => {
    const id = add("Paracetamol", {
      commonName: "Panadol",
      commonUse: "Pain",
      contraIndication: "Liver disease",
      cautions: "Avoid overdose",
      sideEffects: "Nausea",
      patientAdvice: "Take with water",
    })

    expect(getMedicationReferenceById(id)).toEqual({
      id,
      medicationName: "Paracetamol",
      commonName: "Panadol",
      commonUse: "Pain",
      contraIndication: "Liver disease",
      cautions: "Avoid overdose",
      sideEffects: "Nausea",
      patientAdvice: "Take with water",
    })
  })

  it("stores null for optional fields", () => {
    const id = add("Paracetamol")

    expect(getMedicationReferenceById(id)).toEqual({
      id,
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

describe("importMedicationReferences", () => {
  const importOne = (record: Record<string, unknown>) => {
    importMedicationReferences([
      { medication_name: "Paracetamol", ...record } as Parameters<
        typeof importMedicationReferences
      >[0][number],
    ])
    return getAllMedicationReferences()[0]
  }

  it("maps the scraper's snake_case fields", () => {
    const row = importOne({
      common_use: "Pain",
      contra_indication: "Liver disease",
      cautions: "Avoid overdose",
      side_effects: "Nausea",
      patient_advice: "Take with water",
    })

    expect(row).toMatchObject({
      medicationName: "Paracetamol",
      commonUse: "Pain",
      contraIndication: "Liver disease",
      cautions: "Avoid overdose",
      sideEffects: "Nausea",
      patientAdvice: "Take with water",
    })
  })

  it("joins a list of brand names with commas", () => {
    expect(importOne({ common_names: ["Panadol", "Pamol"] }).commonName).toBe("Panadol, Pamol")
  })

  it("flattens nested lists of brand names", () => {
    expect(importOne({ common_names: [["Panadol"], ["Pamol", ["Nurofen"]]] }).commonName).toBe(
      "Panadol, Pamol, Nurofen",
    )
  })

  it("ignores brand names that are not strings", () => {
    expect(importOne({ common_names: ["Panadol", 5, null, "Pamol"] }).commonName).toBe(
      "Panadol, Pamol",
    )
  })

  it("keeps a brand name that is already a string", () => {
    expect(importOne({ common_names: "Panadol" }).commonName).toBe("Panadol")
  })

  it.each([undefined, 5, { a: 1 }])("stores null when common_names is %p", (value) => {
    expect(importOne({ common_names: value }).commonName).toBeNull()
  })

  it("stores null for fields that are missing", () => {
    expect(importOne({})).toMatchObject({
      commonName: null,
      commonUse: null,
      contraIndication: null,
      cautions: null,
      sideEffects: null,
      patientAdvice: null,
    })
  })

  it("imports every record", () => {
    importMedicationReferences([
      { medication_name: "Aspirin" },
      { medication_name: "Ibuprofen" },
      { medication_name: "Paracetamol" },
    ])

    expect(countMedicationReferences()).toBe(3)
  })

  it("does nothing for an empty list", () => {
    importMedicationReferences([])
    expect(countMedicationReferences()).toBe(0)
  })
})

describe("getAllMedicationReferences", () => {
  it("returns an empty list when there are none", () => {
    expect(getAllMedicationReferences()).toEqual([])
  })

  it("is sorted by medication name", () => {
    add("Paracetamol")
    add("Aspirin")
    add("Ibuprofen")

    expect(getAllMedicationReferences().map((r) => r.medicationName)).toEqual([
      "Aspirin",
      "Ibuprofen",
      "Paracetamol",
    ])
  })
})

describe("getMedicationReferenceById", () => {
  it("returns the matching row", () => {
    add("Aspirin")
    const id = add("Ibuprofen")

    expect(getMedicationReferenceById(id)?.medicationName).toBe("Ibuprofen")
  })

  it("returns null when there is no such row", () => {
    expect(getMedicationReferenceById(999)).toBeNull()
  })
})

describe("searchMedicationReferencesByName", () => {
  beforeEach(() => {
    add("Paracetamol", { commonName: "Panadol" })
    add("Ibuprofen", { commonName: "Nurofen" })
  })

  it("matches part of the medication name", () => {
    expect(searchMedicationReferencesByName("ibupro").map((r) => r.medicationName)).toEqual([
      "Ibuprofen",
    ])
  })

  it("matches part of the common name", () => {
    expect(searchMedicationReferencesByName("pana").map((r) => r.medicationName)).toEqual([
      "Paracetamol",
    ])
  })

  it("ignores case", () => {
    expect(searchMedicationReferencesByName("NUROFEN").map((r) => r.medicationName)).toEqual([
      "Ibuprofen",
    ])
  })

  it("returns an empty list when nothing matches", () => {
    expect(searchMedicationReferencesByName("zzz")).toEqual([])
  })

  it("orders results by common name", () => {
    add("Drug C", { commonName: "Zeta" })
    add("Drug A", { commonName: "Alpha" })
    add("Drug B", { commonName: "Mid" })

    expect(searchMedicationReferencesByName("drug").map((r) => r.commonName)).toEqual([
      "Alpha",
      "Mid",
      "Zeta",
    ])
  })
})

describe("searchMedicationReferencesByUse", () => {
  beforeEach(() => {
    add("Paracetamol", { commonUse: "Pain" })
    add("Codeine", { commonUse: "Pain" })
    add("Ibuprofen", { commonUse: "Pain relief" })
    add("Salbutamol", { commonUse: "Asthma" })
  })

  it("returns medications whose common use is exactly the given text, sorted by name", () => {
    expect(searchMedicationReferencesByUse("Pain").map((r) => r.medicationName)).toEqual([
      "Codeine",
      "Paracetamol",
    ])
  })

  it("returns an empty list when nothing matches", () => {
    expect(searchMedicationReferencesByUse("Gout")).toEqual([])
  })

  it.todo("matches partial common use text (currently an exact match, not LIKE)")
})

describe("countMedicationReferences", () => {
  it("is 0 when empty", () => {
    expect(countMedicationReferences()).toBe(0)
  })

  it("counts every row", () => {
    add("A")
    add("B")
    expect(countMedicationReferences()).toBe(2)
  })
})

describe("updateMedicationReference", () => {
  it("changes only the fields it is given", () => {
    const id = add("Paracetamol", { commonName: "Panadol", commonUse: "Pain" })

    updateMedicationReference(id, { commonUse: "Fever" })

    expect(getMedicationReferenceById(id)).toMatchObject({
      medicationName: "Paracetamol",
      commonName: "Panadol",
      commonUse: "Fever",
    })
  })

  it("only changes the row with that id", () => {
    const first = add("First")
    const second = add("Second")

    updateMedicationReference(first, { medicationName: "Changed" })

    expect(getMedicationReferenceById(second)?.medicationName).toBe("Second")
  })

  it("does nothing when there is nothing to update", () => {
    const id = add("Paracetamol")

    expect(() => updateMedicationReference(id, {})).not.toThrow()
    expect(getMedicationReferenceById(id)?.medicationName).toBe("Paracetamol")
  })
})

describe("deleteMedicationReference", () => {
  it("removes only that row", () => {
    const keep = add("Keep")
    const remove = add("Remove")

    deleteMedicationReference(remove)

    expect(getMedicationReferenceById(remove)).toBeNull()
    expect(getMedicationReferenceById(keep)).not.toBeNull()
  })
})
