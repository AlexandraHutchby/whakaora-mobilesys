import Database from "better-sqlite3"
import type { Database as SqliteDatabase } from "better-sqlite3"

type ExecuteResult = {
  insertId?: number
  rowsAffected?: number
  rows: { _array: any[]; length: number }
}

function open(): SqliteDatabase {
  const sqlite = new Database(":memory:")
  sqlite.pragma("foreign_keys = ON")
  return sqlite
}

let sqlite = open()

export function resetTestDb(): void {
  sqlite.close()
  sqlite = open()
}

const db = {
  execute(sql: string, params: unknown[] = []): ExecuteResult {
    const stmt = sqlite.prepare(sql)

    if (stmt.reader) {
      const rows = stmt.all(...params)
      return { rows: { _array: rows, length: rows.length } }
    }

    const info = stmt.run(...params)
    return {
      insertId: Number(info.lastInsertRowid),
      rowsAffected: info.changes,
      rows: { _array: [], length: 0 },
    }
  },
}

export default db
