import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { TarefaRepository } from '../../../src/repositories/TarefaRepository'
import { FaseRepository } from '../../../src/repositories/FaseRepository'
import { ClienteRepository } from '../../../src/repositories/ClienteRepository'
import { setupTestDatabase, teardownTestDatabase, clearAllTables } from '../../fixtures/testDatabase'

describe('TarefaRepository', () => {
  let tarefaRepo: TarefaRepository
  let faseRepo: FaseRepository
  let clienteRepo: ClienteRepository
  let faseId: string

  beforeAll(async () => {
    await setupTestDatabase()
    tarefaRepo = new TarefaRepository()
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
      tarefas: [
        { texto: 'Tarefa pendente 1' },
        { texto: 'Tarefa pendente 2' },
        { texto: 'Tarefa concluida' },
      ],
      materiais: [],
    })
    faseId = fase.id

    await tarefaRepo.updateTarefa('estefania', fase.tarefas[2].id, { concluida: true })
  })

  it('should return all tarefas when filtro is "todas"', async () => {
    const tarefas = await tarefaRepo.getTarefasByFase('estefania', faseId, 'todas')
    expect(tarefas).toHaveLength(3)
  })

  it('should return only pending tarefas when filtro is "pendentes"', async () => {
    const tarefas = await tarefaRepo.getTarefasByFase('estefania', faseId, 'pendentes')
    expect(tarefas).toHaveLength(2)
    tarefas.forEach((t) => expect(t.concluida).toBe(0))
  })

  it('should update tarefa concluida status', async () => {
    const tarefas = await tarefaRepo.getTarefasByFase('estefania', faseId, 'pendentes')
    const tarefa = tarefas[0]

    const updated = await tarefaRepo.updateTarefa('estefania', tarefa.id, { concluida: true })
    expect(updated.concluida).toBe(1)
  })
})
