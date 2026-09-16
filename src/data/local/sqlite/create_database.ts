import db from "./database";

export function initialiseDatabase() {
    db.execute(`
        CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        dosage TEXT,
        reminderTime TEXT
        );    
    `);

    db.execute(
        `INSERT INTO medications (name, dosage, reminderTime)
        values (?,?,?)`,
        ["Aspirin", "100mg", "08:00"],
    );

    db.execute("COMMIT");

    const result = db.execute("SELECT * FROM medications");

    console.log(result.rows?.item(0));
}