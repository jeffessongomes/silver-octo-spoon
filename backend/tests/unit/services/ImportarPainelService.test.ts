import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { ImportarPainelService } from '../../../src/services/ImportarPainelService'
import { FaseRepository } from '../../../src/repositories/FaseRepository'
import { ClienteRepository } from '../../../src/repositories/ClienteRepository'
import { ObservacaoRepository } from '../../../src/repositories/ObservacaoRepository'
import { setupTestDatabase, teardownTestDatabase, clearAllTables } from '../../fixtures/testDatabase'

describe('ImportarPainelService', () => {
  let service: ImportarPainelService
  let faseRepo: FaseRepository
  let clienteRepo: ClienteRepository
  let obsRepo: ObservacaoRepository

  beforeAll(async () => {
    await setupTestDatabase()
    faseRepo = new FaseRepository()
    clienteRepo = new ClienteRepository()
    obsRepo = new ObservacaoRepository()
    service = new ImportarPainelService(clienteRepo, faseRepo)
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await clearAllTables()
    await clienteRepo.createCliente({ id: 'estefania', nome: 'Estefania Silva' })
  })

  describe('when payload is valid', () => {
    it('should create all fases with tarefas and materiais', async () => {
      const result = await service.importarPainel('estefania', {
        fases: [
          {
            titulo: 'Briefing',
            resumo: 'Reuniao inicial',
            tarefas: [{ texto: 'Colher requisitos' }, { texto: 'Validar escopo' }],
            materiais: [],
          },
          {
            titulo: 'Criacao',
            resumo: 'Desenvolvimento visual',
            tarefas: [{ texto: 'Criar logo' }],
            materiais: [{ nome: 'Referencia', tipo: 'PDF', url: 'https://ref.pdf' }],
          },
        ],
      })

      expect(result.importado).toBe(2)
      expect(result.fases).toHaveLength(2)
      expect(result.fases[0].titulo).toBe('Briefing')
      expect(result.fases[1].titulo).toBe('Criacao')

      const fases = await faseRepo.getFasesByCliente('estefania')
      expect(fases).toHaveLength(2)
    })

    it('should create observacao for tarefas that have observacao field', async () => {
      await service.importarPainel('estefania', {
        fases: [
          {
            titulo: 'Onboarding',
            tarefas: [
              { texto: 'Reuniao inicial', observacao: 'Cliente preferiu video chamada' },
              { texto: 'Assinar contrato' },
            ],
          },
        ],
      })

      const fases = await faseRepo.getFasesByCliente('estefania')
      const faseComTarefas = await faseRepo.getFaseWithTarefas('estefania', fases[0].id)
      expect(faseComTarefas?.tarefas).toHaveLength(2)

      const obs1 = await obsRepo.getObservacao('estefania', faseComTarefas!.tarefas[0].id)
      expect(obs1?.conteudo).toBe('Cliente preferiu video chamada')

      const obs2 = await obsRepo.getObservacao('estefania', faseComTarefas!.tarefas[1].id)
      expect(obs2).toBeNull()
    })

    it('should auto-number fases sequentially when numero is omitted', async () => {
      await service.importarPainel('estefania', {
        fases: [
          { titulo: 'Fase A' },
          { titulo: 'Fase B' },
          { titulo: 'Fase C' },
        ],
      })

      const fases = await faseRepo.getFasesByCliente('estefania')
      expect(fases[0].numero).toBe('1')
      expect(fases[1].numero).toBe('2')
      expect(fases[2].numero).toBe('3')
    })

    it('should number fases sequentially after existing fases', async () => {
      await faseRepo.createFaseWithTarefas('estefania', {
        numero: '1',
        titulo: 'Existente',
        resumo: '',
        tarefas: [],
        materiais: [],
      })

      await service.importarPainel('estefania', {
        fases: [{ titulo: 'Nova A' }, { titulo: 'Nova B' }],
      })

      const fases = await faseRepo.getFasesByCliente('estefania')
      const novas = fases.filter((f) => f.titulo !== 'Existente')
      expect(novas[0].numero).toBe('2')
      expect(novas[1].numero).toBe('3')
    })

    it('should use numero from payload when provided', async () => {
      await service.importarPainel('estefania', {
        fases: [{ numero: 'Fase 01 · Mes 1', titulo: 'Briefing' }],
      })

      const fases = await faseRepo.getFasesByCliente('estefania')
      expect(fases[0].numero).toBe('Fase 01 · Mes 1')
    })

    it('should create fase without tarefas when tarefas is omitted', async () => {
      await service.importarPainel('estefania', {
        fases: [{ titulo: 'Fase Vazia' }],
      })

      const fases = await faseRepo.getFasesByCliente('estefania')
      const faseComTarefas = await faseRepo.getFaseWithTarefas('estefania', fases[0].id)
      expect(faseComTarefas?.tarefas).toHaveLength(0)
    })
  })

  describe('when cliente does not exist', () => {
    it('should throw NotFoundError', async () => {
      await expect(
        service.importarPainel('nao-existe', { fases: [{ titulo: 'Teste' }] })
      ).rejects.toThrow('nao-existe')
    })
  })

  describe('when payload is invalid', () => {
    it('should throw when fases is missing', async () => {
      await expect(
        service.importarPainel('estefania', {} as { fases: [] })
      ).rejects.toThrow()
    })

    it('should throw when fases is empty', async () => {
      await expect(
        service.importarPainel('estefania', { fases: [] })
      ).rejects.toThrow()
    })

    it('should throw when fase titulo has less than 3 chars', async () => {
      await expect(
        service.importarPainel('estefania', { fases: [{ titulo: 'AB' }] })
      ).rejects.toThrow()
    })

    it('should throw when tarefa texto is empty', async () => {
      await expect(
        service.importarPainel('estefania', {
          fases: [{ titulo: 'Fase OK', tarefas: [{ texto: '' }] }],
        })
      ).rejects.toThrow()
    })

    it('should throw when material tipo is invalid', async () => {
      await expect(
        service.importarPainel('estefania', {
          fases: [
            {
              titulo: 'Fase OK',
              materiais: [{ nome: 'Doc', tipo: 'INVALIDO' as 'PDF', url: 'http://x.com' }],
            },
          ],
        })
      ).rejects.toThrow()
    })
  })
})
