import { beforeEach, describe, expect, it, jest } from "@jest/globals"

import {
  seedMedicationSchedule,
  seedUserMedication,
  useFreshDatabase as setupFreshDatabase,
} from "./setupdb"
import db from "../src/data/local/sqlite/database"
import {
  addDoseRecord,
  deleteDoseRecord,
  getAllDoseRecords,
  getMissedDoses,
  updateDoseRecord,
} from "../src/data/local/sqlite/doseRecord"

setupFreshDatabase()

jest.mock("../src/data/local/sqlite/database", () => require("./db"))

type AddArg = Parameters<typeof addDoseRecord>[0]
type UpdateArg = Parameters<typeof updateDoseRecord>[1]

let scheduleId: number

beforeEach(() => {
  scheduleId = seedMedicationSchedule(seedUserMedication())
})

const insertDose = (scheduleDateTime: string, actual: string, status = "taken"): number =>
  db.execute(
    `INSERT INTO doseRecord (scheduleId, scheduleDateTime, actualTakenDateTime, status)
     VALUES (?, ?, ?, ?)`,
    [scheduleId, scheduleDateTime, actual, status],
  ).insertId as number

const rawRow = (id: number) =>
  db.execute("SELECT * FROM doseRecord WHERE id = ?", [id]).rows?._array[0]

describe("addDoseRecord", () => {
  it("stores the dose and returns its id", () => {
    const id = addDoseRecord({
      scheduleId,
      scheduleDateTime: "2026-06-15T08:00",
      actualTakenDateTime: "2026-06-15T08:05",
      status: "taken",
    } as AddArg)

    expect(id).toBeGreaterThan(0)
    expect(rawRow(id)).toEqual({
      id,
      scheduleId,
      scheduleDateTime: "2026-06-15T08:00",
      actualTakenDateTime: "2026-06-15T08:05",
      status: "taken",
    })
  })
})

describe("getAllDoseRecords", () => {
  it("returns an empty list when there are none", () => {
    expect(getAllDoseRecords()).toEqual([])
  })

  it("returns the newest scheduled doses first", () => {
    insertDose("2026-06-14T08:00", "2026-06-14T08:00")
    insertDose("2026-06-16T08:00", "2026-06-16T08:00")
    insertDose("2026-06-15T08:00", "2026-06-15T08:00")

    expect(getAllDoseRecords().map((d) => d.scheduleDateTime)).toEqual([
      "2026-06-16T08:00",
      "2026-06-15T08:00",
      "2026-06-14T08:00",
    ])
  })
})

describe("getMissedDoses", () => {
  it("runs against the real schema", () => {
    insertDose("2026-06-15T08:00", "2026-06-15T08:05")

    expect(() => getMissedDoses()).not.toThrow()
  })

  it.todo(
    "returns doses that were missed (decide what counts as missed: a status value, or no time taken)",
  )
})

describe("updateDoseRecord", () => {
  it("changes only the fields it is given", () => {
    const id = insertDose("2026-06-15T08:00", "2026-06-15T08:05", "taken")

    updateDoseRecord(id, { status: "missed" } as UpdateArg)

    expect(rawRow(id)).toMatchObject({
      status: "missed",
      scheduleDateTime: "2026-06-15T08:00",
      actualTakenDateTime: "2026-06-15T08:05",
    })
  })

  it("only changes the row with that id", () => {
    const first = insertDose("2026-06-15T08:00", "2026-06-15T08:00", "taken")
    const second = insertDose("2026-06-16T08:00", "2026-06-16T08:00", "taken")

    updateDoseRecord(first, { status: "missed" } as UpdateArg)

    expect(rawRow(second).status).toBe("taken")
  })

  it("does nothing when there is nothing to update", () => {
    const id = insertDose("2026-06-15T08:00", "2026-06-15T08:00", "taken")

    expect(() => updateDoseRecord(id, {} as UpdateArg)).not.toThrow()
    expect(rawRow(id).status).toBe("taken")
  })
})

describe("deleteDoseRecord", () => {
  it("removes only that dose", () => {
    const keep = insertDose("2026-06-15T08:00", "2026-06-15T08:00")
    const remove = insertDose("2026-06-16T08:00", "2026-06-16T08:00")

    deleteDoseRecord(remove)

    expect(rawRow(remove)).toBeUndefined()
    expect(rawRow(keep)).toBeDefined()
  })
})
