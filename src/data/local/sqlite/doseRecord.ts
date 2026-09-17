import db from "./database";

export type DoseRecord = {
    id: number;
    scheduleId: number;
    scheduleDateTime: string;
    actualTimeTaken: string;
    status: string;
};

export type NewDoseRecord = Omit<DoseRecord, "id">;

export type DoseRecordUpdate = Partial<NewDoseRecord>;

// ========== CREATE ==========
export function addDoseRecord(data: DoseRecord): number {
    const result = db.execute(
        `INSERT INTO doseRecord
        (scheduleId, scheduleDateTime, actualTimeTaken, status) VALUES
        (?, ?, ?,?)`,
        [
            data.scheduleId,
            data.scheduleDateTime,
            data.actualTimeTaken,
            data.status,
        ]
    );
    return result.insertId as number;
}

// ========== READ ==========
export function getAllDoseRecords(): DoseRecord[] {
    const result = db.execute("SELECT * FROM doseRecords ORDER BY scheduleDateTime DES");
    return (result.rows?._array as DoseRecord[]) ?? [];
}

export function getMissedDoses(): DoseRecord[] {
    const result = db.execute("SELECT * FROM doseRecord WHERE scheduleDateTime != actualTimeTaken ORDER BY scheduleDateTime DES");
    return (result.rows?._array as DoseRecord[]) ?? [];
}

// ========== UPDATE ==========
export function updateDoseRecord(id: number, data: DoseRecord): void {
    const fields = Object.keys(data) as (keyof DoseRecordUpdate)[];

    if (fields.length === 0) return;

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => data[field]);

    db.execute(
        `UPDATE doseRecord SET ${setClause} WHERE id = ?`,
        [...values, id]
    );
}

// ========== DELETE ==========
export function deleteDoseRecord(id: number): void {
    db.execute("DELETE FROM doseRecord WHERE id = ?", [id]);
}