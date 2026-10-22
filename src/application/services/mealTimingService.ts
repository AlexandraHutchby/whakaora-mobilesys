import {
  addMealSchedule,
  getAllMealSchedules,
  updateMealSchedule,
} from "@/data/local/sqlite/mealSchedule"

import { regenerateSchedule } from "./medicationScheduleService"
import { MealTiming } from "../domain/MealTiming"
import { parseTime } from "../domain/Scheduler"

const DEFAULT_MEALS = [
  { mealType: "Breakfast", scheduleTime: "08:00" },
  { mealType: "Lunch", scheduleTime: "13:00" },
  { mealType: "Dinner", scheduleTime: "19:00" },
]

export function listMealTimings(): MealTiming[] {
  const rows = getAllMealSchedules()
  if (rows.length === 0) {
    DEFAULT_MEALS.forEach((m) =>
      addMealSchedule({
        ...m,
        enabled: 1,
      }),
    )
  }
  return rows.map(MealTiming.fromRow).sort((a, b) => (a.minutes ?? 9999) - (b.minutes ?? 9999))
}

export function saveMealTime(id: number, time: string): boolean {
  if (parseTime(time) === null) return false
  updateMealSchedule(id, { scheduleTime: time.trim() })
  regenerateSchedule()
  return true
}

export function setMealEnabled(id: number, enabled: boolean): void {
  updateMealSchedule(id, { enabled: enabled ? 1 : 0 })
  regenerateSchedule()
}

export function createMealTiming(mealType: string, time: string): boolean {
  if (!mealType.trim() || parseTime(time) === null) return false
  addMealSchedule({ mealType: mealType.trim(), scheduleTime: time.trim(), enabled: 1 })
  regenerateSchedule()
  return true
}
