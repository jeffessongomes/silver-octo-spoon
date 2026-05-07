import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { initializeDatabase, closeDatabase } from '../../../src/database'

describe('Database', () => {
  beforeAll(async () => {
    await initializeDatabase(':memory:')
  })

  afterAll(async () => {
    await closeDatabase()
  })

  it('should create all required tables', async () => {
    const { getDatabase } = await import('../../../src/database')
    const db = getDatabase()

    const tables = await db.all<{ name: string }[]>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    )
    const tableNames = tables.map((t) => t.name)

    expect(tableNames).toContain('clientes')
    expect(tableNames).toContain('fases')
    expect(tableNames).toContain('tarefas')
    expect(tableNames).toContain('observacoes')
    expect(tableNames).toContain('materiais')
  })

  it('should create all required indexes', async () => {
    const { getDatabase } = await import('../../../src/database')
    const db = getDatabase()

    const indexes = await db.all<{ name: string }[]>(
      "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name"
    )
    const indexNames = indexes.map((i) => i.name)

    expect(indexNames).toContain('idx_fases_cliente')
    expect(indexNames).toContain('idx_tarefas_cliente')
    expect(indexNames).toContain('idx_tarefas_fase')
    expect(indexNames).toContain('idx_observacoes_cliente')
    expect(indexNames).toContain('idx_materiais_cliente')
    expect(indexNames).toContain('idx_materiais_fase')
  })

  it('should enforce foreign key constraints', async () => {
    const { getDatabase } = await import('../../../src/database')
    const db = getDatabase()

    await expect(
      db.run(
        "INSERT INTO fases (id, cliente_id, numero, titulo) VALUES ('f1', 'nao-existe', 'Fase 1', 'Titulo')"
      )
    ).rejects.toThrow()
  })
})
