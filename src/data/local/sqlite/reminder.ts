import db from "./database";

export type Reminder = {
    id: number;
    scheduleId: number;
    reminderDateTime: string | null;
    reminderType: string | null;
    enabled: number;
    snoozeDuration: number | null;
};

export type NewReminder = Omit<Reminder, "id">;

export type ReminderUpdate = Partial<NewReminder>;

// ========== CREATE ==========
export function addReminder(data: Reminder): number {
    const result = db.execute(
        `INSERT INTO reminder
        (scheduleId, reminderDateTime, reminderType, enabled, snoozeDuration) VALUES
        (?, ?, ?,?,?,)`,
        [
            data.scheduleId,
            data.reminderDateTime,
            data.reminderType,
            data.enabled,
            data.snoozeDuration,
        ]
    );
    return result.insertId as number;
}

// ========== READ ==========
export function getAllReminders(): Reminder[] {
    const result = db.execute("SELECT * FROM reminder ORDER BY reminderDateTime ASC");
    return (result.rows?._array as Reminder[]) ?? [];
}

export function getCurrentReminders(): Reminder[] {
    const result = db.execute("SELECT * FROM reminder WHERE enabled = 1 ORDER BY reminderDateTime ASC");
    return (result.rows?._array as Reminder[]) ?? [];
}

// ========== UPDATE ==========
export function updateReminder(id: number, data: Reminder): void {
    const fields = Object.keys(data) as (keyof ReminderUpdate)[];

    if (fields.length === 0) return;

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => data[field]);

    db.execute(
        `UPDATE reminder SET ${setClause} WHERE id = ?`,
        [...values, id]
    );
}

// ========== DELETE ==========
export function deleteReminder(id: number): void {
    db.execute("DELETE FROM reminder WHERE id = ?", [id]);
}