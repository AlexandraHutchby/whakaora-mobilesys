import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals"

import { medicationScheduleEntry } from "../src/application/domain/MedicationScheduleEntry"
import { generateSchedule } from "../src/application/domain/Scheduler"
import type { ScheduleResult, SuggestedDose } from "../src/application/domain/Scheduler"
import {
  listMedicationSchedules,
  previewSchedule,
  regenerateSchedule,
  removeMedicationSchedule,
  removeSchedulesForMedication,
  saveMedicationSchedule,
  setScheduleEnabled,
} from "../src/application/services/medicationScheduleService"
import type { SaveScheduleInput } from "../src/application/services/medicationScheduleService"
import { getAllInteractionRecords } from "../src/data/local/sqlite/interactionRecord"
import { getAllMealSchedules } from "../src/data/local/sqlite/mealSchedule"
import {
  addMedicationSchedule,
  deleteMedicationSchedule,
  getAllMedicationSchedule,
  updateMedicationSchedule,
} from "../src/data/local/sqlite/medicationSchedule"
import { getAllUserMedications } from "../src/data/local/sqlite/userMedication"

jest.mock("../src/data/local/sqlite/interactionRecord", () => ({
  getAllInteractionRecords: jest.fn(),
}))
jest.mock("../src/data/local/sqlite/mealSchedule", () => ({
  getAllMealSchedules: jest.fn(),
}))
jest.mock("../src/data/local/sqlite/medicationSchedule", () => ({
  addMedicationSchedule: jest.fn(),
  deleteMedicationSchedule: jest.fn(),
  getAllMedicationSchedule: jest.fn(),
  updateMedicationSchedule: jest.fn(),
}))
jest.mock("../src/data/local/sqlite/userMedication", () => ({
  getAllUserMedications: jest.fn(),
}))

jest.mock("../src/application/domain/Scheduler", () => ({
  ...jest.requireActual<typeof import("../src/application/domain/Scheduler")>(
    "../src/application/domain/Scheduler",
  ),
  generateSchedule: jest.fn(),
}))

const getInteractions = getAllInteractionRecords as jest.Mock
const getMeals = getAllMealSchedules as jest.Mock
const getSchedules = getAllMedicationSchedule as jest.Mock
const addSchedule = addMedicationSchedule as jest.Mock
const updateSchedule = updateMedicationSchedule as jest.Mock
const deleteSchedule = deleteMedicationSchedule as jest.Mock
const getUserMeds = getAllUserMedications as jest.Mock
const generate = generateSchedule as jest.Mock

const TODAY = "2026-10-22"
const EMPTY_RESULT: ScheduleResult = { doses: [], warnings: [] }

const scheduleRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  userMedicationId: 10,
  frequency: 1,
  frequencyType: "Day",
  scheduleTime: "",
  startDate: "2026-01-01",
  endDate: null,
  doseAmount: 500,
  doseUnit: "mg",
  instructions: JSON.stringify({ foodRule: "none", preferredTime: null, notes: null }),
  enabled: 1,
  ...overrides,
})

const userMedRow = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  medicationName: `Medication ${id}`,
  medicationReferenceId: null,
  customName: null,
  ...overrides,
})

const dose = (userMedicationId: number, time: string): SuggestedDose => ({
  userMedicationId,
  name: `Medication ${userMedicationId}`,
  minutes: 0,
  time,
  intervalDays: 1,
  reason: "",
})

const baseInput: SaveScheduleInput = {
  userMedicationId: 10,
  frequency: 2,
  frequencyType: "Day",
  doseAmount: 500,
  doseUnit: "mg",
  foodRule: "with",
  preferredTime: "08:00",
}

const firstCallOrder = (fn: jest.Mock) => fn.mock.invocationCallOrder[0]

beforeEach(() => {
  jest.resetAllMocks()
  jest.useRealTimers()
  jest.setSystemTime(new Date(`${TODAY}T12:00:00.000Z`))

  getUserMeds.mockReturnValue([])
  getSchedules.mockReturnValue([])
  getMeals.mockReturnValue([])
  getInteractions.mockReturnValue([])
  generate.mockReturnValue(EMPTY_RESULT)
})

afterEach(() => {
  jest.useRealTimers()
})

describe("list medication schedules", () => {
  it("maps rows to schedule entries", () => {
    getSchedules.mockReturnValue([
      scheduleRow({ id: 1, scheduleTime: "08:00,12:00" }),
      scheduleRow({ id: 2 }),
    ])

    const entries = listMedicationSchedules()

    expect(entries).toHaveLength(2)
    expect(entries[0]).toBeInstanceOf(medicationScheduleEntry)
    expect(entries[0].times).toEqual(["08:00", "12:00"])
    expect(entries[1].times).toEqual([])
  })

  it("returns an empty list when there are not schedules", () => {
    expect(listMedicationSchedules()).toEqual([])
  })
})

describe("preview schedule", () => {
  it("returns whatever the scheduler produces", () => {
    const result: ScheduleResult = { doses: [dose(10, "09:30")], warnings: ["careful"] }
    generate.mockReturnValue(result)

    expect(previewSchedule()).toBe(result)
  })

  it("maps an entry into a schedulable medicaiton using the display name", () => {
    getUserMeds.mockReturnValue([
      userMedRow(10, { medicationName: "Paracetamol", customName: "Panadol" }),
    ])
    getSchedules.mockReturnValue([
      scheduleRow({
        frequency: 2,
        instructions: JSON.stringify({ foodRule: "before", preferredTime: "07:45", notes: null }),
      }),
    ])

    previewSchedule()

    const [meds] = generate.mock.calls[0] as [
      Array<{ dosesPerDay: number; intervalDays: number; preferredMinutes: number | null }>,
    ]
    expect(meds).toEqual([
      {
        userMedicationId: 10,
        name: "Panadol",
        dosesPerDay: 2,
        intervalDays: 1,
        foodRule: "before",
        preferredMinutes: 465,
      },
    ])
  })

  it("derives interval days from weekly frequencies and leaves preferred minutes null when unset", () => {
    getUserMeds.mockReturnValue([userMedRow(10)])
    getSchedules.mockReturnValue([scheduleRow({ frequency: 1, frequencyType: "Week" })])

    previewSchedule()

    const [meds] = generate.mock.calls[0] as [
      Array<{ dosesPerDay: number; intervalDays: number; preferredMinutes: number | null }>,
    ]
    expect(meds[0]).toMatchObject({ dosesPerDay: 1, intervalDays: 7, preferredMinutes: null })
  })

  it("only schedules enabled, known, currently active entries", () => {
    getUserMeds.mockReturnValue([11, 12, 14, 15, 16].map((id) => userMedRow(id)))
    getSchedules.mockReturnValue([
      scheduleRow({ id: 1, userMedicationId: 11 }),
      scheduleRow({ id: 2, userMedicationId: 12, enabled: 0 }),
      scheduleRow({ id: 3, userMedicationId: 13 }),
      scheduleRow({ id: 4, userMedicationId: 14, endDate: "2026-06-14" }),
      scheduleRow({ id: 5, userMedicationId: 15, startDate: "2026-06-16" }),
      scheduleRow({ id: 6, userMedicationId: 16, endDate: "2026-06-15" }),
    ])

    previewSchedule()

    const [meds] = generate.mock.calls[0] as [Array<{ userMedicationId: number }>]
    expect(meds.map((m: { userMedicationId: number }) => m.userMedicationId)).toEqual([11, 15])
  })

  it("only passes meals that are enabled and have a valid time", () => {
    getMeals.mockReturnValue([
      { id: 1, mealType: "Breakfast", scheduleTime: "08:00", enabled: 1 },
      { id: 2, mealType: "Lunch", scheduleTime: "13:00", enabled: 0 },
      { id: 3, mealType: "Snack", scheduleTime: null, enabled: 1 },
      { id: 4, mealType: "Dinner", scheduleTime: "19:00", enabled: 1 },
    ])

    previewSchedule()

    const [, meals] = generate.mock.calls[0]
    expect(meals).toEqual([
      { mealType: "Breakfast", minutes: 480 },
      { mealType: "Dinner", minutes: 1140 },
    ])
  })

  it("passes interaction records as conflict pairs", () => {
    getInteractions.mockReturnValue([
      { id: 1, userMedicationId: 10, interactingMedicationId: 20 },
      { id: 2, userMedicationId: 30, interactingMedicationId: 40 },
    ])

    previewSchedule()

    const [, , conflicts] = generate.mock.calls[0]
    expect(conflicts).toEqual([
      [10, 20],
      [30, 40],
    ])
  })

  it("calls the scheduler with empty inputs when there is no data", () => {
    previewSchedule()
    expect(generate).toHaveBeenCalledWith([], [], [])
  })
})

describe("regenerate schedule", () => {
  it("returns the scheduler result", () => {
    const result: ScheduleResult = { doses: [], warnings: ["warning"] }
    generate.mockReturnValue(result)

    expect(regenerateSchedule()).toBe(result)
  })

  it("write the new dose times back to a schedule whose times changed", () => {
    getSchedules.mockReturnValue([scheduleRow({ id: 1, userMedicationId: 10, scheduleTime: "" })])
    generate.mockReturnValue({ doses: [dose(10, "09:30")], warnings: [] })

    regenerateSchedule()

    expect(updateSchedule).toHaveBeenCalledTimes(1)
    expect(updateSchedule).toHaveBeenCalledWith(1, { scheduleTime: "09:30" })
  })

  it("joins several doses for the same medication in order", () => {
    getSchedules.mockReturnValue([
      scheduleRow({ id: 2, userMedicationId: 20, scheduleTime: "08:00,12:00" }),
    ])
    generate.mockReturnValue({
      doses: [dose(20, "08:00"), dose(20, "12:00"), dose(20, "18:00")],
      warnings: [],
    })

    regenerateSchedule()
    expect(updateSchedule).toHaveBeenCalledWith(2, { scheduleTime: "08:00,12:00,18:00" })
  })

  it("does not write when the times are unchanged", () => {
    getSchedules.mockReturnValue([
      scheduleRow({ id: 2, userMedicationId: 20, scheduleTime: "08:00,12:00" }),
    ])
    generate.mockReturnValue({ doses: [dose(20, "08:00"), dose(20, "12:00")], warnings: [] })
    regenerateSchedule()
    expect(updateSchedule).not.toHaveBeenCalled()
  })

  it("clears the times of a schedule that no longer produces any doses", () => {
    getSchedules.mockReturnValue([
      scheduleRow({ id: 3, userMedicationId: 30, scheduleTime: "08:00" }),
    ])
    generate.mockReturnValue(EMPTY_RESULT)
    regenerateSchedule()
    expect(updateSchedule).toHaveBeenCalledWith(3, { scheduleTime: "" })
  })

  it("only touches schedules whose times changed", () => {
    getSchedules.mockReturnValue([
      scheduleRow({ id: 1, userMedicationId: 10, scheduleTime: "" }),
      scheduleRow({ id: 2, userMedicationId: 20, scheduleTime: "12:00" }),
    ])
    generate.mockReturnValue({ doses: [dose(10, "09:30"), dose(20, "12:00")], warnings: [] })
    regenerateSchedule()
    expect(updateSchedule).toHaveBeenCalledTimes(1)
    expect(updateSchedule).toHaveBeenCalledWith(1, { scheduleTime: "09:30" })
  })
})

describe("save medication schedule", () => {
  it("creates a new schedule and returns its id", () => {
    addSchedule.mockReturnValue(7)

    const id = saveMedicationSchedule(baseInput)

    expect(id).toBe(7)
    expect(updateSchedule).not.toHaveBeenCalled()
    expect(addSchedule).toHaveBeenCalledTimes(1)

    const [arg] = addSchedule.mock.calls[0] as [{ instructions: string }]
    expect(arg).toMatchObject({
      userMedicationId: 10,
      frequency: 2,
      frequencyType: "Day",
      doseAmount: 500,
      doseUnit: "mg",
      startDate: TODAY,
      endDate: null,
      scheduleTime: "",
      enabled: "1",
    })
    expect(JSON.parse(arg.instructions)).toEqual({
      foodRule: "with",
      preferredTime: "08:00",
      notes: null,
    })
  })

  it("stores notes in the seralised instructions", () => {
    addSchedule.mockReturnValue(1)

    saveMedicationSchedule({ ...baseInput, notes: "Take with water" })

    const [arg] = addSchedule.mock.calls[0] as [{ instructions: string }]
    expect(JSON.parse(arg.instructions).notes).toBe("Take with water")
  })

  it("uses the dates it is given", () => {
    addSchedule.mockReturnValue(1)

    saveMedicationSchedule({ ...baseInput, startDate: "2026-07-01", endDate: "2026-08-01" })
    expect(addSchedule.mock.calls[0][0]).toMatchObject({
      startDate: "2026-07-01",
      endDate: "2026-08-01",
    })
  })

  it("updates the existing schedule for the medication when no id is given", () => {
    getSchedules.mockReturnValue([
      scheduleRow({ id: 3, userMedicationId: 10, startDate: "2026-01-01", endDate: "2026-12-31" }),
    ])

    const id = saveMedicationSchedule(baseInput)

    expect(id).toBe(3)
    expect(addSchedule).not.toHaveBeenCalled()
    expect(updateSchedule).toHaveBeenCalledTimes(1)

    const [updatedId, fields] = updateSchedule.mock.calls[0]

    expect(updatedId).toBe(3)
    expect(fields).toMatchObject({
      userMedicationId: 10,
      frequency: 2,
      frequencyType: "Day",
      doseAmount: 500,
      doseUnit: "mg",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    })
    expect(fields).not.toHaveProperty("enabled")
    expect(fields).not.toHaveProperty("scheduleTime")
  })

  it("updates by id when one is given, even it the medication has several schedules", () => {
    getSchedules.mockReturnValue([
      scheduleRow({ id: 3, userMedicationId: 10 }),
      scheduleRow({ id: 4, userMedicationId: 10 }),
    ])

    const id = saveMedicationSchedule({ ...baseInput, id: 4 })

    expect(id).toBe(4)
    expect(updateSchedule).toHaveBeenCalledWith(4, expect.any(Object))
    expect(addSchedule).not.toHaveBeenCalled()
  })

  it("creates a new schedule when the give id does not exist", () => {
    addSchedule.mockReturnValue(8)

    expect(saveMedicationSchedule({ ...baseInput, id: 99 })).toBe(8)
    expect(updateSchedule).not.toHaveBeenCalled()
  })

  it("creates a new schedule when only other medications have one", () => {
    getSchedules.mockReturnValue([scheduleRow({ id: 3, userMedicationId: 77 })])
    addSchedule.mockReturnValue(9)

    expect(saveMedicationSchedule(baseInput)).toBe(9)
    expect(updateSchedule).not.toHaveBeenCalled()
  })

  it("regnerates the schedule after saving", () => {
    addSchedule.mockReturnValue(1)

    saveMedicationSchedule(baseInput)

    expect(generate).toHaveBeenCalledTimes(1)
    expect(firstCallOrder(addSchedule)).toBeLessThan(firstCallOrder(generate))
  })

  it.todo("clears the end date when null is passed explicitly")
})

describe("set schedule enabled", () => {
  it.each([
    [true, "1"],
    [false, "0"],
  ])("setting enabled=%p stores %p", (enabled, stored) => {
    setScheduleEnabled(5, enabled)
    expect(updateSchedule).toHaveBeenCalledWith(5, { enabled: stored })
  })

  it("regenerates the schedule afterwards", () => {
    setScheduleEnabled(5, true)
    expect(generate).toHaveBeenCalledTimes(1)
    expect(firstCallOrder(updateSchedule)).toBeLessThan(firstCallOrder(generate))
  })
})

describe("remove medication schedule", () => {
  it("deletes the schedule and regenerates", () => {
    removeMedicationSchedule(5)

    expect(deleteSchedule).toHaveBeenCalledWith(5)
    expect(generate).toHaveBeenCalledTimes(1)
    expect(firstCallOrder(deleteSchedule)).toBeLessThan(firstCallOrder(generate))
  })
})

describe("remove schedules for medications", () => {
  it("deltes ever schedule for that medication and nothing else", () => {
    getSchedules.mockReturnValue([
      scheduleRow({ id: 1, userMedicationId: 10 }),
      scheduleRow({ id: 2, userMedicationId: 20 }),
      scheduleRow({ id: 3, userMedicationId: 10 }),
    ])

    removeSchedulesForMedication(10)

    expect(deleteSchedule).toHaveBeenCalledTimes(2)
    expect(deleteSchedule).toHaveBeenCalledWith(1)
    expect(deleteSchedule).toHaveBeenCalledWith(3)
    expect(deleteSchedule).not.toHaveBeenCalledWith(2)
  })

  it("regenrates once when nothing matched", () => {
    getSchedules.mockReturnValue([scheduleRow({ id: 2, userMedicationId: 20 })])

    removeSchedulesForMedication(10)

    expect(deleteSchedule).not.toHaveBeenCalled()
    expect(generate).toHaveBeenCalledTimes(1)
  })
})
