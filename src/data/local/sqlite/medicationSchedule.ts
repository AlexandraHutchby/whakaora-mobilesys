import db from "./database"

export type MedicationSchedule = {
  id: number
  userMedicationId: number
  frequency: number
  frequencyType: string
  scheduleTimes: string
  startDate: string
  endDate: string | null
  doseAmount: number
  doseUnit: string
  instructions: string | null
  enabled: string
}

export type NewMedicationSchedule = Omit<MedicationSchedule, "id">

export type MedicationScheduleUpdate = Partial<NewMedicationSchedule>

// ========== CREATE ==========
export function addMedicationSchedule(data: MedicationSchedule): number {
  const result = db.execute(
    `INSERT INTO medicationSchedule
        (userMedicationId, freqency, freqencyType, scheduleTimes, startDate, endDate,
        doseAmount, doseUnit, instructions, enabled) VALUES
        (?, ?, ?,?,?,?,?,?,?,?)`,
    [
      data.userMedicationId,
      data.frequency,
      data.frequencyType,
      data.scheduleTimes,
      data.startDate,
      data.endDate,
      data.doseAmount,
      data.doseUnit,
      data.instructions,
      data.enabled,
    ],
  )
  return result.insertId as number
}

// ========== READ ==========
export function getAllMedicationSchedule(): MedicationSchedule[] {
  const result = db.execute("SELECT * FROM medicationSchedule ORDER BY scheduleTimes ASC")
  return (result.rows?._array as MedicationSchedule[]) ?? []
}

export function getCurrentMedicationSchedule(): MedicationSchedule[] {
  const result = db.execute(
    "SELECT * FROM medicationSchedule WHERE endDate = NULL OR WHERE endDate > now() ORDER BY scheduleTimes ASC",
  )
  return (result.rows?._array as MedicationSchedule[]) ?? []
}

// ========== UPDATE ==========
export function updateMedicationSchedule(id: number, data: MedicationSchedule): void {
  const fields = Object.keys(data) as (keyof MedicationScheduleUpdate)[]

  if (fields.length === 0) return

  const setClause = fields.map((field) => `${field} = ?`).join(", ")
  const values = fields.map((field) => data[field])

  db.execute(`UPDATE medicationSchedule SET ${setClause} WHERE id = ?`, [...values, id])
}

// ========== DELETE ==========
export function deleteMedicationSchedule(id: number): void {
  db.execute("DELETE FROM medicationSchedule WHERE id = ?", [id])
}
