import db from "./database"

export function initialiseDatabase() {
  db.execute(`
        CREATE TABLE IF NOT EXISTS medicationReference (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            medicationName TEXT NOT NULL,
            commonName TEXT,
            commonUse TEXT,
            contraIndication TEXT,
            cautions TEXT,
            sideEffects TEXT,
            patientAdvice TEXT
        );
    `)

  db.execute(`
        CREATE TABLE IF NOT EXISTS userMedication (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            medicationReferenceId INTEGER,
            medicationName TEXT NOT NULL,
            FOREIGN KEY (medicationReferenceId) REFERENCES medicationReference(id)
        );
    `)

  db.execute(`
        CREATE TABLE IF NOT EXISTS mealSchedule (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mealType TEXT NOT NULL,
            scheduledTime TEXT,
            enabled INTEGER NOT NULL
        );
    `)

  db.execute(`
        CREATE TABLE IF NOT EXISTS medicationSchedule (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userMedicationId INTEGER NOT NULL,
            frequency INT NOT NULL,
            frequencyType TEXT NOT NULL,
            scheduleTimes TEXT NOT NULL,
            startDate TEXT NOT NULL,
            endDate TEXT,
            doseAmount INTEGER NOT NULL,
            doseUnit TEXT NOT NULL,
            instructions TEXT,
            enabled TEXT NOT NULL,
            FOREIGN KEY(userMedicationId) REFERENCES userMedication(id)
        );
    `)

  db.execute(`
        CREATE TABLE IF NOT EXISTS reminder (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scheduleId INTEGER NOT NULL,
            reminderDateTime TEXT,
            reminderType TEXT,
            enabled INTEGER NOT NULL,
            snoozeDuration INTEGER,
            FOREIGN KEY (scheduleId) REFERENCES medicationSchedule(id)
        );
    `)

  db.execute(`
        CREATE TABLE IF NOT EXISTS prescription (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userMedicationId INTEGER NOT NULL,
            quantityReceived INTEGER NOT NULL,
            repeatCount INTEGER,
            expiryDate TEXT,
            nextPrescriptionDate TEXT,
            reminderLeadTime INTEGER,
            status INTEGER NOT NULL,
            FOREIGN KEY (userMedicationId) REFERENCES userMedication(id)
        );
    `)

  db.execute(`
        CREATE TABLE IF NOT EXISTS prescriptionReminder (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prescriptionId INTEGER NOT NULL,
            reminderDate TEXT NOT NULL,
            leadTime INTEGER,
            enabled INTEGER NOT NULL,
            FOREIGN KEY(prescriptionId) REFERENCES prescription(id)
        );
    `)

  db.execute(`
        CREATE TABLE IF NOT EXISTS sideEffectRecord (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userMedicationId INTEGER NOT NULL,
            dateRecorded TEXT NOT NULL,
            description TEXT,
            FOREIGN KEY (userMedicationId) REFERENCES userMedication(id)
        );
    `)

  db.execute(`
        CREATE TABLE IF NOT EXISTS doseRecord (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scheduleId INTEGER NOT NULL,
            scheduleDateTime TEXT NOT NULL,
            actualTakenDateTime TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (scheduleId) REFERENCES medicationSchedule(id)
        );
    `)

  db.execute(`
        CREATE TABLE IF NOT EXISTS interactionRecord (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userMedicationId INTEGER NOT NULL,
            interactingMedicationId INTEGER NOT NULL,
            description TEXT,
            notes TEXT,
            dateRecorded TEXT NOT NULL,
            FOREIGN KEY (userMedicationId) REFERENCES userMedication(id),
            FOREIGN KEY (interactingMedicationId) REFERENCES userMedication(id)
        );
    `)
}
