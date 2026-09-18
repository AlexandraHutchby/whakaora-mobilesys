import db from "./database"

export type PrescriptionReminder = {
  id: number
  prescriptionId: number
  reminderDate: string
  leadTime: number | null
  enabled: number
}

export type NewPrescriptionReminder = Omit<PrescriptionReminder, "id">

export type PrescriptionReminderUpdate = Partial<NewPrescriptionReminder>

// ========== CREATE ==========
export function addPrescriptionReminder(data: PrescriptionReminder): number {
  const result = db.execute(
    `INSERT INTO prescriptionReminder
        (prescriptionId, reminderDate, leadTime, enabled) VALUES
        (?, ?, ?,?)`,
    [data.prescriptionId, data.reminderDate, data.leadTime, data.enabled],
  )
  return result.insertId as number
}

// ========== READ ==========
export function getAllPrescriptionReminders(): PrescriptionReminder[] {
  const result = db.execute("SELECT * FROM prescriptionReminder ORDER BY reminderDate ASC")
  return (result.rows?._array as PrescriptionReminder[]) ?? []
}

export function getCurrentPrescriptionReminders(): PrescriptionReminder[] {
  const result = db.execute(
    "SELECT * FROM prescriptionReminder WHERE enabled = 1 ORDER BY reminderDate ASC",
  )
  return (result.rows?._array as PrescriptionReminder[]) ?? []
}

// ========== UPDATE ==========
export function updatePrescriptionReminder(id: number, data: PrescriptionReminder): void {
  const fields = Object.keys(data) as (keyof PrescriptionReminderUpdate)[]

  if (fields.length === 0) return

  const setClause = fields.map((field) => `${field} = ?`).join(", ")
  const values = fields.map((field) => data[field])

  db.execute(`UPDATE prescription SET ${setClause} WHERE id = ?`, [...values, id])
}

// ========== DELETE ==========
export function deletePrescriptionReminder(id: number): void {
  db.execute("DELETE FROM prescriptionReminder WHERE id = ?", [id])
}
