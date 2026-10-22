import type { FoodRule } from "./Scheduler"

export type ParsedInstructions = {
  foodRule: FoodRule
  preferredTime: string | null
  notes: string | null
}

export function parseInstructions(raw: string | null): ParsedInstructions {
  const fallback: ParsedInstructions = { foodRule: "none", preferredTime: null, notes: null }
  if (!raw) return fallback
  try {
    const obj = JSON.parse(raw)
    return {
      foodRule: ["none", "with", "before", "after"].includes(obj.foodRule) ? obj.foodRule : "none",
      preferredTime: obj.preferredTime ?? null,
      notes: obj.notes ?? null,
    }
  } catch {
    return { ...fallback, notes: raw }
  }
}

export function seraliseInstructions(i: ParsedInstructions): string {
  return JSON.stringify(i)
}

export class medicationScheduleEntry {
  constructor(
    public id: number,
    public userMedicationId: number,
    public frequency: number,
    public frequencyType: string,
    public times: string[],
    public startDate: string,
    public endDate: string | null,
    public doseAmount: number,
    public doseUnit: string,
    public instructions: ParsedInstructions,
    public enabled: boolean,
  ) {}

  static fromRow(row: any): medicationScheduleEntry {
    const e = row.enabled
    return new medicationScheduleEntry(
      row.id,
      row.userMedicationId,
      Number(row.frequency) || 1,
      row.frequencyType ?? "Day",
      row.scheduledTimes ? String(row.scheduledTimes).split(",").filter(Boolean) : [],
      row.startDate,
      row.endDate ?? null,
      row.doseAmount,
      row.doseUnit,
      parseInstructions(row.instructions ?? null),
      e === 1 || e === "1" || e === "true" || e === true,
    )
  }

  get dosesPerDay(): number {
    return this.frequencyType.toLowerCase() === "day" ? Math.max(1, this.frequency) : 1
  }

  get intervalDays(): number {
    const f = Math.max(1, this.frequency)
    switch (this.frequencyType.toLowerCase()) {
      case "week":
        return Math.max(1, Math.round(7 / f))
      case "month":
        return Math.max(1, Math.round(30 / f))
      default:
        return 1
    }
  }

  isActiveOn(isoDate: string): boolean {
    const day = isoDate.slice(0, 10)
    if (this.startDate && this.startDate.slice(0, 10) > day) return false
    if (this.endDate && this.endDate.slice(0, 10) < day) return false
    return true
  }
}
