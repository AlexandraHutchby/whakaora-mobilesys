import { beforeEach, describe, expect, it, jest } from "@jest/globals"

import { seedUserMedication, useFreshDatabase as setupFreshDatabase } from "./setupdb"
import {
  addPrescription,
  deletePrescription,
  getAllPrescriptions,
  getCurrentPrescriptions,
  updatePrescription,
} from "../src/data/local/sqlite/prescription"

jest.mock("../src/data/local/sqlite/database", () => require("./db"))

setupFreshDatabase()

type AddArg = Parameters<typeof addPrescription>[0]
type UpdateArg = Parameters<typeof updatePrescription>[1]

let medA: number
let medB: number

beforeEach(() => {
  medA = seedUserMedication("A")
  medB = seedUserMedication("B")
})

const add = (userMedicationId: number, overrides = {}) =>
  addPrescription({
    userMedicationId,
    quantityReceived: 30,
    repeatCount: 2,
    expiryDate: "2026-12-31",
    nextPrescriptionDate: "2026-07-01",
    reminderLeadTime: 3,
    status: 1,
    ...overrides,
  } as AddArg)

describe("addPrescription", () => {
  it("stores every field and returns the new id", () => {
    const id = add(medA)

    expect(getAllPrescriptions()).toEqual([
      {
        id,
        userMedicationId: medA,
        quantityReceived: 30,
        repeatCount: 2,
        expiryDate: "2026-12-31",
        nextPrescriptionDate: "2026-07-01",
        reminderLeadTime: 3,
        status: 1,
      },
    ])
  })

  it("stores null for the optional fields", () => {
    add(medA, {
      repeatCount: null,
      expiryDate: null,
      nextPrescriptionDate: null,
      reminderLeadTime: null,
    })

    expect(getAllPrescriptions()[0]).toMatchObject({
      repeatCount: null,
      expiryDate: null,
      nextPrescriptionDate: null,
      reminderLeadTime: null,
    })
  })
})

describe("getAllPrescriptions", () => {
  it("returns an empty list when there are none", () => {
    expect(getAllPrescriptions()).toEqual([])
  })

  it("is sorted by user medication id", () => {
    add(medB)
    add(medA)

    expect(getAllPrescriptions().map((p) => p.userMedicationId)).toEqual([medA, medB])
  })
})

describe("getCurrentPrescriptions", () => {
  it("returns only current prescriptions", () => {
    add(medA, { status: 1 })
    add(medB, { status: 0 })

    expect(getCurrentPrescriptions().map((p) => p.userMedicationId)).toEqual([medA])
  })

  it("returns an empty list when none are current", () => {
    add(medA, { status: 0 })

    expect(getCurrentPrescriptions()).toEqual([])
  })
})

describe("updatePrescription", () => {
  it("changes only the fields it is given", () => {
    const id = add(medA)

    updatePrescription(id, { quantityReceived: 60, status: 0 } as UpdateArg)

    expect(getAllPrescriptions()[0]).toMatchObject({
      id,
      quantityReceived: 60,
      status: 0,
      repeatCount: 2,
      expiryDate: "2026-12-31",
    })
  })

  it("only changes the row with that id", () => {
    const first = add(medA)
    add(medB)

    updatePrescription(first, { quantityReceived: 99 } as UpdateArg)

    expect(getAllPrescriptions().map((p) => p.quantityReceived)).toEqual([99, 30])
  })

  it("does nothing when there is nothing to update", () => {
    const id = add(medA)

    expect(() => updatePrescription(id, {} as UpdateArg)).not.toThrow()
    expect(getAllPrescriptions()[0].quantityReceived).toBe(30)
  })
})

describe("deletePrescription", () => {
  it("removes only that prescription", () => {
    const keep = add(medA)
    const remove = add(medB)

    deletePrescription(remove)

    expect(getAllPrescriptions().map((p) => p.id)).toEqual([keep])
  })
})
