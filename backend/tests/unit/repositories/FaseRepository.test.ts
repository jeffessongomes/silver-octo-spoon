import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FaseRepository } from '../../../src/repositories/FaseRepository'
import { ClienteRepository } from '../../../src/repositories/ClienteRepository'
import { setupTestDatabase, teardownTestDatabase, clearAllTables } from '../../fixtures/testDatabase'

describe('FaseRepository', () => {
  let faseRepo: FaseRepository
  let clienteRepo: ClienteRepository

  beforeAll(async () => {
    await setupTestDatabase()
    faseRepo = new FaseRepository()
    clienteRepo = new ClienteRepository()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await clearAllTables()
    await clienteRepo.createCliente({ id: 'estefania', nome: 'Estefania Silva' })
  })

  it('should return only fases belonging to the given cliente', async () => {
    await clienteRepo.createCliente({ id: 'outro-cliente', nome: 'Outro Cliente' })

    await faseRepo.createFaseWithTarefas('estefania', {
      numero: 'Fase 01 · Mes 1',
      titulo: 'Discovery',
      resumo: 'Fase de discovery',
      tarefas: [{ texto: 'Mapeamento de requisitos' }],
      materiais: [],
    })
    await faseRepo.createFaseWithTarefas('outro-cliente', {
      numero: 'Fase 01',
      titulo: 'Outro',
      resumo: '',
      tarefas: [],
      materiais: [],
    })

    const fases = await faseRepo.getFasesByCliente('estefania')
    expect(fases).toHaveLength(1)
    expect(fases[0].titulo).toBe('Discovery')
  })

  it('should return fase with nested tarefas', async () => {
    const fase = await faseRepo.createFaseWithTarefas('estefania', {
      numero: 'Fase 01 · Mes 1',
      titulo: 'Discovery',
      resumo: 'Resumo da fase',
      tarefas: [
        { texto: 'Tarefa 1' },
        { texto: 'Tarefa 2' },
      ],
      materiais: [],
    })

    const faseComTarefas = await faseRepo.getFaseWithTarefas('estefania', fase.id)
    expect(faseComTarefas).not.toBeNull()
    expect(faseComTarefas?.tarefas).toHaveLength(2)
    expect(faseComTarefas?.tarefas[0].texto).toBe('Tarefa 1')
  })

  it('should create fase with tarefas in a single transaction', async () => {
    const fase = await faseRepo.createFaseWithTarefas('estefania', {
      numero: 'Fase 02 · Mes 2',
      titulo: 'Design',
      resumo: 'Fase de design',
      tarefas: [
        { texto: 'Wireframes' },
        { texto: 'Protótipo' },
      ],
      materiais: [],
    })

    expect(fase.id).toBeDefined()
    expect(fase.titulo).toBe('Design')
    expect(fase.tarefas).toHaveLength(2)
    expect(fase.status).toBe('pending')
  })

  it('should recalculate fase status based on completed tarefas', async () => {
    const fase = await faseRepo.createFaseWithTarefas('estefania', {
      numero: 'Fase 03',
      titulo: 'Desenvolvimento',
      resumo: '',
      tarefas: [
        { texto: 'Task A' },
        { texto: 'Task B' },
      ],
      materiais: [],
    })

    const db = (faseRepo as unknown as { db: import('sqlite').Database }).db
    await db.run(
      'UPDATE tarefas SET concluida = 1 WHERE fase_id = ?',
      [fase.id]
    )
    await faseRepo.recalculateFaseStatus('estefania', fase.id)

    const atualizada = await faseRepo.getFaseWithTarefas('estefania', fase.id)
    expect(atualizada?.status).toBe('done')
  })
})
