import { beforeEach, describe, expect, it, jest } from "@jest/globals"

import { isoDate, seedUserMedication, useFreshDatabase as setupFreshDatabase } from "./setupdb"
import {
  addMedicationSchedule,
  deleteMedicationSchedule,
  getAllMedicationSchedule,
  getCurrentMedicationSchedule,
  updateMedicationSchedule,
} from "../src/data/local/sqlite/medicationSchedule"

jest.mock("../src/data/local/sqlite/database", () => require("./db"))

setupFreshDatabase()

let userMedicationId: number

beforeEach(() => {
  userMedicationId = seedUserMedication()
})

const add = (overrides = {}) =>
  addMedicationSchedule({
    userMedicationId,
    frequency: 2,
    frequencyType: "Day",
    scheduleTime: "08:00,20:00",
    startDate: "2026-01-01",
    endDate: null,
    doseAmount: 500,
    doseUnit: "mg",
    instructions: '{"foodRule":"with"}',
    enabled: "1",
    ...overrides,
  })

describe("addMedicationSchedule", () => {
  it("stores every field and returns the new id", () => {
    const id = add({ endDate: "2026-12-31" })

    expect(getAllMedicationSchedule()).toEqual([
      {
        id,
        userMedicationId,
        frequency: 2,
        frequencyType: "Day",
        scheduleTime: "08:00,20:00",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        doseAmount: 500,
        doseUnit: "mg",
        instructions: '{"foodRule":"with"}',
        enabled: "1",
      },
    ])
  })

  it("stores null for an open-ended schedule and for missing instructions", () => {
    add({ endDate: null, instructions: null })

    expect(getAllMedicationSchedule()[0]).toMatchObject({ endDate: null, instructions: null })
  })
})

describe("getAllMedicationSchedule", () => {
  it("returns an empty list when there are none", () => {
    expect(getAllMedicationSchedule()).toEqual([])
  })

  it("is sorted by schedule time", () => {
    add({ scheduleTime: "20:00" })
    add({ scheduleTime: "07:00" })
    add({ scheduleTime: "12:00" })

    expect(getAllMedicationSchedule().map((s) => s.scheduleTime)).toEqual([
      "07:00",
      "12:00",
      "20:00",
    ])
  })
})

describe("getCurrentMedicationSchedule", () => {
  it("returns open-ended and future-ending schedules, sorted by time, and skips finished ones", () => {
    add({ scheduleTime: "10:00", endDate: null })
    add({ scheduleTime: "08:00", endDate: isoDate(30) })
    add({ scheduleTime: "09:00", endDate: isoDate(-30) })

    expect(getCurrentMedicationSchedule().map((s) => s.scheduleTime)).toEqual(["08:00", "10:00"])
  })

  it("includes a schedule whose last day is today", () => {
    add({ endDate: isoDate(0) })

    expect(getCurrentMedicationSchedule()).toHaveLength(1)
  })

  it("returns an empty list when there are no schedules", () => {
    expect(getCurrentMedicationSchedule()).toEqual([])
  })
})

describe("updateMedicationSchedule", () => {
  it("changes only the fields it is given", () => {
    const id = add()

    updateMedicationSchedule(id, { scheduleTime: "09:00", enabled: "0" })

    expect(getAllMedicationSchedule()[0]).toMatchObject({
      id,
      scheduleTime: "09:00",
      enabled: "0",
      frequency: 2,
      doseUnit: "mg",
    })
  })

  it("can clear the end date", () => {
    const id = add({ endDate: "2026-12-31" })

    updateMedicationSchedule(id, { endDate: null })

    expect(getAllMedicationSchedule()[0].endDate).toBeNull()
  })

  it("only changes the row with that id", () => {
    const first = add({ scheduleTime: "08:00" })
    add({ scheduleTime: "12:00" })

    updateMedicationSchedule(first, { doseAmount: 1000 })

    const byTime = Object.fromEntries(getAllMedicationSchedule().map((s) => [s.scheduleTime, s]))
    expect(byTime["08:00"].doseAmount).toBe(1000)
    expect(byTime["12:00"].doseAmount).toBe(500)
  })

  it("does nothing when there is nothing to update", () => {
    const id = add()

    expect(() => updateMedicationSchedule(id, {})).not.toThrow()
    expect(getAllMedicationSchedule()[0].doseAmount).toBe(500)
  })
})

describe("deleteMedicationSchedule", () => {
  it("removes only that schedule", () => {
    const keep = add({ scheduleTime: "08:00" })
    const remove = add({ scheduleTime: "12:00" })

    deleteMedicationSchedule(remove)

    expect(getAllMedicationSchedule().map((s) => s.id)).toEqual([keep])
  })
})
