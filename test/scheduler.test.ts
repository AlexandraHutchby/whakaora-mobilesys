import { describe, expect, it } from "@jest/globals"

import { formatTime, generateSchedule, parseTime } from "../src/application/domain/Scheduler"
import type { MealSlot, SchedulableMedication } from "../src/application/domain/Scheduler"

const MEALS: MealSlot[] = [
  { mealType: "Breakfast", minutes: 480 },
  { mealType: "Lunch", minutes: 720 },
  { mealType: "Dinner", minutes: 1080 },
]

const med = (overrides: Partial<SchedulableMedication> = {}): SchedulableMedication => ({
  userMedicationId: 1,
  name: "Med",
  dosesPerDay: 1,
  intervalDays: 1,
  foodRule: "none",
  preferredMinutes: null,
  ...overrides,
})

const minutesOf = (doses: { minutes: number }[]) => doses.map((d) => d.minutes)

describe("parseTime", () => {
  it.each([
    ["00:00", 0],
    ["08:30", 510],
    ["8:05", 485],
    [" 07:00 ", 420],
    ["23:59", 1439],
  ])("parses %p as %i minutes", (input, expected) => {
    expect(parseTime(input)).toBe(expected)
  })

  it.each([null, undefined, "", "  ", "abc", "8", "8:5", "24:00", "12:60", "08:30:00", "-1:30"])(
    "returns null for %p",
    (input) => {
      expect(parseTime(input as string | null | undefined)).toBeNull()
    },
  )
})

describe("formatTime", () => {
  it.each([
    [0, "00:00"],
    [5, "00:05"],
    [510, "08:30"],
    [720, "12:00"],
    [1439, "23:59"],
  ])("formats %i minutes as %s", (minutes, expected) => {
    expect(formatTime(minutes)).toBe(expected)
  })

  it("wraps values past midnight", () => {
    expect(formatTime(1440)).toBe("00:00")
    expect(formatTime(1500)).toBe("01:00")
  })

  it("wraps negative values back into the previous day", () => {
    expect(formatTime(-30)).toBe("23:30")
    expect(formatTime(-1400)).toBe("00:40")
  })

  it("rounds fractional minutes", () => {
    expect(formatTime(485.4)).toBe("08:05")
    expect(formatTime(485.6)).toBe("08:06")
  })

  it("round-trips with parseTime", () => {
    for (const minutes of [0, 1, 359, 360, 720, 1439]) {
      expect(parseTime(formatTime(minutes))).toBe(minutes)
    }
  })
})

describe("generateSchedule", () => {
  describe("basic output", () => {
    it("returns nothing for no medications", () => {
      expect(generateSchedule([], MEALS, [])).toEqual({ doses: [], warnings: [] })
    })

    it("schedules a single medication with no food rule at the start of the day", () => {
      const { doses, warnings } = generateSchedule([med({ name: "Vitamin D" })], MEALS, [])

      expect(warnings).toEqual([])
      expect(doses).toHaveLength(1)
      expect(doses[0]).toMatchObject({
        userMedicationId: 1,
        name: "Vitamin D",
        minutes: 360,
        time: "06:00",
        intervalDays: 1,
        reason: "Spread evenly through the day",
      })
    })

    it("passes intervalDays through to each dose", () => {
      const { doses } = generateSchedule([med({ intervalDays: 7 })], MEALS, [])
      expect(doses[0].intervalDays).toBe(7)
    })

    it("treats dosesPerDay below 1 as one dose", () => {
      const { doses } = generateSchedule([med({ dosesPerDay: 0 })], MEALS, [])
      expect(minutesOf(doses)).toEqual([360])
    })

    it("sorts doses from different medications by time", () => {
      const { doses } = generateSchedule(
        [
          med({ userMedicationId: 1, name: "Late", preferredMinutes: 900 }),
          med({ userMedicationId: 2, name: "Early", preferredMinutes: 480 }),
        ],
        [],
        [],
      )
      expect(doses.map((d) => d.name)).toEqual(["Early", "Late"])
      expect(minutesOf(doses)).toEqual([480, 900])
    })

    it("does not mutate its inputs", () => {
      const meds = Object.freeze([
        med({ userMedicationId: 1, foodRule: "with" }),
        med({ userMedicationId: 2 }),
      ]) as SchedulableMedication[]
      const meals = Object.freeze([...MEALS]) as MealSlot[]
      const conflicts = Object.freeze([[1, 2] as [number, number]]) as [number, number][]

      expect(() => generateSchedule(meds, meals, conflicts)).not.toThrow()
    })
  })

  describe("spreading doses through the day (no food rule)", () => {
    it("spreads two doses between 06:00 and 20:00", () => {
      const { doses } = generateSchedule([med({ dosesPerDay: 2 })], [], [])
      expect(minutesOf(doses)).toEqual([360, 1200])
    })

    it("spreads three doses evenly", () => {
      const { doses } = generateSchedule([med({ dosesPerDay: 3 })], [], [])
      expect(minutesOf(doses)).toEqual([360, 780, 1200])
    })
  })

  describe("preferred times", () => {
    it("uses the preferred time for a single dose", () => {
      const { doses } = generateSchedule([med({ preferredMinutes: 480 })], [], [])
      expect(minutesOf(doses)).toEqual([480])
      expect(doses[0].reason).toBe("Close to your preferred time")
    })

    it("spaces further doses from the preferred time", () => {
      const { doses } = generateSchedule([med({ preferredMinutes: 480, dosesPerDay: 2 })], [], [])
      expect(minutesOf(doses)).toEqual([480, 900])
    })

    it("never schedules past the end of the day", () => {
      const { doses } = generateSchedule([med({ preferredMinutes: 1400, dosesPerDay: 2 })], [], [])
      expect(minutesOf(doses)).toEqual([1400, 1439])
      for (const d of doses) {
        expect(d.minutes).toBeGreaterThanOrEqual(0)
        expect(d.minutes).toBeLessThan(1440)
      }
    })
  })

  describe("food rules", () => {
    it.each([
      ["with", 480, "With breakfast"],
      ["before", 450, "Before breakfast"],
      ["after", 540, "After breakfast"],
    ])("%s food is anchored to the nearest meal", (foodRule, minutes, reason) => {
      const { doses } = generateSchedule(
        [med({ foodRule: foodRule as SchedulableMedication["foodRule"] })],
        MEALS,
        [],
      )
      expect(doses).toHaveLength(1)
      expect(doses[0].minutes).toBe(minutes)
      expect(doses[0].reason).toBe(reason)
    })

    it("gives each dose its own meal when there are enough meals", () => {
      const { doses } = generateSchedule([med({ foodRule: "with", dosesPerDay: 3 })], MEALS, [])
      expect(minutesOf(doses)).toEqual([480, 720, 1080])
      expect(doses.map((d) => d.reason)).toEqual(["With breakfast", "With lunch", "With dinner"])
    })

    it("still schedules every dose when there are more doses than meals", () => {
      const { doses } = generateSchedule([med({ foodRule: "with", dosesPerDay: 4 })], MEALS, [])
      expect(doses).toHaveLength(4)
    })

    it("falls back to even spacing when there are no meals", () => {
      const { doses } = generateSchedule([med({ foodRule: "with" })], [], [])
      expect(minutesOf(doses)).toEqual([360])
      expect(doses[0].reason).toBe("Spread evenly through the day")
    })
  })

  describe("conflicts", () => {
    it("keeps conflicting medications at least two hours a part", () => {
      const meds = [
        med({ userMedicationId: 1, name: "A" }),
        med({ userMedicationId: 2, name: "B" }),
      ]
      const { doses, warnings } = generateSchedule(meds, [], [[1, 2]])

      expect(warnings).toEqual([])
      expect(doses).toHaveLength(2)
      expect(Math.abs(doses[0].minutes - doses[1].minutes)).toBeGreaterThanOrEqual(120)
    })

    it("treats conflicts as symmetric", () => {
      const meds = [
        med({ userMedicationId: 1, name: "A" }),
        med({ userMedicationId: 2, name: "B" }),
      ]
      expect(generateSchedule(meds, [], [[2, 1]])).toEqual(generateSchedule(meds, [], [[1, 2]]))
    })

    it("places food-bound medications first so they keep their meal slot", () => {
      const meds = [
        med({ userMedicationId: 1, name: "Flexible", preferredMinutes: 480 }),
        med({ userMedicationId: 2, name: "With food", foodRule: "with" }),
      ]
      const { doses, warnings } = generateSchedule(meds, MEALS, [[1, 2]])
      const byName = Object.fromEntries(doses.map((d) => [d.name, d]))

      expect(warnings).toEqual([])
      expect(byName["With food"].minutes).toBe(480)
      expect(byName["Flexible"].minutes).toBe(600)
    })

    it("warns, but still schedules, when the gap cannot be kept", () => {
      const oneMeal: MealSlot[] = [{ mealType: "Breakfast", minutes: 480 }]
      const meds = [
        med({ userMedicationId: 1, name: "Med A", foodRule: "before" }),
        med({ userMedicationId: 2, name: "Med B", foodRule: "before" }),
      ]
      const { doses, warnings } = generateSchedule(meds, oneMeal, [[1, 2]])
      expect(minutesOf(doses)).toEqual([450, 450])
      expect(warnings).toHaveLength(1)
      expect(warnings[0]).toContain("Med B")
      expect(warnings[0]).toContain("2h")
    })

    it("does not repeat the same warning for several doses", () => {
      const oneMeal: MealSlot[] = [{ mealType: "Breakfast", minutes: 480 }]
      const meds = [
        med({ userMedicationId: 1, name: "Med A", foodRule: "before" }),
        med({ userMedicationId: 2, name: "Med B", foodRule: "before", dosesPerDay: 2 }),
      ]
      const { doses, warnings } = generateSchedule(meds, oneMeal, [[1, 2]])
      expect(doses).toHaveLength(3)
      expect(warnings).toHaveLength(1)
    })

    it("ignores conflicts with medications that are not being scheduled", () => {
      const { doses, warnings } = generateSchedule([med({ userMedicationId: 1 })], [], [[1, 99]])
      expect(warnings).toEqual([])
      expect(minutesOf(doses)).toEqual([360])
    })
  })
})
