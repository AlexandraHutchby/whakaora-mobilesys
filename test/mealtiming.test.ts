import { describe, expect, it } from "@jest/globals"

import { MealTiming } from "../src/application/domain/MealTiming"

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  mealType: "Breakfast",
  scheduleTime: "08:00",
  enabled: 1,
  ...overrides,
})

describe("MealTiming.fromRow", () => {
  it("maps database columns to properties", () => {
    const meal = MealTiming.fromRow(row())

    expect(meal).toMatchObject({
      id: 1,
      mealType: "Breakfast",
      scheduleTime: "08:00",
      enabled: true,
    })
  })

  it("uses null when no time is stored", () => {
    expect(MealTiming.fromRow(row({ scheduleTime: undefined })).scheduleTime).toBeNull()
    expect(MealTiming.fromRow(row({ scheduleTime: null })).scheduleTime).toBeNull()
  })

  it.each([
    [1, true],
    ["1", true],
    [true, true],
    [0, false],
    ["0", false],
    [false, false],
    [null, false],
    [undefined, false],
  ])("reads enabled=%p as %p", (enabled, expected) => {
    expect(MealTiming.fromRow(row({ enabled })).enabled).toBe(expected)
  })
})

describe("MealTiming.minutes", () => {
  it("converts the stored time to minutes after midnight", () => {
    expect(new MealTiming(1, "Lunch", "12:30", true).minutes).toBe(750)
  })

  it("is null when there is no time", () => {
    expect(new MealTiming(1, "Lunch", null, true).minutes).toBeNull()
  })

  it("is null when the time is invalid", () => {
    expect(new MealTiming(1, "Lunch", "lunchtime", true).minutes).toBeNull()
    expect(new MealTiming(1, "Lunch", "25:00", true).minutes).toBeNull()
  })
})

describe("MealTiming.isUsable", () => {
  it("is true when enabled with a valid time", () => {
    expect(new MealTiming(1, "Lunch", "12:30", true).isUsable).toBe(true)
  })

  it("is true for midnight (0 minutes is still a valid time)", () => {
    expect(new MealTiming(1, "Late snack", "00:00", true).isUsable).toBe(true)
  })

  it("is false when disabled", () => {
    expect(new MealTiming(1, "Lunch", "12:30", false).isUsable).toBe(false)
  })

  it("is false when enabled but has not time", () => {
    expect(new MealTiming(1, "Lunch", null, true).isUsable).toBe(false)
  })

  it("is false when enabled but the time is invalid", () => {
    expect(new MealTiming(1, "Lunch", "nope", true).isUsable).toBe(false)
  })
})
