import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { ObservacaoRepository } from '../../../src/repositories/ObservacaoRepository'
import { FaseRepository } from '../../../src/repositories/FaseRepository'
import { ClienteRepository } from '../../../src/repositories/ClienteRepository'
import { setupTestDatabase, teardownTestDatabase, clearAllTables } from '../../fixtures/testDatabase'

describe('ObservacaoRepository', () => {
  let obsRepo: ObservacaoRepository
  let faseRepo: FaseRepository
  let clienteRepo: ClienteRepository
  let tarefaId: string

  beforeAll(async () => {
    await setupTestDatabase()
    obsRepo = new ObservacaoRepository()
    faseRepo = new FaseRepository()
    clienteRepo = new ClienteRepository()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await clearAllTables()
    await clienteRepo.createCliente({ id: 'estefania', nome: 'Estefania Silva' })
    const fase = await faseRepo.createFaseWithTarefas('estefania', {
      numero: 'Fase 01',
      titulo: 'Discovery',
      resumo: '',
      tarefas: [{ texto: 'Tarefa com observacao' }],
      materiais: [],
    })
    tarefaId = fase.tarefas[0].id
  })

  it('should return null when observacao does not exist', async () => {
    const obs = await obsRepo.getObservacao('estefania', tarefaId)
    expect(obs).toBeNull()
  })

  it('should create observacao when it does not exist (upsert)', async () => {
    const obs = await obsRepo.upsertObservacao('estefania', tarefaId, 'Primeira observacao')
    expect(obs.conteudo).toBe('Primeira observacao')
    expect(obs.tarefa_id).toBe(tarefaId)
  })

  it('should update observacao when it already exists (upsert - no 409)', async () => {
    await obsRepo.upsertObservacao('estefania', tarefaId, 'Primeira observacao')
    const updated = await obsRepo.upsertObservacao('estefania', tarefaId, 'Observacao atualizada')
    expect(updated.conteudo).toBe('Observacao atualizada')

    const obs = await obsRepo.getObservacao('estefania', tarefaId)
    expect(obs?.conteudo).toBe('Observacao atualizada')
  })

  it('should delete observacao', async () => {
    await obsRepo.upsertObservacao('estefania', tarefaId, 'Para deletar')
    await obsRepo.deleteObservacao('estefania', tarefaId)
    const obs = await obsRepo.getObservacao('estefania', tarefaId)
    expect(obs).toBeNull()
  })
})
