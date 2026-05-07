import { initializeDatabase, closeDatabase, getDatabase } from '../../src/database'

export async function setupTestDatabase(): Promise<void> {
  await initializeDatabase(':memory:')
}

export async function teardownTestDatabase(): Promise<void> {
  await closeDatabase()
}

export async function clearAllTables(): Promise<void> {
  const db = getDatabase()
  await db.run('DELETE FROM observacoes')
  await db.run('DELETE FROM tarefas')
  await db.run('DELETE FROM materiais')
  await db.run('DELETE FROM fases')
  await db.run('DELETE FROM clientes')
}
