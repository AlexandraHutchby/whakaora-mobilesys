import db from "./database"

export type InteractionRecord = {
  id: number
  userMedicationId: number
  interactingMedicationId: number
  description: string | null
  notes: string | null
  dateRecorded: string
}

export type NewInteractionRecord = Omit<InteractionRecord, "id">

export type InteractionRecordUpdate = Partial<NewInteractionRecord>

// ========== CREATE ==========
export function addInteractionRecord(data: InteractionRecord): number {
  const result = db.execute(
    `INSERT INTO interactionRecord
        (userMedicationId, interactingMedicationId, description, notes, dateRecorded) VALUES
        (?, ?, ?,?,?,)`,
    [
      data.userMedicationId,
      data.interactingMedicationId,
      data.description,
      data.notes,
      data.dateRecorded,
    ],
  )
  return result.insertId as number
}

// ========== READ ==========
export function getAllInteractionRecords(): InteractionRecord[] {
  const result = db.execute("SELECT * FROM interactionRecord ORDER BY userMedicationId ASC")
  return (result.rows?._array as InteractionRecord[]) ?? []
}

// ========== UPDATE ==========
export function updateInteractionRecords(id: number, data: InteractionRecord): void {
  const fields = Object.keys(data) as (keyof InteractionRecordUpdate)[]

  if (fields.length === 0) return

  const setClause = fields.map((field) => `${field} = ?`).join(", ")
  const values = fields.map((field) => data[field])

  db.execute(`UPDATE interactionRecord SET ${setClause} WHERE id = ?`, [...values, id])
}

// ========== DELETE ==========
export function deleteInteractionRecord(id: number): void {
  db.execute("DELETE FROM interactionRecord WHERE id = ?", [id])
}
