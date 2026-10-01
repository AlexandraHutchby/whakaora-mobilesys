import db from "./database"

export type MedicationReference = {
  id: number
  medicationName: string
  commonName: string | null
  commonUse: string | null
  contraIndication: string | null
  cautions: string | null
  sideEffects: string | null
  patientAdvice: string | null
}

export type NewMedicationReference = Omit<MedicationReference, "id">

export type MedicationReferenceUpdate = Partial<NewMedicationReference>

// ========== CREATE ==========
export function addMedicationReference(data: NewMedicationReference): number {
  const result = db.execute(
    `INSERT INTO medicationReference
        (medicationName, commonName, commonUse, contraIndication, cautions, sideEffects, patientAdvice)
        VALUES (?,?,?,?,?,?,?)`,
    [
      data.medicationName,
      data.commonName,
      data.commonUse,
      data.contraIndication,
      data.cautions,
      data.sideEffects,
      data.patientAdvice,
    ],
  )

  return result.insertId as number
}

export function importMedicationReferences(
  records: Array<{
    medication_name: string
    common_names?: unknown
    common_use?: string | null
    contra_indication?: string | null
    cautions?: string | null
    side_effects?: string | null
    patient_advice?: string | null
  }>,
): void {
  for (const record of records) {
    const commonNames = Array.isArray(record.common_names)
      ? record.common_names
          .flat(Infinity)
          .filter((item): item is string => typeof item === "string")
          .join(", ")
      : typeof record.common_names === "string"
        ? record.common_names
        : null

    addMedicationReference({
      medicationName: record.medication_name,
      commonName: commonNames,
      commonUse: record.common_use ?? null,
      contraIndication: record.contra_indication ?? null,
      cautions: record.cautions ?? null,
      sideEffects: record.side_effects ?? null,
      patientAdvice: record.patient_advice ?? null,
    })
  }
}

// ========== READ ==========
export function getAllMedicationReferences(): MedicationReference[] {
  const result = db.execute("SELECT * FROM medicationReference ORDER BY medicationName ASC")
  return (result.rows?._array as MedicationReference[]) ?? []
}

export function getMedicationReferenceById(id: number): MedicationReference | null {
  const result = db.execute("SELECT * FROM medicationReference WHERE id = ?", [id])
  const rows = result.rows?._array as MedicationReference[]
  return rows && rows.length > 0 ? rows[0] : null
}

export function searchMedicationReferencesByName(query: string): MedicationReference[] {
  const result = db.execute(
    "SELECT * FROM medicationReference WHERE commonName LIKE ? ORDER BY commonName ASC",
    [`%${query}%`],
  )
  return (result.rows?._array as MedicationReference[]) ?? []
}

export function searchMedicationReferencesByUse(commonUse: string): MedicationReference[] {
  const result = db.execute(
    "SELECT * FROM medicationReference WHERE commonUse = ? ORDER BY medicationName ASC",
    [commonUse],
  )
  return (result.rows?._array as MedicationReference[]) ?? []
}

// ========== UPDATE ==========

export function updateMedicationReference(id: number, data: MedicationReferenceUpdate): void {
  const fields = Object.keys(data) as (keyof MedicationReferenceUpdate)[]

  if (fields.length === 0) return

  const setClause = fields.map((field) => `${field} = ?`).join(", ")
  const values = fields.map((field) => data[field])

  db.execute(`UPDATE medicationReference SET ${setClause} WHERE id = ?`, [...values, id])
}

// ========== DELETE ==========
export function deleteMedicationReference(id: number): void {
  db.execute("DELETE FROM medicationReference WHERE id = ?", [id])
}
