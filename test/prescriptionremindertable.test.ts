import { beforeEach, describe, expect, it, jest } from "@jest/globals"

import {
  seedUserMedication,
  seedPrescription,
  useFreshDatabase as setupFreshDatabase,
} from "./setupdb"
import {
  addPrescriptionReminder,
  deletePrescriptionReminder,
  getAllPrescriptionReminders,
  getCurrentPrescriptionReminders,
  updatePrescriptionReminder,
} from "../src/data/local/sqlite/prescriptionReminder"

jest.mock("../src/data/local/sqlite/database", () => require("./db"))

setupFreshDatabase()

type AddArg = Parameters<typeof addPrescriptionReminder>[0]
type UpdateArg = Parameters<typeof updatePrescriptionReminder>[1]

let prescriptionId: number

beforeEach(() => {
  prescriptionId = seedPrescription(seedUserMedication())
})

const add = (overrides = {}) =>
  addPrescriptionReminder({
    prescriptionId,
    reminderDate: "2026-07-01",
    leadTime: 3,
    enabled: 1,
    ...overrides,
  } as AddArg)

describe("addPrescriptionReminder", () => {
  it("stores every field and returns the new id", () => {
    const id = add()

    expect(getAllPrescriptionReminders()).toEqual([
      { id, prescriptionId, reminderDate: "2026-07-01", leadTime: 3, enabled: 1 },
    ])
  })

  it("stores a null lead time", () => {
    add({ leadTime: null })

    expect(getAllPrescriptionReminders()[0].leadTime).toBeNull()
  })
})

describe("getAllPrescriptionReminders", () => {
  it("returns an empty list when there are none", () => {
    expect(getAllPrescriptionReminders()).toEqual([])
  })

  it("is sorted by reminder date", () => {
    add({ reminderDate: "2026-09-01" })
    add({ reminderDate: "2026-07-01" })
    add({ reminderDate: "2026-08-01" })

    expect(getAllPrescriptionReminders().map((r) => r.reminderDate)).toEqual([
      "2026-07-01",
      "2026-08-01",
      "2026-09-01",
    ])
  })
})

describe("getCurrentPrescriptionReminders", () => {
  it("returns only enabled reminders, sorted by date", () => {
    add({ reminderDate: "2026-09-01", enabled: 1 })
    add({ reminderDate: "2026-08-01", enabled: 0 })
    add({ reminderDate: "2026-07-01", enabled: 1 })

    expect(getCurrentPrescriptionReminders().map((r) => r.reminderDate)).toEqual([
      "2026-07-01",
      "2026-09-01",
    ])
  })

  it("returns an empty list when all are disabled", () => {
    add({ enabled: 0 })

    expect(getCurrentPrescriptionReminders()).toEqual([])
  })
})

describe("updatePrescriptionReminder", () => {
  it("changes only the fields it is given", () => {
    const id = add()

    updatePrescriptionReminder(id, { reminderDate: "2026-09-01", enabled: 0 } as UpdateArg)

    expect(getAllPrescriptionReminders()[0]).toEqual({
      id,
      prescriptionId,
      reminderDate: "2026-09-01",
      leadTime: 3,
      enabled: 0,
    })
  })

  it("only changes the row with that id", () => {
    const first = add({ reminderDate: "2026-07-01" })
    add({ reminderDate: "2026-08-01" })

    updatePrescriptionReminder(first, { enabled: 0 } as UpdateArg)

    expect(getAllPrescriptionReminders().map((r) => r.enabled)).toEqual([0, 1])
  })

  it("does nothing when there is nothing to update", () => {
    const id = add()

    expect(() => updatePrescriptionReminder(id, {} as UpdateArg)).not.toThrow()
    expect(getAllPrescriptionReminders()[0].enabled).toBe(1)
  })
})

describe("deletePrescriptionReminder", () => {
  it("removes only that reminder", () => {
    const keep = add({ reminderDate: "2026-07-01" })
    const remove = add({ reminderDate: "2026-08-01" })

    deletePrescriptionReminder(remove)

    expect(getAllPrescriptionReminders().map((r) => r.id)).toEqual([keep])
  })
})
