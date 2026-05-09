import fs from 'fs'
import path from 'path'
import type { Database } from 'sqlite'

interface MigrationFile {
  version: number
  filename: string
  sql: string
}

async function ensureMigrationsTable(db: Database): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      aplicado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

async function getAppliedVersions(db: Database): Promise<Set<number>> {
  const rows = await db.all<{ version: number }[]>(
    'SELECT version FROM schema_migrations ORDER BY version'
  )
  return new Set(rows.map((r) => r.version))
}

function loadMigrationFiles(migrationsDir: string): MigrationFile[] {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  return files.map((filename) => {
    const match = filename.match(/^(\d+)_/)
    if (!match) {
      throw new Error(`Migration ${filename} nao segue o padrao NNN_descricao.sql`)
    }
    const version = parseInt(match[1], 10)
    const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf-8')
    return { version, filename, sql }
  })
}

export async function runMigrations(db: Database): Promise<void> {
  await ensureMigrationsTable(db)
  const applied = await getAppliedVersions(db)

  const migrationsDir = path.join(__dirname, 'migrations')
  const migrations = loadMigrationFiles(migrationsDir)
  const pending = migrations.filter((m) => !applied.has(m.version))

  for (const migration of pending) {
    await db.exec(migration.sql)
    await db.run('INSERT INTO schema_migrations (version) VALUES (?)', [migration.version])
  }
}
