import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PainelService } from '../../../src/services/PainelService'
import { NotFoundError } from '../../../src/shared/errors'
import type { ClienteRepository, ClienteRow } from '../../../src/repositories/ClienteRepository'
import type { FaseRepository, FaseComTarefas } from '../../../src/repositories/FaseRepository'
import type { MaterialRepository, MaterialRow } from '../../../src/repositories/MaterialRepository'

const createFaseComTarefasMock = (overrides?: Partial<FaseComTarefas>): FaseComTarefas => ({
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
  tarefas: [],
  materiais: [],
  ...overrides,
})

const createClienteRow = (): ClienteRow => ({
  id: 'estefania',
  nome: 'Estefania Silva',
  descricao: null,
  ativo: 1,
  criado_em: '2026-01-01',
  atualizado_em: '2026-01-01',
})

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
      getFasesWithAllTarefas: vi.fn(),
    } as unknown as FaseRepository

    materialRepo = {
      getAllMaterialsByCliente: vi.fn(),
    } as unknown as MaterialRepository

    service = new PainelService(clienteRepo, faseRepo, materialRepo)
  })

  describe('when getPainelCompleto is called', () => {
    it('should return DadosPainel aggregating fases and biblioteca', async () => {
      vi.mocked(clienteRepo.getCliente).mockResolvedValue(createClienteRow())
      vi.mocked(faseRepo.getFasesWithAllTarefas).mockResolvedValue([
        createFaseComTarefasMock({
          status: 'done',
          tarefas: [
            { id: 't1', fase_id: 'fase-1', cliente_id: 'estefania', texto: 'T1', concluida: 1, ordem: 0, observacao: null },
          ],
        }),
      ])
      vi.mocked(materialRepo.getAllMaterialsByCliente).mockResolvedValue([])

      const painel = await service.getPainelCompleto('estefania')

      expect(painel.cliente).toBe('estefania')
      expect(painel.fases).toHaveLength(1)
      expect(painel.fases[0].titulo).toBe('Discovery')
      expect(painel.fases[0].status).toBe('done')
      expect(painel.biblioteca).toHaveLength(0)
    })

    it('should attach fase-specific materials to their fases and biblioteca materials separately', async () => {
      vi.mocked(clienteRepo.getCliente).mockResolvedValue(createClienteRow())
      vi.mocked(faseRepo.getFasesWithAllTarefas).mockResolvedValue([createFaseComTarefasMock()])

      const materialFase: MaterialRow = {
        id: 'mat-1', cliente_id: 'estefania', fase_id: 'fase-1',
        nome: 'Wireframe', tipo: 'PDF', url: 'https://exemplo.com/doc.pdf', ordem: 0,
      }
      const materialBiblioteca: MaterialRow = {
        id: 'mat-2', cliente_id: 'estefania', fase_id: null,
        nome: 'Template', tipo: 'DOC', url: '', ordem: 0,
      }
      vi.mocked(materialRepo.getAllMaterialsByCliente).mockResolvedValue([materialFase, materialBiblioteca])

      const painel = await service.getPainelCompleto('estefania')

      expect(painel.fases[0].materiais).toHaveLength(1)
      expect(painel.fases[0].materiais[0].nome).toBe('Wireframe')
      expect(painel.biblioteca).toHaveLength(1)
      expect(painel.biblioteca[0].nome).toBe('Template')
    })

    it('should throw NotFoundError when cliente does not exist', async () => {
      vi.mocked(clienteRepo.getCliente).mockResolvedValue(null)

      await expect(service.getPainelCompleto('nao-existe')).rejects.toThrow(NotFoundError)
    })
  })
})
