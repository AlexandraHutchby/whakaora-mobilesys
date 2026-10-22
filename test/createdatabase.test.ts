import { beforeEach, describe, expect, it, jest } from "@jest/globals"

import { resetTestDb } from "./db"
import { seedUserMedication } from "./setupdb"
import { initialiseDatabase } from "../src/data/local/sqlite/create_database"
import db from "../src/data/local/sqlite/database"

jest.mock("../src/data/local/sqlite/database", () => require("./db"))

const EXPECTED_COLUMNS: Record<string, string[]> = {
  medicationReference: [
    "id",
    "medicationName",
    "commonName",
    "commonUse",
    "contraIndication",
    "cautions",
    "sideEffects",
    "patientAdvice",
  ],
  userMedication: ["id", "medicationReferenceId", "medicationName", "customName"],
  mealSchedule: ["id", "mealType", "scheduleTime", "enabled"],
  medicationSchedule: [
    "id",
    "userMedicationId",
    "frequency",
    "frequencyType",
    "scheduleTime",
    "startDate",
    "endDate",
    "doseAmount",
    "doseUnit",
    "instructions",
    "enabled",
  ],
  reminder: ["id", "scheduleId", "reminderDateTime", "reminderType", "enabled", "snoozeDuration"],
  prescription: [
    "id",
    "userMedicationId",
    "quantityReceived",
    "repeatCount",
    "expiryDate",
    "nextPrescriptionDate",
    "reminderLeadTime",
    "status",
  ],
  prescriptionReminder: ["id", "prescriptionId", "reminderDate", "leadTime", "enabled"],
  sideEffectRecord: ["id", "userMedicationId", "dateRecorded", "description"],
  doseRecord: ["id", "scheduleId", "scheduleDateTime", "actualTakenDateTime", "status"],
  interactionRecord: [
    "id",
    "userMedicationId",
    "interactingMedicationId",
    "description",
    "notes",
    "dateRecorded",
  ],
}

const EXPECTED_PARENTS: [string, string[]][] = [
  ["userMedication", ["medicationReference"]],
  ["medicationSchedule", ["userMedication"]],
  ["reminder", ["medicationSchedule"]],
  ["prescription", ["userMedication"]],
  ["prescriptionReminder", ["prescription"]],
  ["sideEffectRecord", ["userMedication"]],
  ["doseRecord", ["medicationSchedule"]],
  ["interactionRecord", ["userMedication"]],
]

const tableNames = (): string[] =>
  db
    .execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .rows?._array?.map((r: { name: string }) => r.name) ?? [].sort()

const columnsOf = (table: string): string[] =>
  db.execute(`PRAGMA table_info(${table})`).rows?._array?.map((c: { name: string }) => c.name) ?? []

const parentsOf = (table: string): string[] =>
  [
    ...new Set(
      db
        .execute(`PRAGMA foreign_key_list(${table})`)
        .rows?._array.map((fk: { table: string }) => fk.table),
    ),
  ].sort()

beforeEach(() => {
  resetTestDb()
  initialiseDatabase()
})

describe("initialise database", () => {
  it("creates every table", () => {
    expect(tableNames()).toEqual(Object.keys(EXPECTED_COLUMNS).sort())
  })

  it.each(Object.entries(EXPECTED_COLUMNS))("%s has the expected columns", (table, columns) => {
    expect(columnsOf(table)).toEqual(columns)
  })

  it.each(EXPECTED_PARENTS)("%s references %p", (table, parents) => {
    expect(parentsOf(table)).toEqual(parents)
  })

  it("can be run more than once", () => {
    expect(() => initialiseDatabase()).not.toThrow()
    expect(tableNames()).toEqual(Object.keys(EXPECTED_COLUMNS).sort())
  })

  it("keeps existing data when run again", () => {
    seedUserMedication("Paracetamol")

    initialiseDatabase()

    const rows = db.execute("SELECT medicationName FROM userMedication").rows?._array
    expect(rows).toEqual([{ medicationName: "Paracetamol" }])
  })
})
