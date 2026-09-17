import db from "./database";

export type Prescription = {
    id: number;
    userMedicationId: number;
    quantityReceived: number;
    repeatCount: number | null;
    expiryDate: string | null;
    nextPrescriptionDate: string | null;
    reminderLeadTime: number | null;
    status: number;
};

export type NewPrescription = Omit<Prescription, "id">;

export type PrescriptionUpdate = Partial<NewPrescription>;

// ========== CREATE ==========
export function addPrescription(data: Prescription): number {
    const result = db.execute(
        `INSERT INTO prescription
        (userMedicationId, quantityReceived, repeatCount, expiryDate, nextPrescriptionDate, reminderLeadTime, status) VALUES
        (?, ?, ?,?,?,?,?)`,
        [
            data.userMedicationId,
            data.quantityReceived,
            data.repeatCount,
            data.expiryDate,
            data.nextPrescriptionDate,
            data.reminderLeadTime,
            data.status,
        ]
    );
    return result.insertId as number;
}

// ========== READ ==========
export function getAllPrescriptions(): Prescription[] {
    const result = db.execute("SELECT * FROM prescription ORDER BY userMedicationId ASC");
    return (result.rows?._array as Prescription[]) ?? [];
}

export function getCurrentPrescriptions(): Prescription[] {
    const result = db.execute("SELECT * FROM prescription WHERE status = current ORDER BY userMedicationId ASC");
    return (result.rows?._array as Prescription[]) ?? [];
}

// ========== UPDATE ==========
export function updatePrescription(id: number, data: Prescription): void {
    const fields = Object.keys(data) as (keyof PrescriptionUpdate)[];

    if (fields.length === 0) return;

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => data[field]);

    db.execute(
        `UPDATE prescription SET ${setClause} WHERE id = ?`,
        [...values, id]
    );
}

// ========== DELETE ==========
export function deletePrescription(id: number): void {
    db.execute("DELETE FROM prescription WHERE id = ?", [id]);
}