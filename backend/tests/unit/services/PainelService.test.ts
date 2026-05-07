import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PainelService } from '../../../src/services/PainelService'
import { NotFoundError } from '../../../src/shared/errors'
import type { ClienteRepository } from '../../../src/repositories/ClienteRepository'
import type { FaseRepository } from '../../../src/repositories/FaseRepository'
import type { MaterialRepository } from '../../../src/repositories/MaterialRepository'

describe('PainelService', () => {
  let service: PainelService
  let clienteRepo: ClienteRepository
  let faseRepo: FaseRepository
  let materialRepo: MaterialRepository

  beforeEach(() => {
    clienteRepo = {
      getCliente: vi.fn(),
    } as unknown as ClienteRepository

    faseRepo = {
      getFasesByCliente: vi.fn(),
      getFaseWithTarefas: vi.fn(),
    } as unknown as FaseRepository

    materialRepo = {
      getMaterialsByCliente: vi.fn(),
    } as unknown as MaterialRepository

    service = new PainelService(clienteRepo, faseRepo, materialRepo)
  })

  describe('when getPainelCompleto is called', () => {
    it('should return DadosPainel aggregating fases and biblioteca', async () => {
      vi.mocked(clienteRepo.getCliente).mockResolvedValue({
        id: 'estefania',
        nome: 'Estefania Silva',
        descricao: null,
        ativo: 1,
        criado_em: '2026-01-01',
        atualizado_em: '2026-01-01',
      })
      vi.mocked(faseRepo.getFasesByCliente).mockResolvedValue([
        {
          id: 'fase-1',
          cliente_id: 'estefania',
          numero: 'Fase 01',
          titulo: 'Discovery',
          resumo: '',
          status: 'pending',
          tipo: null,
          ordem: 0,
          ativo: 1,
          criado_em: '2026-01-01',
          atualizado_em: '2026-01-01',
        },
      ])
      vi.mocked(faseRepo.getFaseWithTarefas).mockResolvedValue({
        id: 'fase-1',
        cliente_id: 'estefania',
        numero: 'Fase 01',
        titulo: 'Discovery',
        resumo: '',
        status: 'done',
        tipo: null,
        ordem: 0,
        ativo: 1,
        criado_em: '2026-01-01',
        atualizado_em: '2026-01-01',
        tarefas: [
          { id: 't1', fase_id: 'fase-1', cliente_id: 'estefania', texto: 'T1', concluida: 1, ordem: 0 },
        ],
        materiais: [],
      })
      vi.mocked(materialRepo.getMaterialsByCliente).mockResolvedValue([])

      const painel = await service.getPainelCompleto('estefania')

      expect(painel.cliente).toBe('estefania')
      expect(painel.fases).toHaveLength(1)
      expect(painel.fases[0].titulo).toBe('Discovery')
      expect(painel.biblioteca).toHaveLength(0)
    })

    it('should throw NotFoundError when cliente does not exist', async () => {
      vi.mocked(clienteRepo.getCliente).mockResolvedValue(null)

      await expect(service.getPainelCompleto('nao-existe')).rejects.toThrow(NotFoundError)
    })
  })
})
