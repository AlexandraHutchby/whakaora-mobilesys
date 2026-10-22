import { beforeEach, describe, expect, it, jest } from "@jest/globals"

import { seedUserMedication, useFreshDatabase as setupFreshDatabase } from "./setupdb"
import {
  addInteractionRecord,
  deleteInteractionRecord,
  getAllInteractionRecords,
  updateInteractionRecords,
} from "../src/data/local/sqlite/interactionRecord"

jest.mock("../src/data/local/sqlite/database", () => require("./db"))

setupFreshDatabase()

type AddArg = Parameters<typeof addInteractionRecord>[0]

let medA: number
let medB: number
let medC: number

beforeEach(() => {
  medA = seedUserMedication("A")
  medB = seedUserMedication("B")
  medC = seedUserMedication("C")
})

const add = (userMedicationId: number, interactingMedicationId: number, overrides = {}) =>
  addInteractionRecord({
    userMedicationId,
    interactingMedicationId,
    description: null,
    notes: null,
    dateRecorded: "2026-03-15T10:00:00.000Z",
    ...overrides,
  } as AddArg)

describe("addInteractionRecord", () => {
  it("stores every field and returns the new id", () => {
    const id = add(medA, medB, { description: "Increases bleeding risk", notes: "Space doses" })

    expect(getAllInteractionRecords()).toEqual([
      {
        id,
        userMedicationId: medA,
        interactingMedicationId: medB,
        description: "Increases bleeding risk",
        notes: "Space doses",
        dateRecorded: "2026-03-15T10:00:00.000Z",
      },
    ])
  })

  it("stores null description and notes", () => {
    add(medA, medB)

    expect(getAllInteractionRecords()[0]).toMatchObject({ description: null, notes: null })
  })
})

describe("getAllInteractionRecords", () => {
  it("returns an empty list when there are none", () => {
    expect(getAllInteractionRecords()).toEqual([])
  })

  it("is sorted by the user medication id", () => {
    add(medC, medA)
    add(medA, medB)
    add(medB, medC)

    expect(getAllInteractionRecords().map((r) => r.userMedicationId)).toEqual([medA, medB, medC])
  })
})

describe("updateInteractionRecords", () => {
  it("changes only the fields it is given", () => {
    const id = add(medA, medB, { description: "Old", notes: "Keep" })

    updateInteractionRecords(id, { description: "New" })

    expect(getAllInteractionRecords()[0]).toMatchObject({
      id,
      description: "New",
      notes: "Keep",
      userMedicationId: medA,
    })
  })

  it("can set a field to null", () => {
    const id = add(medA, medB, { notes: "Something" })

    updateInteractionRecords(id, { notes: null })

    expect(getAllInteractionRecords()[0].notes).toBeNull()
  })

  it("only changes the row with that id", () => {
    const first = add(medA, medB, { description: "First" })
    add(medB, medC, { description: "Second" })

    updateInteractionRecords(first, { description: "Changed" })

    expect(getAllInteractionRecords().map((r) => r.description)).toEqual(["Changed", "Second"])
  })

  it("does nothing when there is nothing to update", () => {
    const id = add(medA, medB, { description: "Same" })

    expect(() => updateInteractionRecords(id, {})).not.toThrow()
    expect(getAllInteractionRecords()[0].description).toBe("Same")
  })
})

describe("deleteInteractionRecord", () => {
  it("removes only that record", () => {
    const keep = add(medA, medB)
    const remove = add(medB, medC)

    deleteInteractionRecord(remove)

    expect(getAllInteractionRecords().map((r) => r.id)).toEqual([keep])
  })
})
