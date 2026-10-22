import { beforeEach, jest } from "@jest/globals"

import { resetTestDb } from "./db"
import { initialiseDatabase } from "../src/data/local/sqlite/create_database"
import db from "../src/data/local/sqlite/database"

jest.mock("../src/data/local/sqlite/database", () => require("./db"))

export function useFreshDatabase(): void {
  beforeEach(() => {
    resetTestDb()
    initialiseDatabase()
  })
}

export function seedMedicationReference(name = "Paracetamol"): number {
  return db.execute(
    `INSERT INTO medicationReference
        (medicationName, commonName, commonUse, contraIndication, cautions, sideEffects, patientAdvice)
    VALUES (?, 'Panadol', 'Pain', 'Liver disease', 'Avoid overdose', 'Nausea', 'Take with water')`,
    [name],
  ).insertId as number
}

export function seedUserMedication(name = "Paracetamol"): number {
  return db.execute(
    "INSERT INTO userMedication(medicationReferenceId, medicationName, customName) VALUES (NULL, ?, NULL)",
    [name],
  ).insertId as number
}

export function seedMedicationSchedule(userMedicationId: number): number {
  return db.execute(
    `INSERT INTO medicationSchedule
        (userMedicationId, frequency, frequencyType, scheduleTime, startDate, endDate, doseAmount, doseUnit, instructions, enabled)
    VALUES (?, 1, 'Day', '08:00', '2026-01-01', NULL, 500, 'mg', NULL, '1')`,
    [userMedicationId],
  ).insertId as number
}

export function seedPrescription(userMedicationId: number, status = 1): number {
  return db.execute(
    `INSERT INTO prescription
        (userMedicationId, quantityReceived, repeatCount, expiryDate, nextPrescriptionDate, reminderLeadTime, status)
    VALUES (?, 30, NULL, NULL, NULL, NULL, ?)`,
    [userMedicationId, status],
  ).insertId as number
}

export function isoDate(offsetDays = 0): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10)
}
