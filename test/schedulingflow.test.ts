import { describe, expect, it } from "@jest/globals"

import { MealTiming } from "../src/application/domain/MealTiming"
import { medicationScheduleEntry } from "../src/application/domain/MedicationScheduleEntry"
import { generateSchedule, parseTime } from "../src/application/domain/Scheduler"
import { MealSlot, SchedulableMedication } from "../src/application/domain/Scheduler"
import { UserMedication } from "../src/application/domain/UserMedication"

const toSchedulable = (
  userMedication: UserMedication,
  entry: medicationScheduleEntry,
): SchedulableMedication => ({
  userMedicationId: userMedication.id,
  name: userMedication.displayName,
  dosesPerDay: entry.dosesPerDay,
  intervalDays: entry.intervalDays,
  foodRule: entry.instructions.foodRule,
  preferredMinutes: parseTime(entry.instructions.preferredTime),
})

const toMealSlots = (rows: Record<string, unknown>[]): MealSlot[] =>
  rows
    .map((r) => MealTiming.fromRow(r))
    .filter((m) => m.isUsable)
    .map((m) => ({ mealType: m.mealType, minutes: m.minutes as number }))

const entryRow = (instructions: Record<string, unknown>, overrides = {}) => ({
  id: 1,
  userMedicationId: 10,
  frequency: 1,
  frequencyType: "Day",
  scheduledTimes: "",
  startDate: "2026-01-01",
  endDate: null,
  doseAmount: 500,
  doseUnit: "mg",
  instructions: JSON.stringify(instructions),
  enabled: 1,
  ...overrides,
})

describe("domain objects feeding the scheduler", () => {
  it("anchors a with-food medication to the nearest enabled meal", () => {
    const userMedication = UserMedication.fromRow({
      id: 10,
      medicationName: "Paracetamol",
      medicationReferenceId: null,
      customName: "Panadol",
    })
    const entry = medicationScheduleEntry.fromRow(entryRow({ foodRule: "with" }))
    const meals = toMealSlots([
      { id: 1, mealType: "Breakfast", scheduledTime: "08:00", enabled: 0 },
      { id: 2, mealType: "Lunch", scheduledTime: "12:00", enabled: 1 },
      { id: 3, mealType: "Dinner", scheduledTime: "18:00", enabled: 1 },
    ])

    const { doses, warnings } = generateSchedule([toSchedulable(userMedication, entry)], meals, [])

    expect(warnings).toEqual([])
    expect(doses).toHaveLength(1)
    expect(doses[0]).toMatchObject({
      userMedicationId: 10,
      name: "Panadol",
      minutes: 720,
      time: "12:00",
      reason: "With lunch",
    })
  })

  it("uses the preferred time and weekly interval from the schedule entry", () => {
    const userMedication = UserMedication.fromRow({
      id: 10,
      medicationName: "Alendronate",
      medicationReferenceId: 3,
      customName: null,
    })
    const entry = medicationScheduleEntry.fromRow(
      entryRow(
        { foodRule: "none", preferredTime: "09:30" },
        { frequency: 1, frequencyType: "Week" },
      ),
    )

    const { doses } = generateSchedule([toSchedulable(userMedication, entry)], [], [])

    expect(doses).toHaveLength(1)
    expect(doses[0]).toMatchObject({
      name: "Alendronate",
      minutes: 570,
      time: "09:30",
      intervalDays: 7,
      reason: "Close to your preferred time",
    })
  })
})
