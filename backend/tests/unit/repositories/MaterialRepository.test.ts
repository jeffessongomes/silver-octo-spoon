import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { MaterialRepository } from '../../../src/repositories/MaterialRepository'
import { FaseRepository } from '../../../src/repositories/FaseRepository'
import { ClienteRepository } from '../../../src/repositories/ClienteRepository'
import { setupTestDatabase, teardownTestDatabase, clearAllTables } from '../../fixtures/testDatabase'

describe('MaterialRepository', () => {
  let matRepo: MaterialRepository
  let faseRepo: FaseRepository
  let clienteRepo: ClienteRepository
  let faseId: string

  beforeAll(async () => {
    await setupTestDatabase()
    matRepo = new MaterialRepository()
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
      tarefas: [],
      materiais: [],
    })
    faseId = fase.id

    await matRepo.createMaterial({
      clienteId: 'estefania',
      faseId,
      nome: 'Guia de estilos',
      tipo: 'PDF',
      url: 'https://exemplo.com/guia.pdf',
    })
    await matRepo.createMaterial({
      clienteId: 'estefania',
      faseId: null,
      nome: 'Template geral',
      tipo: 'DOC',
      url: '#',
    })
  })

  it('should return only materiais for a specific fase', async () => {
    const materiais = await matRepo.getMaterialsByFase('estefania', faseId)
    expect(materiais).toHaveLength(1)
    expect(materiais[0].nome).toBe('Guia de estilos')
  })

  it('should return global biblioteca items (fase_id is null)', async () => {
    const biblioteca = await matRepo.getMaterialsByCliente('estefania')
    expect(biblioteca).toHaveLength(1)
    expect(biblioteca[0].nome).toBe('Template geral')
  })
})
