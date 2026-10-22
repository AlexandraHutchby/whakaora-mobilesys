export type FoodRule = "none" | "with" | "before" | "after"

export type MealSlot = { mealType: string; minutes: number }

export type SchedulableMedication = {
  userMedicationId: number
  name: string
  dosesPerDay: number
  intervalDays: number
  foodRule: FoodRule
  preferredMinutes: number | null
}

export type SuggestedDose = {
  userMedicationId: number
  name: string
  minutes: number
  time: string
  intervalDays: number
  reason: string
}

export type ScheduleResult = { doses: SuggestedDose[]; warnings: string[] }

const DAY = 24 * 60
const DAY_START = 6 * 60
const DAY_END = 20 * 60
const STEP = 15
const MIN_CONFLICT_GAP = 120
const BEFORE_FOOD_OFFSET = -30
const AFTER_FOOD_OFFSET = 60

export function parseTime(t: string | null | undefined): number | null {
  if (!t) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim())
  if (!m) return null
  const hour = Number(m[1])
  const min = Number(m[2])
  if (hour > 23 || min > 59) return null
  return hour * 60 + min
}

export function formatTime(minutes: number): string {
  const m = ((Math.round(minutes) % DAY) + DAY) & DAY
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
}

const clamp = (m: number) => Math.min(DAY - 1, Math.max(0, m))

function foodOffset(rule: FoodRule): number {
  if (rule === "before") return BEFORE_FOOD_OFFSET
  if (rule === "after") return AFTER_FOOD_OFFSET
  return 0
}

function idealTimes(med: SchedulableMedication, meals: MealSlot[]): number[] {
  const n = Math.max(1, med.dosesPerDay)
  let raw: number[]

  if (med.preferredMinutes !== null) {
    const gap = Math.floor((DAY_END - DAY_START) / n)
    raw = Array.from({ length: n }, (_, i) => med.preferredMinutes! + i * gap)
  } else if (n === 1) {
    raw = [DAY_START]
  } else {
    raw = Array.from(
      { length: n },
      (_, i) => Math.round((DAY_START + (i * (DAY_END - DAY_START)) / (n - 1)) / STEP) * STEP,
    )
  }

  if (med.foodRule === "none" || meals.length === 0) return raw.map(clamp)

  const used = new Set<number>()
  return raw.map((t) => {
    const byDistance = [...meals].sort((a, b) => Math.abs(a.minutes - t) - Math.abs(b.minutes - t))
    const meal = byDistance.find((m) => !used.has(m.minutes)) ?? byDistance[0]
    used.add(meal.minutes)
    return clamp(meal.minutes + foodOffset(med.foodRule))
  })
}

function candidateTimes(target: number, med: SchedulableMedication, meals: MealSlot[]): number[] {
  const out: number[] = [target]

  if (med.foodRule !== "none" && meals.length > 0) {
    const nudges =
      med.foodRule === "with"
        ? [0, 15, -15, 30, -30]
        : med.foodRule === "before"
          ? [0, -15, -30]
          : [0, 15, 30]

    const anchors = meals
      .map((m) => m.minutes + foodOffset(med.foodRule))
      .sort((a, b) => Math.abs(a - target) - Math.abs(b - target))
    for (const a of anchors) for (const n of nudges) out.push(a + n)
  } else {
    for (let d = STEP; d <= 8 * 60; d += STEP) out.push(target + d, target - d)
  }

  return out.filter((m) => m >= 0 && m < DAY)
}

function describe(med: SchedulableMedication, minutes: number, meals: MealSlot[]): string {
  if (med.foodRule === "none" || meals.length === 0) {
    return med.preferredMinutes !== null
      ? "Close to your preferred time"
      : "Spread evenly through the day"
  }
  const meal = [...meals].sort(
    (a, b) => Math.abs(a.minutes - minutes) - Math.abs(b.minutes - minutes),
  )[0]
  const label = { with: "With", before: "Before", after: "After" }[med.foodRule]
  return `${label} ${meal.mealType.toLowerCase()}`
}

export function generateSchedule(
  meds: SchedulableMedication[],
  meals: MealSlot[],
  conflicts: [number, number][],
): ScheduleResult {
  const conflictMap = new Map<number, Set<number>>()
  for (const [a, b] of conflicts) {
    if (!conflictMap.has(a)) conflictMap.set(a, new Set())
    if (!conflictMap.has(b)) conflictMap.set(b, new Set())
    conflictMap.get(a)!.add(b)
    conflictMap.get(b)!.add(a)
  }

  const score = (m: SchedulableMedication) =>
    (m.foodRule !== "none" ? 2 : 0) + (conflictMap.get(m.userMedicationId)?.size ?? 0)
  const ordered = [...meds].sort((a, b) => score(b) - score(a))

  const placed: { id: number; minutes: number }[] = []
  const doses: SuggestedDose[] = []
  const warnings: string[] = []

  for (const med of ordered) {
    const enemies = conflictMap.get(med.userMedicationId)
    const clashes = (m: number) =>
      !!enemies &&
      placed.some((p) => enemies.has(p.id) && Math.abs(p.minutes - m) < MIN_CONFLICT_GAP)

    for (const target of idealTimes(med, meals)) {
      const chosen = candidateTimes(target, med, meals).find((m) => !clashes(m))
      const minutes = chosen ?? target

      if (chosen === undefined) {
        warnings.push(
          `${med.name} could not be kept ${MIN_CONFLICT_GAP / 60}h away from a medication it doesn't combine with. Check with your pharmacist`,
        )
      }

      placed.push({ id: med.userMedicationId, minutes })
      doses.push({
        userMedicationId: med.userMedicationId,
        name: med.name,
        minutes,
        time: formatTime(minutes),
        intervalDays: med.intervalDays,
        reason: describe(med, minutes, meals),
      })
    }
  }
  doses.sort((a, b) => a.minutes - b.minutes)
  return { doses, warnings: [...new Set(warnings)] }
}
