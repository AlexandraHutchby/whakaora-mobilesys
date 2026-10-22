import { describe, expect, it, jest } from "@jest/globals"

import { useFreshDatabase as setupFreshDatabase } from "./setupdb"
import {
  addMealSchedule,
  deleteMealSchedule,
  getAllMealSchedules,
  getMealScheduleById,
  getMealScheduleByType,
  updateMealSchedule,
} from "../src/data/local/sqlite/mealSchedule"

jest.mock("../src/data/local/sqlite/database", () => require("./db"))

setupFreshDatabase()

const add = (mealType: string, scheduleTime: string | null = "08:00", enabled = 1) =>
  addMealSchedule({ mealType, scheduleTime, enabled })

describe("addMealSchedule", () => {
  it("stores the meal and returns its id", () => {
    const id = add("Breakfast", "08:00")

    expect(id).toBeGreaterThan(0)
    expect(getMealScheduleById(id)).toEqual({
      id,
      mealType: "Breakfast",
      scheduleTime: "08:00",
      enabled: 1,
    })
  })

  it("allows a meal with no time", () => {
    const id = add("Snack", null)

    expect(getMealScheduleById(id)).toMatchObject({ scheduleTime: null })
  })

  it("stores a disabled meal", () => {
    const id = add("Snack", "15:00", 0)

    expect(getMealScheduleById(id)?.enabled).toBe(0)
  })
})

describe("getAllMealSchedules", () => {
  it("returns an empty list when there are none", () => {
    expect(getAllMealSchedules()).toEqual([])
  })

  it("is sorted by time of day", () => {
    add("Dinner", "19:00")
    add("Breakfast", "08:00")
    add("Lunch", "13:00")

    expect(getAllMealSchedules().map((m) => m.mealType)).toEqual(["Breakfast", "Lunch", "Dinner"])
  })
})

describe("getMealScheduleById", () => {
  it("returns the matching meal", () => {
    add("Breakfast")
    const id = add("Lunch", "13:00")

    expect(getMealScheduleById(id)?.mealType).toBe("Lunch")
  })

  it("returns null when there is no such meal", () => {
    expect(getMealScheduleById(999)).toBeNull()
  })
})

describe("getMealScheduleByType", () => {
  it("returns every meal of that type", () => {
    add("Snack", "10:30")
    add("Snack", "15:30")
    add("Lunch", "13:00")

    expect(getMealScheduleByType("Snack")).toHaveLength(2)
  })

  it("returns an empty list when no meal has that type", () => {
    add("Lunch", "13:00")

    expect(getMealScheduleByType("Supper")).toEqual([])
  })
})

describe("updateMealSchedule", () => {
  it("can enable and disable a meal", () => {
    const id = add("Lunch", "13:00", 1)

    updateMealSchedule(id, { enabled: 0 })

    expect(getMealScheduleById(id)?.enabled).toBe(0)
  })

  it("can change the meal time", () => {
    const id = add("Lunch", "13:00")

    updateMealSchedule(id, { scheduleTime: "12:30" })

    expect(getMealScheduleById(id)).toMatchObject({ scheduleTime: "12:30" })
  })

  it("only changes the row with that id", () => {
    const first = add("Breakfast", "08:00")
    const second = add("Lunch", "13:00")

    updateMealSchedule(first, { enabled: 0 })

    expect(getMealScheduleById(second)?.enabled).toBe(1)
  })

  it("does nothing when there is nothing to update", () => {
    const id = add("Lunch", "13:00")

    expect(() => updateMealSchedule(id, {})).not.toThrow()
    expect(getMealScheduleById(id)?.enabled).toBe(1)
  })
})

describe("deleteMealSchedule", () => {
  it("removes only that meal", () => {
    const keep = add("Breakfast")
    const remove = add("Lunch", "13:00")

    deleteMealSchedule(remove)

    expect(getMealScheduleById(remove)).toBeNull()
    expect(getMealScheduleById(keep)).not.toBeNull()
  })
})
