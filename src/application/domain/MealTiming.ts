import { parseTime } from "./Scheduler"

export class MealTiming {
  constructor(
    public id: number,
    public mealType: string,
    public scheduleTime: string | null,
    public enabled: boolean,
  ) {}

  static fromRow(row: any): MealTiming {
    return new MealTiming(
      row.id,
      row.mealType,
      row.scheduledTime ?? null,
      Number(row.enabled) === 1,
    )
  }

  get minutes(): number | null {
    return parseTime(this.scheduleTime)
  }

  get isUsable(): boolean {
    return this.enabled && this.minutes !== null
  }
}
