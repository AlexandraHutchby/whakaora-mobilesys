import db from "./database"

export type UserMedication = {
  id: number
  medicationReferenceId: number | null
  medicationName: string
  customName: string | null
}

export type NewUserMedication = Omit<UserMedication, "id">

export type UserMedicationUpdate = Partial<NewUserMedication>

// ========== CREATE ==========

export function addUserMedication(data: NewUserMedication): number {
  const result = db.execute(
    `INSERT INTO userMedication (medicationReferenceId, medicationName, customName) 
        VALUES (?,?,?)`,
    [data.medicationReferenceId, data.medicationName, data.customName],
  )
  return result.insertId as number
}

// ========== READ ==========

export function getAllUserMedications(): UserMedication[] {
  const result = db.execute("SELECT * FROM userMedication ORDER BY medicationName")
  return (result.rows?._array as UserMedication[]) ?? []
}

export function getUserMedicationById(id: number): UserMedication | null {
  const result = db.execute("SELECT * FROM userMedication WHERE id = ?", [id])
  const rows = result.rows?._array as UserMedication[]
  return rows && rows.length > 0 ? rows[0] : null
}

export function getUserMedicationWithReference(id: number) {
  const result = db.execute(
    `SELECT
            userMedication.id,
            userMedication.medicationName,
            userMedication.medicationReferenceId,
            medicationReference.commonName,
            medicationReference.commonUse,
            medicationReference.contraIndication,
            medicationReference.cautions,
            medicationReference.sideEffects,
            medicationReference.patientAdvice
        FROM userMedication
        LEFT JOIN medicationReference
            ON userMedication.medicationReferenceId = medicationReference.id
        WHERE userMedication.id = ?`,
    [id],
  )
  const rows = result.rows?._array
  return rows && rows.length > 0 ? rows[0] : null
}

export function userMedicationExists(medicationReferenceId: number): boolean {
  const result = db.execute(
    "SELECT id FROM userMedication WHERE medicationReferenceId = ? LIMIT 1",
    [medicationReferenceId],
  )

  return Boolean(result.rows?._array?.length)
}

// ========== UPDATE ==========

export function updateUserMedication(id: number, data: UserMedicationUpdate): void {
  const fields = Object.keys(data) as (keyof UserMedicationUpdate)[]
  if (fields.length === 0) return

  const setClause = fields.map((field) => `${field} = ?`).join(", ")
  const values = fields.map((field) => data[field])

  db.execute(`UPDATE userMedication SET ${setClause} WHERE id = ?`, [...values, id])
}

// ========== DELETE =========
export function deleteUserMedication(id: number): void {
  db.execute("DELETE FROM userMedication WHERE id = ?", [id])
}
