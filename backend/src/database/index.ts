import path from 'path'
import fs from 'fs'
import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import { runMigrations } from './migrationRunner'

let db: Database | null = null

export async function initializeDatabase(dbPath: string = './data/painel.db'): Promise<void> {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  })

  await db.run('PRAGMA foreign_keys = ON')
  await runMigrations(db)
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.')
  }
  return db
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close()
    db = null
  }
}
