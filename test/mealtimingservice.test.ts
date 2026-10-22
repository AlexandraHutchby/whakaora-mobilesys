import { beforeEach, describe, expect, it, jest } from "@jest/globals"

import { MealTiming } from "../src/application/domain/MealTiming"
import {
  createMealTiming,
  listMealTimings,
  saveMealTime,
  setMealEnabled,
} from "../src/application/services/mealTimingService"
import { regenerateSchedule } from "../src/application/services/medicationScheduleService"
import {
  addMealSchedule,
  getAllMealSchedules,
  updateMealSchedule,
} from "../src/data/local/sqlite/mealSchedule"

jest.mock("../src/data/local/sqlite/mealSchedule", () => ({
  addMealSchedule: jest.fn(),
  getAllMealSchedules: jest.fn(),
  updateMealSchedule: jest.fn(),
}))
jest.mock("../src/application/services/medicationScheduleService", () => ({
  regenerateSchedule: jest.fn(),
}))

const getAll = getAllMealSchedules as jest.Mock
const addMeal = addMealSchedule as jest.Mock
const updateMeal = updateMealSchedule as jest.Mock
const regenerate = regenerateSchedule as jest.Mock

const mealRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  mealType: "Breakfast",
  scheduleTime: "08:00",
  enabled: 1,
  ...overrides,
})

const firstCallOrder = (fn: jest.Mock) => fn.mock.invocationCallOrder[0]

beforeEach(() => {
  jest.resetAllMocks()
  getAll.mockReturnValue([])
})

describe("list meal timings", () => {
  it("maps rows to meal timing objects", () => {
    getAll.mockReturnValue([mealRow()])

    const result = listMealTimings()

    expect(result).toHaveLength(1)
    expect(result[0]).toBeInstanceOf(MealTiming)
    expect(result[0]).toMatchObject({ id: 1, mealType: "Breakfast", scheduleTime: "08:00" })
  })

  it("sorts meals by time of day", () => {
    getAll.mockReturnValue([
      mealRow({ id: 3, mealType: "Dinner", scheduleTime: "19:00" }),
      mealRow({ id: 1, mealType: "Breakfast", scheduleTime: "08:00" }),
      mealRow({ id: 2, mealType: "Lunch", scheduleTime: "13:00" }),
    ])

    expect(listMealTimings().map((m) => m.mealType)).toEqual(["Breakfast", "Lunch", "Dinner"])
  })

  it("puts meals without a valid time last", () => {
    getAll.mockReturnValue([
      mealRow({ id: 1, mealType: "Snack", scheduleTime: null }),
      mealRow({ id: 2, mealType: "Breakfast", scheduleTime: "08:00" }),
    ])

    expect(listMealTimings().map((m) => m.mealType)).toEqual(["Breakfast", "Snack"])
  })

  it("does not seed defaults when meals already exist", () => {
    getAll.mockReturnValue([mealRow()])

    listMealTimings()

    expect(addMeal).not.toHaveBeenCalled()
  })

  it("seeds breakfast, lunch, and dinner when there are no meals", () => {
    listMealTimings()

    expect(addMeal).toHaveBeenCalledTimes(3)
    expect(addMeal).toHaveBeenNthCalledWith(1, {
      mealType: "Breakfast",
      scheduleTime: "08:00",
      enabled: 1,
    })
    expect(addMeal).toHaveBeenNthCalledWith(2, {
      mealType: "Lunch",
      scheduleTime: "13:00",
      enabled: 1,
    })
    expect(addMeal).toHaveBeenNthCalledWith(3, {
      mealType: "Dinner",
      scheduleTime: "19:00",
      enabled: 1,
    })
  })

  it("returns the seeded defaults on the first call rather than an empty list", () => {
    getAll
      .mockReturnValueOnce([])
      .mockReturnValueOnce([
        mealRow({ id: 1, mealType: "Breakfast", scheduleTime: "08:00" }),
        mealRow({ id: 2, mealType: "Lunch", scheduleTime: "13:00" }),
        mealRow({ id: 3, mealType: "Dinner", scheduleTime: "19:00" }),
      ])

    expect(listMealTimings().map((m) => m.mealType)).toEqual(["Breakfast", "Lunch", "Dinner"])
  })
})

describe("save meal time", () => {
  it.each(["", "abc", "25:00", "12:60", "8:5"])("rejects the invalid time %p", (time) => {
    expect(saveMealTime(1, time)).toBe(false)
    expect(updateMeal).not.toHaveBeenCalled()
    expect(regenerate).not.toHaveBeenCalled()
  })

  it("saves a valid time and regenerates the schedule", () => {
    expect(saveMealTime(4, "08:30")).toBe(true)

    expect(updateMeal).toHaveBeenCalledWith(4, { scheduleTime: "08:30" })
    expect(regenerate).toHaveBeenCalledTimes(1)
    expect(firstCallOrder(updateMeal)).toBeLessThan(firstCallOrder(regenerate))
  })

  it("trims thetime before savng", () => {
    expect(saveMealTime(4, " 08:30 ")).toBe(true)
    expect(updateMeal).toHaveBeenCalledWith(4, { scheduleTime: "08:30" })
  })
})

describe("set meal enabled", () => {
  it.each([
    [true, 1],
    [false, 0],
  ])("setting enabled=%p stores %p", (enabled, stored) => {
    setMealEnabled(2, enabled)
    expect(updateMeal).toHaveBeenCalledWith(2, { enabled: stored })
  })

  it("regenerates the schedule afterwards", () => {
    setMealEnabled(2, false)

    expect(regenerate).toHaveBeenCalledTimes(1)
    expect(firstCallOrder(updateMeal)).toBeLessThan(firstCallOrder(regenerate))
  })
})

describe("create meal timing", () => {
  it.each([
    ["", "08:00"],
    ["  ", "08:00"],
    ["Snack", "bad"],
    ["Snack", ""],
  ])("rejects name %p with time %p", (mealType, time) => {
    expect(createMealTiming(mealType, time)).toBe(false)
    expect(addMeal).not.toHaveBeenCalled()
    expect(regenerate).not.toHaveBeenCalled()
  })

  it("creates an enabled meal and regenerates the schedule", () => {
    expect(createMealTiming("Snack", "15:30")).toBe(true)

    expect(addMeal).toHaveBeenCalledWith({
      mealType: "Snack",
      scheduleTime: "15:30",
      enabled: 1,
    })
    expect(regenerate).toHaveBeenCalledTimes(1)
    expect(firstCallOrder(addMeal)).toBeLessThan(firstCallOrder(regenerate))
  })

  it("trims the name and time", () => {
    expect(createMealTiming(" Supper ", " 21:00 ")).toBe(true)

    expect(addMeal).toHaveBeenCalledWith({
      mealType: "Supper",
      scheduleTime: "21:00",
      enabled: 1,
    })
  })
})
