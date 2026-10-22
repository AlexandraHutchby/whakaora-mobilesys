import { beforeEach, describe, expect, it, jest } from "@jest/globals"

import { seedUserMedication, useFreshDatabase as setupFreshDatabase } from "./setupdb"
import {
  addSideEffectRecord,
  deleteSideEffectRecord,
  getAllSideEffectRecords,
  getRecentSideEffectRecords,
  updateSideEffectRecord,
} from "../src/data/local/sqlite/sideEffectRecord"

jest.mock("../src/data/local/sqlite/database", () => require("./db"))

setupFreshDatabase()

type AddArg = Parameters<typeof addSideEffectRecord>[0]
type UpdateArg = Parameters<typeof updateSideEffectRecord>[1]

let medA: number
let medB: number

beforeEach(() => {
  medA = seedUserMedication("A")
  medB = seedUserMedication("B")
})

const add = (
  userMedicationId: number,
  dateRecorded = "2026-06-15",
  description: string | null = "Nausea",
) => addSideEffectRecord({ userMedicationId, dateRecorded, description } as AddArg)

const readAll = () => getRecentSideEffectRecords("0000-00-00")

describe("addSideEffectRecord", () => {
  it("stores every field and returns the new id", () => {
    const id = add(medA, "2026-06-15", "Headache")

    expect(readAll()).toEqual([
      { id, userMedicationId: medA, dateRecorded: "2026-06-15", description: "Headache" },
    ])
  })

  it("stores a null description", () => {
    add(medA, "2026-06-15", null)

    expect(readAll()[0].description).toBeNull()
  })
})

describe("getAllSideEffectRecords", () => {
  it("returns an empty list when there are none", () => {
    expect(getAllSideEffectRecords()).toEqual([])
  })

  it("returns every record, sorted by user medication id", () => {
    add(medB, "2026-06-10", "B effect")
    add(medA, "2026-06-20", "A effect")

    expect(getAllSideEffectRecords().map((r) => r.description)).toEqual(["A effect", "B effect"])
  })
})

describe("getRecentSideEffectRecords", () => {
  it("returns records after the given date, sorted by user medication id", () => {
    add(medB, "2026-06-10", "Recent B")
    add(medA, "2026-06-20", "Recent A")
    add(medA, "2026-05-01", "Old")

    expect(getRecentSideEffectRecords("2026-06-05").map((r) => r.description)).toEqual([
      "Recent A",
      "Recent B",
    ])
  })

  it("returns an empty list when nothing is recent enough", () => {
    add(medA, "2026-05-01")

    expect(getRecentSideEffectRecords("2026-06-05")).toEqual([])
  })
})

describe("updateSideEffectRecord", () => {
  it("changes only the fields it is given", () => {
    const id = add(medA, "2026-06-15", "Old")

    updateSideEffectRecord(id, { description: "New" } as UpdateArg)

    expect(readAll()[0]).toMatchObject({
      id,
      description: "New",
      dateRecorded: "2026-06-15",
      userMedicationId: medA,
    })
  })

  it("only changes the row with that id", () => {
    const first = add(medA, "2026-06-15", "First")
    add(medB, "2026-06-16", "Second")

    updateSideEffectRecord(first, { description: "Changed" } as UpdateArg)

    expect(readAll().map((r) => r.description)).toEqual(["Changed", "Second"])
  })

  it("does nothing when there is nothing to update", () => {
    const id = add(medA, "2026-06-15", "Same")

    expect(() => updateSideEffectRecord(id, {} as UpdateArg)).not.toThrow()
    expect(readAll()[0].description).toBe("Same")
  })
})

describe("deleteSideEffectRecord", () => {
  it("removes only that record", () => {
    const keep = add(medA, "2026-06-15", "Keep")
    const remove = add(medB, "2026-06-16", "Remove")

    deleteSideEffectRecord(remove)

    expect(readAll().map((r) => r.id)).toEqual([keep])
  })
})
