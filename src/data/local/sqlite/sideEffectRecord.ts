import db from "./database"

export type SideEffectRecord = {
  id: number
  userMedicationId: number
  dateRecorded: string
  description: string | null
}

export type NewSideEffectRecord = Omit<SideEffectRecord, "id">

export type SideEffectRecordUpdate = Partial<NewSideEffectRecord>

// ========== CREATE ==========
export function addSideEffectRecord(data: SideEffectRecord): number {
  const result = db.execute(
    `INSERT INTO sideEffectRecord
        (userMedicationId, dateRecorded, description) VALUES
        (?, ?, ?)`,
    [data.userMedicationId, data.dateRecorded, data.description],
  )
  return result.insertId as number
}

// ========== READ ==========
export function getAllSideEffectRecords(): SideEffectRecord[] {
  const result = db.execute("SELECT * FROM sideEffectRecords ORDER BY userMedicationId ASC")
  return (result.rows?._array as SideEffectRecord[]) ?? []
}

export function getRecentSideEffectRecords(dateRecorded: string): SideEffectRecord[] {
  const result = db.execute(
    "SELECT * FROM sideEffectRecord WHERE dateRecorded > ? ORDER BY userMedicationId ASC",
    [dateRecorded],
  )
  return (result.rows?._array as SideEffectRecord[]) ?? []
}

// ========== UPDATE ==========
export function updateSideEffectRecord(id: number, data: SideEffectRecord): void {
  const fields = Object.keys(data) as (keyof SideEffectRecordUpdate)[]

  if (fields.length === 0) return

  const setClause = fields.map((field) => `${field} = ?`).join(", ")
  const values = fields.map((field) => data[field])

  db.execute(`UPDATE sideEffectRecord SET ${setClause} WHERE id = ?`, [...values, id])
}

// ========== DELETE ==========
export function deleteSideEffectRecord(id: number): void {
  db.execute("DELETE FROM sideEffectRecord WHERE id = ?", [id])
}
