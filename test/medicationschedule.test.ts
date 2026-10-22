import { describe, expect, it } from "@jest/globals"

import {
  medicationScheduleEntry,
  ParsedInstructions,
  parseInstructions,
  seraliseInstructions,
} from "../src/application/domain/MedicationScheduleEntry"

const FALLBACK: ParsedInstructions = { foodRule: "none", preferredTime: null, notes: null }

describe("parse Instructions", () => {
  it.each([null, ""])("returns the defaults for %p", (raw) => {
    expect(parseInstructions(raw)).toEqual(FALLBACK)
  })

  it("parses a full JSON payload", () => {
    const raw = JSON.stringify({
      foodRule: "with",
      preferredTime: "08:00",
      notes: "Take with water",
    })
    expect(parseInstructions(raw)).toEqual({
      foodRule: "with",
      preferredTime: "08:00",
      notes: "Take with water",
    })
  })

  it.each(["none", "with", "before", "after"] as const)("accepts foodRule %p", (foodRule) => {
    expect(parseInstructions(JSON.stringify({ foodRule })).foodRule).toBe(foodRule)
  })

  it("falls back to none for an unknown foodRule", () => {
    expect(parseInstructions(JSON.stringify({ foodRule: "banana" })).foodRule).toBe("none")
  })

  it("fills in defaults for missing fields", () => {
    expect(parseInstructions("{}")).toEqual(FALLBACK)
  })

  it("treats non-JSON text as free-text notes", () => {
    expect(parseInstructions("Take with water")).toEqual({
      foodRule: "none",
      preferredTime: null,
      notes: "Take with water",
    })
  })

  it("returns a fresh object each time", () => {
    const a = parseInstructions(null)
    a.notes = "changed"
    expect(parseInstructions(null).notes).toBeNull()
  })
})
describe("seraliseInstructions", () => {
  it("produces JSON that parseInstructions read back unchanged", () => {
    const instructions: ParsedInstructions = {
      foodRule: "after",
      preferredTime: "19:30",
      notes: "Avoid alcohol",
    }
    expect(parseInstructions(seraliseInstructions(instructions))).toEqual(instructions)
  })

  it("seralises to valid JSON", () => {
    expect(JSON.parse(seraliseInstructions(FALLBACK))).toEqual(FALLBACK)
  })
})

describe("medicationScheduleEntry.fromRow", () => {
  const row = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    userMedicationId: 2,
    frequency: 3,
    frequencyType: "Day",
    scheduleTimes: "08:00,12:00,18:00",
    startDate: "2026-01-01",
    endDate: "2026-02-01",
    doseAmount: 500,
    doseUnit: "mg",
    instructions: JSON.stringify({
      foodRule: "with",
      preferredTime: "08:00",
      notes: "Take with water",
    }),
    enabled: 1,
    ...overrides,
  })

  it("maps every column", () => {
    expect(medicationScheduleEntry.fromRow(row())).toMatchObject({
      id: 1,
      userMedicationId: 2,
      frequency: 3,
      frequencyType: "Day",
      startDate: "2026-01-01",
      endDate: "2026-02-01",
      doseAmount: 500,
      doseUnit: "mg",
      instructions: {
        foodRule: "with",
        preferredTime: "08:00",
        notes: "Take with water",
      },
      enabled: true,
    })
  })

  it.each([
    [0, 1],
    ["abc", 1],
    [undefined, 1],
    ["2", 2],
  ])("reads frequency %p as %p", (frequency, expected) => {
    expect(medicationScheduleEntry.fromRow(row({ frequency })).frequency).toBe(expected)
  })

  it("defaults frequencyType to day", () => {
    expect(medicationScheduleEntry.fromRow(row({ frequencyType: undefined })).frequencyType).toBe(
      "Day",
    )
    expect(medicationScheduleEntry.fromRow(row({ frequencyType: null })).frequencyType).toBe("Day")
  })

  it.each([
    [null, []],
    [undefined, []],
    ["", []],
    ["08:00", ["08:00"]],
    ["08:00,,12:00", ["08:00", "12:00"]],
  ])("splits scheduledTimes %p into %p", (scheduledTimes, expected) => {
    expect(medicationScheduleEntry.fromRow(row({ scheduledTimes })).times).toEqual(expected)
  })

  it("uses null for a missing end date", () => {
    expect(medicationScheduleEntry.fromRow(row({ endDate: undefined })).endDate).toBeNull()
    expect(medicationScheduleEntry.fromRow(row({ endDate: null })).endDate).toBeNull()
  })

  it("parse instructions, faling back to defaults or free-text notes", () => {
    expect(medicationScheduleEntry.fromRow(row({ instructions: null })).instructions).toEqual(
      FALLBACK,
    )
    expect(
      medicationScheduleEntry.fromRow(row({ instructions: "With water" })).instructions,
    ).toEqual({ foodRule: "none", preferredTime: null, notes: "With water" })
  })

  it.each([
    [1, true],
    ["1", true],
    ["true", true],
    [true, true],
    [0, false],
    ["0", false],
    ["false", false],
    [false, false],
    [null, false],
    [undefined, false],
  ])("reads enabled=%p as %p", (enabled, expected) => {
    expect(medicationScheduleEntry.fromRow(row({ enabled })).enabled).toBe(expected)
  })
})

describe("medicationScheduleEntry scheduling helpers", () => {
  const makeEntry = (
    o: {
      frequency?: number
      frequencyType?: string
      startDate?: string
      endDate?: string | null
    } = {},
  ) =>
    new medicationScheduleEntry(
      1,
      2,
      o.frequency ?? 1,
      o.frequencyType ?? "Day",
      [],
      o.startDate ?? "2026-01-01",
      o.endDate ?? null,
      500,
      "mg",
      FALLBACK,
      true,
    )

  describe("doses per day", () => {
    it.each([
      [3, "Day", 3],
      [3, "day", 3],
      [0, "Day", 1],
      [-2, "Day", 1],
      [3, "Week", 1],
      [2, "Month", 1],
    ])("frequency %i per %s gives %i dose(s) a day", (frequency, frequencyType, expected) => {
      expect(makeEntry({ frequency, frequencyType }).dosesPerDay).toBe(expected)
    })
  })

  describe("intervalDays", () => {
    it.each([
      [1, "Day", 1],
      [5, "Day", 1],
      [1, "Week", 7],
      [2, "Week", 4],
      [3, "Week", 2],
      [7, "Week", 1],
      [14, "Week", 1],
      [1, "WEEK", 7],
      [1, "Month", 30],
      [2, "Month", 15],
      [3, "Month", 10],
      [4, "Month", 8],
      [0, "Week", 7],
      [1, "Year", 1],
    ])("frequency %i per %s is every %i day(s)", (frequency, frequencyType, expected) => {
      expect(makeEntry({ frequency, frequencyType }).intervalDays).toBe(expected)
    })
  })

  describe("is Active On", () => {
    const entry = makeEntry({ startDate: "2026-01-01", endDate: "2026-01-31" })

    it("is active on the start date", () => {
      expect(entry.isActiveOn("2026-01-01")).toBe(true)
    })

    it("is active on the end date", () => {
      expect(entry.isActiveOn("2026-01-31")).toBe(true)
    })

    it("is active between the dates", () => {
      expect(entry.isActiveOn("2026-01-15")).toBe(true)
    })

    it("is inactive before the start date", () => {
      expect(entry.isActiveOn("2025-12-31")).toBe(false)
    })

    it("is inactive after the end date", () => {
      expect(entry.isActiveOn("2026-02-01")).toBe(false)
    })

    it("only compares the date part of an ISO timestamp", () => {
      expect(entry.isActiveOn("2026-01-15T09:30:00Z")).toBe(true)
      expect(entry.isActiveOn("2026-02-01T00:00:00Z")).toBe(false)
    })

    it("handles timestamps stored in the start and end dates", () => {
      const withTimes = makeEntry({
        startDate: "2026-01-01T09:00:00",
        endDate: "2026-01-31T23:59:00",
      })
      expect(withTimes.isActiveOn("2026-01-01")).toBe(true)
      expect(withTimes.isActiveOn("2026-01-31")).toBe(true)
    })

    it("has no upper limit when there is no end date", () => {
      const open = makeEntry({ startDate: "2026-01-01", endDate: null })
      expect(open.isActiveOn("2030-06-01")).toBe(true)
      expect(open.isActiveOn("2025-12-31")).toBe(false)
    })

    it("has no lower limit when the start date is empty", () => {
      expect(makeEntry({ startDate: "" }).isActiveOn("1999-01-01")).toBe(true)
    })
  })
})
