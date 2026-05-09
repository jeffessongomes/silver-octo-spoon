import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TarefaService } from '../../../src/services/TarefaService'
import { NotFoundError } from '../../../src/shared/errors'
import type { FaseRepository, FaseComTarefas } from '../../../src/repositories/FaseRepository'
import type { TarefaRepository } from '../../../src/repositories/TarefaRepository'
import type { TarefaRow } from '../../../src/repositories/FaseRepository'

const createTarefaRow = (overrides?: Partial<TarefaRow>): TarefaRow => ({
  id: 't-1',
  fase_id: 'fase-1',
  cliente_id: 'estefania',
  texto: 'Revisar briefing com o cliente',
  concluida: 0,
  ordem: 0,
  ...overrides,
})

const createFaseComTarefas = (overrides?: Partial<FaseComTarefas>): FaseComTarefas => ({
  id: 'fase-1',
  cliente_id: 'estefania',
  numero: '01',
  titulo: 'Briefing',
  resumo: null,
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

describe('TarefaService', () => {
  let service: TarefaService
  let tarefaRepo: TarefaRepository
  let faseRepo: FaseRepository

  beforeEach(() => {
    tarefaRepo = {
      getTarefa: vi.fn(),
      getTarefasByFase: vi.fn(),
      createTarefa: vi.fn(),
      updateTarefa: vi.fn(),
      deleteTarefa: vi.fn(),
    } as unknown as TarefaRepository

    faseRepo = {
      getFaseWithTarefas: vi.fn(),
      recalculateFaseStatus: vi.fn(),
      getFasesByCliente: vi.fn(),
      createFaseWithTarefas: vi.fn(),
      updateFase: vi.fn(),
      deleteFase: vi.fn(),
    } as unknown as FaseRepository

    service = new TarefaService(tarefaRepo, faseRepo)
  })

  describe('when getTarefa is called', () => {
    it('should return tarefa when found', async () => {
      const tarefa = createTarefaRow()
      vi.mocked(tarefaRepo.getTarefa).mockResolvedValue(tarefa)

      const result = await service.getTarefa('estefania', 't-1')

      expect(result).toEqual(tarefa)
      expect(tarefaRepo.getTarefa).toHaveBeenCalledWith('estefania', 't-1')
    })

    it('should return null when not found', async () => {
      vi.mocked(tarefaRepo.getTarefa).mockResolvedValue(null)

      const result = await service.getTarefa('estefania', 'nao-existe')

      expect(result).toBeNull()
    })
  })

  describe('when getTarefasByFase is called', () => {
    it('should delegate to tarefaRepository with filtro', async () => {
      const tarefas = [createTarefaRow()]
      vi.mocked(tarefaRepo.getTarefasByFase).mockResolvedValue(tarefas)

      const result = await service.getTarefasByFase('estefania', 'fase-1', 'pendentes')

      expect(result).toEqual(tarefas)
      expect(tarefaRepo.getTarefasByFase).toHaveBeenCalledWith('estefania', 'fase-1', 'pendentes')
    })
  })

  describe('when createTarefa is called', () => {
    it('should create tarefa and recalculate fase status', async () => {
      const tarefa = createTarefaRow()
      const fase = createFaseComTarefas({ tarefas: [tarefa] })

      vi.mocked(tarefaRepo.createTarefa).mockResolvedValue(tarefa)
      vi.mocked(faseRepo.recalculateFaseStatus).mockResolvedValue(undefined)
      vi.mocked(faseRepo.getFaseWithTarefas).mockResolvedValue(fase)

      const result = await service.createTarefa('estefania', 'fase-1', { texto: 'Revisar briefing com o cliente' })

      expect(tarefaRepo.createTarefa).toHaveBeenCalledWith({ texto: 'Revisar briefing com o cliente', faseId: 'fase-1', clienteId: 'estefania' })
      expect(faseRepo.recalculateFaseStatus).toHaveBeenCalledWith('estefania', 'fase-1')
      expect(result.tarefa).toEqual(tarefa)
    })
  })

  describe('when updateTarefa is called', () => {
    it('should throw NotFoundError when tarefa does not exist', async () => {
      vi.mocked(tarefaRepo.getTarefa).mockResolvedValue(null)

      await expect(service.updateTarefa('estefania', 'nao-existe', {})).rejects.toThrow(NotFoundError)
    })

    it('should update tarefa and recalculate status when concluida changes', async () => {
      const tarefa = createTarefaRow({ concluida: 1 })
      const fase = createFaseComTarefas({ status: 'done', tarefas: [tarefa] })

      vi.mocked(tarefaRepo.getTarefa).mockResolvedValue(createTarefaRow())
      vi.mocked(tarefaRepo.updateTarefa).mockResolvedValue(tarefa)
      vi.mocked(faseRepo.recalculateFaseStatus).mockResolvedValue(undefined)
      vi.mocked(faseRepo.getFaseWithTarefas).mockResolvedValue(fase)

      const result = await service.updateTarefa('estefania', 't-1', { concluida: true })

      expect(faseRepo.recalculateFaseStatus).toHaveBeenCalledWith('estefania', 'fase-1')
      expect(result.tarefa.concluida).toBe(1)
    })

    it('should not recalculate status when concluida is not in payload', async () => {
      const tarefa = createTarefaRow({ texto: 'Novo texto' })
      const fase = createFaseComTarefas({ tarefas: [tarefa] })

      vi.mocked(tarefaRepo.getTarefa).mockResolvedValue(createTarefaRow())
      vi.mocked(tarefaRepo.updateTarefa).mockResolvedValue(tarefa)
      vi.mocked(faseRepo.getFaseWithTarefas).mockResolvedValue(fase)

      await service.updateTarefa('estefania', 't-1', { texto: 'Novo texto' })

      expect(faseRepo.recalculateFaseStatus).not.toHaveBeenCalled()
    })
  })

  describe('when deleteTarefa is called', () => {
    it('should throw NotFoundError when tarefa does not exist', async () => {
      vi.mocked(tarefaRepo.getTarefa).mockResolvedValue(null)

      await expect(service.deleteTarefa('estefania', 'nao-existe')).rejects.toThrow(NotFoundError)
    })

    it('should delete tarefa and recalculate fase status', async () => {
      const tarefa = createTarefaRow()

      vi.mocked(tarefaRepo.getTarefa).mockResolvedValue(tarefa)
      vi.mocked(tarefaRepo.deleteTarefa).mockResolvedValue(undefined)
      vi.mocked(faseRepo.recalculateFaseStatus).mockResolvedValue(undefined)

      await service.deleteTarefa('estefania', 't-1')

      expect(tarefaRepo.deleteTarefa).toHaveBeenCalledWith('estefania', 't-1')
      expect(faseRepo.recalculateFaseStatus).toHaveBeenCalledWith('estefania', 'fase-1')
    })
  })
})
