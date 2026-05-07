import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { ClienteRepository } from '../../../src/repositories/ClienteRepository'
import { setupTestDatabase, teardownTestDatabase, clearAllTables } from '../../fixtures/testDatabase'

describe('ClienteRepository', () => {
  let repository: ClienteRepository

  beforeAll(async () => {
    await setupTestDatabase()
    repository = new ClienteRepository()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await clearAllTables()
  })

  it('should create a cliente and return it', async () => {
    const cliente = await repository.createCliente({
      id: 'estefania',
      nome: 'Estefania Silva',
      descricao: 'Cliente principal',
    })

    expect(cliente.id).toBe('estefania')
    expect(cliente.nome).toBe('Estefania Silva')
    expect(cliente.descricao).toBe('Cliente principal')
    expect(cliente.ativo).toBe(1)
    expect(cliente.criado_em).toBeDefined()
  })

  it('should return null when cliente does not exist', async () => {
    const cliente = await repository.getCliente('nao-existe')
    expect(cliente).toBeNull()
  })

  it('should return the cliente when it exists', async () => {
    await repository.createCliente({ id: 'julia', nome: 'Julia Santos' })
    const cliente = await repository.getCliente('julia')

    expect(cliente).not.toBeNull()
    expect(cliente?.id).toBe('julia')
    expect(cliente?.nome).toBe('Julia Santos')
  })

  it('should delete cliente and cascade to related data', async () => {
    await repository.createCliente({ id: 'cliente-cascade', nome: 'Para Deletar' })
    await repository.deleteCliente('cliente-cascade')

    const cliente = await repository.getCliente('cliente-cascade')
    expect(cliente).toBeNull()
  })
})
