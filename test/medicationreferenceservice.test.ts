import { beforeEach, describe, expect, it, jest } from "@jest/globals"

import { MedicationReferenceDomain } from "../src/application/domain/MedicationReference"
import {
  getAllMedicationReferenceRows,
  getMedicationCategories,
  getMedicationReferenceByType,
  searchMedicationReferenceRowsByName,
  getMedicationReferenceRowsById,
} from "../src/application/services/medicationReferenceService"
import {
  getAllMedicationReferences,
  getMedicationReferenceById,
  searchMedicationReferencesByName,
  searchMedicationReferencesByUse,
} from "../src/data/local/sqlite/medicationReference"

jest.mock("../src/data/local/sqlite/medicationReference", () => ({
  getAllMedicationReferences: jest.fn(),
  getMedicationReferenceById: jest.fn(),
  searchMedicationReferenceRowsByName: jest.fn(),
  searchMedicationReferencesByName: jest.fn(),
  searchMedicationReferencesByUse: jest.fn(),
}))

const getAll = getAllMedicationReferences as jest.Mock
const getById = getMedicationReferenceById as jest.Mock
const searchByName = searchMedicationReferencesByName as jest.Mock
const searchByUse = searchMedicationReferencesByUse as jest.Mock

const refRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  medicationName: "Paracetamol",
  commonName: "Panadol",
  commonUse: "Mild to moderate pain and fever",
  contraIndication: "Liver disease",
  cautions: "Avoid overdose",
  sideEffects: "Nausea",
  patientAdvice: "Take with water",
  ...overrides,
})

beforeEach(() => {
  jest.resetAllMocks()
  getAll.mockReturnValue([])
  searchByName.mockReturnValue([])
  searchByUse.mockReturnValue([])
})

describe("get all medcation reference rows", () => {
  it("maps rows to domain objects", () => {
    getAll.mockReturnValue([refRow({ id: 1 }), refRow({ id: 2, medicationName: "Ibuprofen" })])

    const result = getAllMedicationReferenceRows()

    expect(result).toHaveLength(2)
    expect(result[0]).toBeInstanceOf(MedicationReferenceDomain)
    expect(result.map((r) => r.medicationName)).toEqual(["Paracetamol", "Ibuprofen"])
  })

  it("returns an empty list when there are no references", () => {
    expect(getAllMedicationReferenceRows()).toEqual([])
  })
})

describe("search medication reference rows by name", () => {
  it.each(["", "  "])("returns everything for the blank term %p", (term) => {
    getAll.mockReturnValue([refRow({ id: 1 }), refRow({ id: 2 })])

    const result = searchMedicationReferenceRowsByName(term)

    expect(result).toHaveLength(2)
    expect(searchByName).not.toHaveBeenCalled()
  })

  it("searches with the trimmed term and maps the results", () => {
    searchByName.mockReturnValue([refRow({ medicationName: "Paracetamol" })])

    const result = searchMedicationReferenceRowsByName("para ")

    expect(searchByName).toHaveBeenCalledWith("para")
    expect(getAll).not.toHaveBeenCalled()
    expect(result).toHaveLength(1)
    expect(result[0]).toBeInstanceOf(MedicationReferenceDomain)
    expect(result[0].medicationName).toBe("Paracetamol")
  })

  it("returns an empty list when nothing matches", () => {
    expect(searchMedicationReferenceRowsByName("zzz")).toEqual([])
  })
})

describe("get medication reference rows by id", () => {
  it("returns the domain object when the row exists", () => {
    getById.mockReturnValue(refRow({ id: 5 }))

    const result = getMedicationReferenceRowsById(5)

    expect(getById).toHaveBeenCalledWith(5)
    expect(result).toBeInstanceOf(MedicationReferenceDomain)
    expect(result?.id).toBe(5)
  })

  it.each([null, undefined])("returns null when the lookup gives %p", (value) => {
    getById.mockReturnValue(value)
    expect(getMedicationReferenceRowsById(5)).toBeNull()
  })
})

describe("get medication reference by type", () => {
  it.each(["", "  "])("returns an empty list for the blank term %p without searching", (term) => {
    expect(getMedicationReferenceByType(term)).toEqual([])
    expect(searchByUse).not.toHaveBeenCalled()
  })

  it("searches by the trimmed use and maps the results", () => {
    searchByUse.mockReturnValue([refRow({ commonUse: "Asthma" })])

    const result = getMedicationReferenceByType(" asthma ")
    expect(searchByUse).toHaveBeenCalledWith("asthma")
    expect(result).toHaveLength(1)
    expect(result[0]).toBeInstanceOf(MedicationReferenceDomain)
  })
})

describe("get medication categories", () => {
  const summarise = () =>
    getMedicationCategories().map((c) => ({
      label: c.label,
      names: c.medications.map((m) => m.medicationName),
    }))

  it("returns no categories when there are no medications", () => {
    expect(getMedicationCategories()).toEqual([])
  })

  it("groups medications by keywords found in their common use", () => {
    getAll.mockReturnValue([
      refRow({
        id: 1,
        medicationName: "Paracetamol",
        commonUse: "Mild to moderate pain and fever",
      }),
      refRow({ id: 2, medicationName: "Salbutamol", commonUse: "Asthma and COPD" }),
      refRow({ id: 3, medicationName: "Insulin glargine", commonUse: "Diabetes mellitus" }),
      refRow({ id: 5, medicationName: "Amoxicillin", commonUse: "Bacterial infection" }),
      refRow({ id: 5, medicationName: "Sumatriptan", commonUse: "Acute migraine" }),
    ])

    expect(summarise()).toEqual([
      { label: "Asthma", names: ["Salbutamol"] },
      { label: "Diabetes", names: ["Insulin glargine"] },
      { label: "Pain", names: ["Paracetamol", "Sumatriptan"] },
      { label: "Infection", names: ["Amoxicillin"] },
    ])
  })

  it("matches keywords case insneitively", () => {
    getAll.mockReturnValue([refRow({ medicationName: "Metformin", commonUse: "Type 2 DIABETES" })])
    expect(summarise()).toEqual([{ label: "Diabetes", names: ["Metformin"] }])
  })

  it("lists a medication under every category it matches", () => {
    getAll.mockReturnValue([
      refRow({ medicationName: "Epinephrine", commonUse: "Anaphylaxis and severe asthma" }),
    ])

    expect(summarise()).toEqual([
      { label: "Asthma", names: ["Epinephrine"] },
      { label: "Allergy", names: ["Epinephrine"] },
    ])
  })

  it("leaves out categories with no medications and medications that match nothing", () => {
    getAll.mockReturnValue([
      refRow({ id: 1, medicationName: "Lactulose", commonUse: "Constipation" }),
      refRow({ id: 2, medicationName: "Mystery", commonUse: "" }),
    ])

    expect(getMedicationCategories()).toEqual([])
  })

  it("only looks at the common use text, not the medication name", () => {
    getAll.mockReturnValue([
      refRow({ medicationName: "Insulin glargine", commonUse: "Hyperglycaemia" }),
    ])
    expect(getMedicationCategories()).toEqual([])
  })

  it("returns domain objects inside each category", () => {
    getAll.mockReturnValue([refRow({ commonUse: "Asthma" })])

    const [category] = getMedicationCategories()

    expect(category.medications[0]).toBeInstanceOf(MedicationReferenceDomain)
  })
})
