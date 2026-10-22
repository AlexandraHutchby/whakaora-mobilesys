import { useCallback, useEffect, useState } from "react"

import {
  createMealTiming,
  listMealTimings,
  saveMealTime,
  setMealEnabled,
} from "@/application/services/mealTimingService"

import { MealTiming } from "../../application/domain/MealTiming"

export function useMealTimings() {
  const [meals, setMeals] = useState<MealTiming[]>([])

  const refresh = useCallback(() => {
    setMeals(listMealTimings())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setTime = (id: number, time: string) => {
    const ok = saveMealTime(id, time)
    if (ok) refresh()
    return ok
  }

  const setEnabled = (id: number, enabled: boolean) => {
    setMealEnabled(id, enabled)
    refresh()
  }

  const addMeal = (mealType: string, time: string) => {
    const ok = createMealTiming(mealType, time)
    if (ok) refresh()
    return ok
  }

  return { meals, setTime, setEnabled, addMeal }
}
