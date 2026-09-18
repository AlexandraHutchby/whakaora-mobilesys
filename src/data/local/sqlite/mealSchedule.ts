import db from "./database"

export type MealSchedule = {
  id: number
  mealType: string
  scheduleTime: string | null
  enabled: number
}

export type NewMealSchedule = Omit<MealSchedule, "id">

export type MealScheduleUpdate = Partial<NewMealSchedule>

// =========== CREATE ==========
export function addMealSchedule(data: NewMealSchedule): number {
  const result = db.execute(
    `INSERT INTO mealSchedule (mealType, scheduleTime, enabled)
        VALUES(?,?,?)`,
    [data.mealType, data.scheduleTime, data.enabled],
  )

  return result.insertId as number
}

// ========== READ ==========
export function getAllMealSchedules(): MealSchedule[] {
  const result = db.execute("SELECT * FROM mealSchedule ORDER BY scheduledTime ASC")
  return (result.rows?._array as MealSchedule[]) ?? []
}

export function getMealScheduleById(id: number): MealSchedule | null {
  const result = db.execute("SELECT * FROM mealSchedule WHERE id = ?", [id])

  const rows = result.rows?._array as MealSchedule[]
  return rows && rows.length > 0 ? rows[0] : null
}

export function getMealScheduleByType(mealType: string): MealSchedule[] {
  const result = db.execute("SELECT * FROM mealSchedule WHERE mealType = ?", [mealType])

  return (result.rows?._array as MealSchedule[]) ?? []
}

// ========== UPDATE ==========

export function updateMealSchedule(id: number, data: MealScheduleUpdate): void {
  const fields = Object.keys(data) as (keyof MealScheduleUpdate)[]
  if (fields.length === 0) return

  const setClause = fields.map((field) => `${field} = ?`).join(", ")
  const values = fields.map((field) => data[field])

  db.execute(`UPDATE mealSchedule SET ${setClause} WHERE id = ?`, [...values, id])
}

// ========== DELETE ===========
export function deleteMealSchedule(id: number): void {
  db.execute("DELETE FROM mealSchedule WHERE id = ?", [id])
}
