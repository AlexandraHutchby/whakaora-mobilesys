import { beforeEach, describe, expect, it, jest } from "@jest/globals"

import {
  seedUserMedication,
  seedMedicationSchedule,
  useFreshDatabase as setupFreshDatabase,
} from "./setupdb"
import db from "../src/data/local/sqlite/database"
import {
  addReminder,
  deleteReminder,
  getAllReminders,
  getCurrentReminders,
  updateReminder,
} from "../src/data/local/sqlite/reminder"

jest.mock("../src/data/local/sqlite/database", () => require("./db"))

setupFreshDatabase()

type AddArg = Parameters<typeof addReminder>[0]
type UpdateArg = Parameters<typeof updateReminder>[1]

let scheduleId: number

beforeEach(() => {
  scheduleId = seedMedicationSchedule(seedUserMedication())
})

const insertReminder = (reminderDateTime: string, enabled = 1): number =>
  db.execute(
    `INSERT INTO reminder (scheduleId, reminderDateTime, reminderType, enabled, snoozeDuration)
     VALUES (?, ?, 'push', ?, 10)`,
    [scheduleId, reminderDateTime, enabled],
  ).insertId as number

describe("addReminder", () => {
  it("stores every field and returns the new id", () => {
    const id = addReminder({
      scheduleId,
      reminderDateTime: "2026-06-15T08:00",
      reminderType: "push",
      enabled: 1,
      snoozeDuration: 10,
    } as AddArg)

    expect(getAllReminders()).toEqual([
      {
        id,
        scheduleId,
        reminderDateTime: "2026-06-15T08:00",
        reminderType: "push",
        enabled: 1,
        snoozeDuration: 10,
      },
    ])
  })

  it("stores null for the optional fields", () => {
    addReminder({
      scheduleId,
      reminderDateTime: null,
      reminderType: null,
      enabled: 1,
      snoozeDuration: null,
    } as AddArg)

    expect(getAllReminders()[0]).toMatchObject({
      reminderDateTime: null,
      reminderType: null,
      snoozeDuration: null,
    })
  })
})

describe("getAllReminders", () => {
  it("returns an empty list when there are none", () => {
    expect(getAllReminders()).toEqual([])
  })

  it("is sorted by reminder time", () => {
    insertReminder("2026-06-15T20:00")
    insertReminder("2026-06-15T08:00")
    insertReminder("2026-06-15T12:00")

    expect(getAllReminders().map((r) => r.reminderDateTime)).toEqual([
      "2026-06-15T08:00",
      "2026-06-15T12:00",
      "2026-06-15T20:00",
    ])
  })
})

describe("getCurrentReminders", () => {
  it("returns only enabled reminders, sorted by time", () => {
    insertReminder("2026-06-15T20:00", 1)
    insertReminder("2026-06-15T12:00", 0)
    insertReminder("2026-06-15T08:00", 1)

    expect(getCurrentReminders().map((r) => r.reminderDateTime)).toEqual([
      "2026-06-15T08:00",
      "2026-06-15T20:00",
    ])
  })

  it("returns an empty list when all are disabled", () => {
    insertReminder("2026-06-15T08:00", 0)

    expect(getCurrentReminders()).toEqual([])
  })
})

describe("updateReminder", () => {
  it("changes only the fields it is given", () => {
    const id = insertReminder("2026-06-15T08:00", 1)

    updateReminder(id, { enabled: 0, snoozeDuration: 5 } as UpdateArg)

    expect(getAllReminders()[0]).toMatchObject({
      id,
      enabled: 0,
      snoozeDuration: 5,
      reminderDateTime: "2026-06-15T08:00",
      reminderType: "push",
    })
  })

  it("only changes the row with that id", () => {
    const first = insertReminder("2026-06-15T08:00")
    insertReminder("2026-06-15T12:00")

    updateReminder(first, { enabled: 0 } as UpdateArg)

    expect(getAllReminders().map((r) => r.enabled)).toEqual([0, 1])
  })

  it("does nothing when there is nothing to update", () => {
    const id = insertReminder("2026-06-15T08:00")

    expect(() => updateReminder(id, {} as UpdateArg)).not.toThrow()
    expect(getAllReminders()[0].enabled).toBe(1)
  })
})

describe("deleteReminder", () => {
  it("removes only that reminder", () => {
    const keep = insertReminder("2026-06-15T08:00")
    const remove = insertReminder("2026-06-15T12:00")

    deleteReminder(remove)

    expect(getAllReminders().map((r) => r.id)).toEqual([keep])
  })
})
