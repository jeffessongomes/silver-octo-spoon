import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FaseService } from '../../../src/services/FaseService'
import { NotFoundError } from '../../../src/shared/errors'
import type { FaseRepository, FaseComTarefas, CreateFaseDTO } from '../../../src/repositories/FaseRepository'
import type { TarefaRepository } from '../../../src/repositories/TarefaRepository'
import type { ClienteRepository, ClienteRow } from '../../../src/repositories/ClienteRepository'

const createFaseMock = (overrides?: Partial<FaseComTarefas>): FaseComTarefas => ({
  id: 'fase-1',
  cliente_id: 'estefania',
  numero: 'Fase 01 · Mes 1',
  titulo: 'Discovery',
  resumo: 'Fase de discovery',
  status: 'pending',
  tipo: null,
  ordem: 0,
  ativo: 1,
  criado_em: '2026-01-01T00:00:00Z',
  atualizado_em: '2026-01-01T00:00:00Z',
  tarefas: [],
  materiais: [],
  ...overrides,
})

const createClienteRow = (overrides?: Partial<ClienteRow>): ClienteRow => ({
  id: 'estefania',
  nome: 'Estefania Silva',
  descricao: null,
  ativo: 1,
  criado_em: '2026-01-01T00:00:00Z',
  atualizado_em: '2026-01-01T00:00:00Z',
  ...overrides,
})

const createFaseDTO = (overrides?: Partial<CreateFaseDTO>): CreateFaseDTO => ({
  numero: 'Fase 01 · Mês 1',
  titulo: 'Discovery',
  resumo: 'Fase de discovery',
  tarefas: [],
  materiais: [],
  ...overrides,
})

describe('FaseService', () => {
  let service: FaseService
  let faseRepo: FaseRepository
  let tarefaRepo: TarefaRepository
  let clienteRepo: ClienteRepository

  beforeEach(() => {
    faseRepo = {
      getFaseWithTarefas: vi.fn(),
      createFaseWithTarefas: vi.fn(),
      getFasesByCliente: vi.fn(),
      getFasesWithAllTarefas: vi.fn(),
      updateFase: vi.fn(),
      deleteFase: vi.fn(),
    } as unknown as FaseRepository

    tarefaRepo = {
      getTarefa: vi.fn(),
      updateTarefa: vi.fn(),
      createTarefa: vi.fn(),
      getTarefasByFase: vi.fn(),
      deleteTarefa: vi.fn(),
    } as unknown as TarefaRepository

    clienteRepo = {
      getCliente: vi.fn(),
      createCliente: vi.fn(),
      getAll: vi.fn(),
      updateCliente: vi.fn(),
      deleteCliente: vi.fn(),
    } as unknown as ClienteRepository

    service = new FaseService(faseRepo, tarefaRepo, clienteRepo)
  })

  describe('when getFaseComTarefas is called', () => {
    it('should return fase with calculated status', async () => {
      const faseMock = createFaseMock({
        status: 'active',
        tarefas: [
          { id: 't1', fase_id: 'fase-1', cliente_id: 'estefania', texto: 'T1', concluida: 1, ordem: 0 },
          { id: 't2', fase_id: 'fase-1', cliente_id: 'estefania', texto: 'T2', concluida: 0, ordem: 1 },
        ],
      })
      vi.mocked(faseRepo.getFaseWithTarefas).mockResolvedValue(faseMock)

      const result = await service.getFaseComTarefas('estefania', 'fase-1')
      expect(result.status).toBe('active')
    })

    it('should throw NotFoundError when fase does not exist', async () => {
      vi.mocked(faseRepo.getFaseWithTarefas).mockResolvedValue(null)

      await expect(service.getFaseComTarefas('estefania', 'nao-existe')).rejects.toThrow(NotFoundError)
    })
  })

  describe('when toggleTarefaEAtualizarFase is called', () => {
    it('should return updated tarefa and fase with recalculated status', async () => {
      const tarefaMock = { id: 't1', fase_id: 'fase-1', cliente_id: 'estefania', texto: 'T1', concluida: 1, ordem: 0 }
      const faseMock = createFaseMock({
        status: 'done',
        tarefas: [tarefaMock],
      })

      vi.mocked(tarefaRepo.updateTarefa).mockResolvedValue(tarefaMock)
      vi.mocked(faseRepo.getFaseWithTarefas).mockResolvedValue(faseMock)

      const result = await service.toggleTarefaEAtualizarFase('estefania', 't1', 'fase-1', true)

      expect(result.tarefa.concluida).toBe(1)
      expect(result.fase.status).toBe('done')
    })
  })

  describe('when createFase is called', () => {
    it('should throw NotFoundError when cliente does not exist', async () => {
      vi.mocked(clienteRepo.getCliente).mockResolvedValue(null)

      await expect(service.createFase('nao-existe', createFaseDTO())).rejects.toThrow(NotFoundError)
      expect(faseRepo.createFaseWithTarefas).not.toHaveBeenCalled()
    })

    it('should delegate to faseRepository when cliente exists', async () => {
      const faseMock = createFaseMock()
      vi.mocked(clienteRepo.getCliente).mockResolvedValue(createClienteRow())
      vi.mocked(faseRepo.createFaseWithTarefas).mockResolvedValue(faseMock)

      const result = await service.createFase('estefania', createFaseDTO())

      expect(clienteRepo.getCliente).toHaveBeenCalledWith('estefania')
      expect(faseRepo.createFaseWithTarefas).toHaveBeenCalledWith('estefania', createFaseDTO())
      expect(result.id).toBe('fase-1')
    })
  })
})
