import { describe, expect, it, jest } from "@jest/globals"

import { resetTestDb } from "./db"
import {
  seedMedicationReference,
  seedMedicationSchedule,
  seedPrescription,
  seedUserMedication,
  useFreshDatabase,
} from "./setupdb"
import db from "../src/data/local/sqlite/database"
import { resetDatabase, wipeDatabase } from "../src/data/local/sqlite/resetDatabase"

jest.mock("../src/data/local/sqlite/database", () => require("./db"))

const ALL_TABLES = [
  "doseRecord",
  "interactionRecord",
  "mealSchedule",
  "medicationReference",
  "medicationSchedule",
  "prescription",
  "prescriptionReminder",
  "reminder",
  "sideEffectRecord",
  "userMedication",
]

const tableNames = (): string[] =>
  db
    .execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name not LIKE 'sqlite_%'")
    .rows?._array.map((r: { name: string }) => r.name)
    .sort() ?? []

const countRows = (table: string): number =>
  db.execute(`SELECT COUNT(*) AS count from ${table}`).rows?._array[0].count

function seedEverything(): void {
  const referenceId = seedMedicationReference()
  const medicationId = db.execute(
    "INSERT INTO userMedication(medicationReferenceId, medicationName, customName) VALUES(?, 'Linked', NULL)",
    [referenceId],
  ).insertId as number
  const otherMedicationId = seedUserMedication("Other")
  const scheduleId = seedMedicationSchedule(medicationId)
  const prescriptionId = seedPrescription(medicationId)

  db.execute(
    `INSERT INTO doseRecord(scheduleId, scheduleDateTime, actualTakenDateTime, status)
    VALUES(?, '2026-06-15T08:00', '2026-06-15T08:05', 'taken')`,
    [scheduleId],
  )
  db.execute(
    "INSERT INTO prescriptionReminder(prescriptionId, reminderDate, leadTime, enabled) VALUES (?, '2026-07-01', 3, 1)",
    [prescriptionId],
  )
  db.execute(
    "INSERT INTO reminder (scheduleId, reminderDateTime, reminderType, enabled, snoozeDuration) VALUES (?, '2026-06-15T08:00', 'push', 1, 5)",
    [scheduleId],
  )
  db.execute(
    "INSERT INTO sideEffectRecord (userMedicationId, dateRecorded, description) VALUES (?, '2026-06-15', 'Nausea')",
    [medicationId],
  )
  db.execute(
    "INSERT INTO interactionRecord (userMedicationId, interactingMedicationId, description, notes, dateRecorded) VALUES (?, ?, ?, ?, ?)",
    [medicationId, otherMedicationId, null, null, "2026-06-15"],
  )
  db.execute(
    "INSERT INTO mealSchedule (mealType, scheduleTime, enabled) VALUES ('Breakfast', '08:00', 1)",
  )
}

describe("wipe database", () => {
  useFreshDatabase()

  it("drops every table", () => {
    wipeDatabase()
    expect(tableNames()).toEqual([])
  })

  it("drops tables that still contain linked rows (children before parents)", () => {
    seedEverything()
    db.execute("PRAGMA foreign_keys = ON")
    expect(() => wipeDatabase()).not.toThrow()
    expect(tableNames()).toEqual([])
  })

  it("does nothing harmful on a database with no tables", () => {
    resetTestDb()

    expect(() => wipeDatabase()).not.toThrow()
  })
})

describe("reset database", () => {
  useFreshDatabase()

  it("recreates every table", () => {
    resetDatabase()
    expect(tableNames()).toEqual(ALL_TABLES)
  })

  it("removes all existing data", () => {
    seedEverything()

    resetDatabase()

    for (const table of ALL_TABLES) {
      expect(countRows(table)).toBe(0)
    }
  })

  it("works on a database that has never been initialised", () => {
    resetTestDb()

    expect(() => resetDatabase()).not.toThrow()
    expect(tableNames()).toEqual(ALL_TABLES)
  })
})
