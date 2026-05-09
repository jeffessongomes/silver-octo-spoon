import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { open, Database } from 'sqlite'
import sqlite3 from 'sqlite3'
import { runMigrations } from '../../../src/database/migrationRunner'

async function createInMemoryDb(): Promise<Database> {
  const db = await open({ filename: ':memory:', driver: sqlite3.Database })
  await db.run('PRAGMA foreign_keys = ON')
  return db
}

describe('runMigrations', () => {
  let db: Database

  beforeEach(async () => {
    db = await createInMemoryDb()
  })

  afterEach(async () => {
    await db.close()
  })

  it('should create schema_migrations table on first run', async () => {
    await runMigrations(db)

    const row = await db.get<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'"
    )
    expect(row?.name).toBe('schema_migrations')
  })

  it('should apply all migrations in order', async () => {
    await runMigrations(db)

    const rows = await db.all<{ version: number }[]>(
      'SELECT version FROM schema_migrations ORDER BY version'
    )
    const versions = rows.map((r) => r.version)
    expect(versions).toEqual([1, 2, 3])
  })

  it('should create all expected tables after migrations', async () => {
    await runMigrations(db)

    const tables = await db.all<{ name: string }[]>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    )
    const tableNames = tables.map((t) => t.name)

    expect(tableNames).toContain('clientes')
    expect(tableNames).toContain('fases')
    expect(tableNames).toContain('tarefas')
    expect(tableNames).toContain('observacoes')
    expect(tableNames).toContain('materiais')
    expect(tableNames).toContain('schema_migrations')
  })

  it('should not include status column in fases after migrations', async () => {
    await runMigrations(db)

    const columns = await db.all<{ name: string }[]>('PRAGMA table_info(fases)')
    const columnNames = columns.map((c) => c.name)

    expect(columnNames).not.toContain('status')
    expect(columnNames).toContain('tipo')
    expect(columnNames).toContain('ativo')
  })

  it('should be idempotent when run multiple times', async () => {
    await runMigrations(db)
    await runMigrations(db)

    const rows = await db.all<{ version: number }[]>(
      'SELECT version FROM schema_migrations ORDER BY version'
    )
    expect(rows).toHaveLength(3)
  })

  it('should reject invalid tipo in materiais after migration 003', async () => {
    await runMigrations(db)

    await db.run(
      "INSERT INTO clientes (id, nome) VALUES ('cli-1', 'Cliente Teste')"
    )

    await expect(
      db.run(
        "INSERT INTO materiais (id, cliente_id, nome, tipo, url) VALUES ('mat-1', 'cli-1', 'Arquivo', 'XLSX', '')"
      )
    ).rejects.toThrow()
  })

  it('should reject invalid tipo in fases after migration 002', async () => {
    await runMigrations(db)

    await db.run(
      "INSERT INTO clientes (id, nome) VALUES ('cli-1', 'Cliente Teste')"
    )

    await expect(
      db.run(
        "INSERT INTO fases (id, cliente_id, numero, titulo, tipo) VALUES ('f-1', 'cli-1', '01', 'Fase', 'invalido')"
      )
    ).rejects.toThrow()
  })
})
