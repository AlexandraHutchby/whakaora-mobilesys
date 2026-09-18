import { initialiseDatabase } from "./create_database"
import db from "./database"

const TABLES_IN_DEPENDENCY_ORDER = [
  "medicationReference",
  "userMedication",
  "mealSchedule",
  "medicationSchedule",
  "reminder",
  "prescription",
  "prescriptionReminder",
  "sideEffectRecord",
  "doseRecord",
  "interactionRecord",
]

export function wipeDatabase() {
  for (const table of [...TABLES_IN_DEPENDENCY_ORDER].reverse()) {
    db.execute(`DROP TABLE IF EXISTS ${table};`)
  }
}

export function resetDatabase() {
  wipeDatabase()
  initialiseDatabase()
}
