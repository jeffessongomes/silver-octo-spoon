import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { FaseAPI, TarefaAPI } from '../types'

const { mockApiGet, mockApiPost, mockApiPatch, mockApiDelete } = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockApiPost: vi.fn(),
  mockApiPatch: vi.fn(),
  mockApiDelete: vi.fn(),
}))

vi.mock('../../../lib/api', () => ({
  api: {
    get: mockApiGet,
    post: mockApiPost,
    patch: mockApiPatch,
    delete: mockApiDelete,
  },
}))

const createTarefaAPI = (overrides?: Partial<TarefaAPI>): TarefaAPI => ({
  id: 'tarefa-001',
  texto: 'Combinar com a Juliana sobre o relatório',
  concluida: false,
  observacao: null,
  ...overrides,
})

const createFaseAPI = (overrides?: Partial<FaseAPI>): FaseAPI => ({
  id: 'fase-1',
  numero: 'Fase 01',
  titulo: 'Arrumar a Casa',
  resumo: 'Meta de receita: R$2.000/mês',
  status: 'active',
  tarefas: [createTarefaAPI()],
  materiais: [],
  ...overrides,
})

const createPainelResponse = (fases: FaseAPI[]) => ({
  cliente: 'estefania',
  fases,
  biblioteca: [],
})

describe('useFasesAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const getHook = async () => {
    const { useFasesAPI } = await import('./useFasesAPI')
    return useFasesAPI
  }

  describe('listagem (GET /painel)', () => {
    it('should call /painel endpoint, not /fases', async () => {
      mockApiGet.mockResolvedValue({ data: createPainelResponse([]) })
      const useFasesAPI = await getHook()

      renderHook(() => useFasesAPI('estefania'))

      await waitFor(() =>
        expect(mockApiGet).toHaveBeenCalledWith(
          expect.stringContaining('/painel'),
          expect.any(Object),
        ),
      )
    })

    it('should start with loading true and empty fases list', async () => {
      mockApiGet.mockResolvedValue({ data: createPainelResponse([]) })
      const useFasesAPI = await getHook()

      const { result } = renderHook(() => useFasesAPI('estefania'))

      expect(result.current.loading).toBe(true)
      expect(result.current.fases).toEqual([])
    })

    it('should populate fases from data.fases after successful GET', async () => {
      const fases = [createFaseAPI(), createFaseAPI({ id: 'fase-2', titulo: 'Ativar Indicação' })]
      mockApiGet.mockResolvedValue({ data: createPainelResponse(fases) })
      const useFasesAPI = await getHook()

      const { result } = renderHook(() => useFasesAPI('estefania'))

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.fases).toEqual(fases)
      expect(result.current.error).toBeNull()
    })

    it('should set error when GET fails', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'))
      const useFasesAPI = await getHook()

      const { result } = renderHook(() => useFasesAPI('estefania'))

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.error).toBe('Erro ao carregar fases')
      expect(result.current.fases).toEqual([])
    })

    it('should refetch when fetchFases is called', async () => {
      const primeiraLista = [createFaseAPI()]
      const segundaLista = [createFaseAPI(), createFaseAPI({ id: 'fase-2', titulo: 'Ativar Indicação' })]
      mockApiGet
        .mockResolvedValueOnce({ data: createPainelResponse(primeiraLista) })
        .mockResolvedValueOnce({ data: createPainelResponse(segundaLista) })
      const useFasesAPI = await getHook()

      const { result } = renderHook(() => useFasesAPI('estefania'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.fases).toHaveLength(1)

      act(() => { result.current.fetchFases() })
      await waitFor(() => expect(result.current.fases).toHaveLength(2))
    })

    it('should clear error on successful retry', async () => {
      mockApiGet
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: createPainelResponse([createFaseAPI()]) })
      const useFasesAPI = await getHook()

      const { result } = renderHook(() => useFasesAPI('estefania'))
      await waitFor(() => expect(result.current.error).toBe('Erro ao carregar fases'))

      act(() => { result.current.fetchFases() })
      await waitFor(() => expect(result.current.error).toBeNull())
      expect(result.current.fases).toHaveLength(1)
    })
  })

  describe('deletarFase (DELETE)', () => {
    it('should call onSuccess after successful DELETE', async () => {
      mockApiGet.mockResolvedValue({ data: createPainelResponse([]) })
      mockApiDelete.mockResolvedValue({})
      const useFasesAPI = await getHook()
      const onSuccess = vi.fn()

      const { result } = renderHook(() => useFasesAPI('estefania'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.deletarFase('fase-1', onSuccess)
      })

      expect(onSuccess).toHaveBeenCalledOnce()
    })

    it('should call onSuccess when DELETE returns 404 (already deleted)', async () => {
      mockApiGet.mockResolvedValue({ data: createPainelResponse([]) })
      const err = Object.assign(new Error('Not Found'), { response: { status: 404 } })
      mockApiDelete.mockRejectedValue(err)
      const useFasesAPI = await getHook()
      const onSuccess = vi.fn()

      const { result } = renderHook(() => useFasesAPI('estefania'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.deletarFase('fase-1', onSuccess)
      })

      expect(onSuccess).toHaveBeenCalledOnce()
    })

    it('should add faseId to deletingFase Set during DELETE and remove after', async () => {
      mockApiGet.mockResolvedValue({ data: createPainelResponse([]) })
      let resolveDelete!: (value: unknown) => void
      mockApiDelete.mockReturnValue(new Promise((r) => { resolveDelete = r }))
      const useFasesAPI = await getHook()

      const { result } = renderHook(() => useFasesAPI('estefania'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        void result.current.deletarFase('fase-1', vi.fn())
      })

      expect(result.current.deletingFase.has('fase-1')).toBe(true)

      await act(async () => { resolveDelete({}) })

      expect(result.current.deletingFase.has('fase-1')).toBe(false)
    })
  })

  describe('editarFase (PATCH)', () => {
    it('should call onSuccess with updated fase after PATCH', async () => {
      const faseAtualizada = createFaseAPI({ titulo: 'Título Atualizado com Sucesso' })
      mockApiGet.mockResolvedValue({ data: createPainelResponse([]) })
      mockApiPatch.mockResolvedValue({ data: faseAtualizada })
      const useFasesAPI = await getHook()
      const onSuccess = vi.fn<(fase: FaseAPI) => void>()

      const { result } = renderHook(() => useFasesAPI('estefania'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.editarFase('fase-1', { titulo: 'Título Atualizado com Sucesso' }, onSuccess)
      })

      expect(onSuccess).toHaveBeenCalledWith(faseAtualizada)
    })

    it('should add faseId to editingFase Set during PATCH and remove after', async () => {
      mockApiGet.mockResolvedValue({ data: createPainelResponse([]) })
      let resolvePatch!: (value: unknown) => void
      mockApiPatch.mockReturnValue(new Promise((r) => { resolvePatch = r }))
      const useFasesAPI = await getHook()

      const { result } = renderHook(() => useFasesAPI('estefania'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        void result.current.editarFase('fase-1', { titulo: 'Novo título' }, vi.fn())
      })

      await waitFor(() => expect(result.current.editingFase.has('fase-1')).toBe(true))

      await act(async () => {
        resolvePatch({ data: createFaseAPI() })
      })

      expect(result.current.editingFase.has('fase-1')).toBe(false)
    })

    it('should not call onSuccess when PATCH fails', async () => {
      mockApiGet.mockResolvedValue({ data: createPainelResponse([]) })
      mockApiPatch.mockRejectedValue(new Error('Server error'))
      const useFasesAPI = await getHook()
      const onSuccess = vi.fn()

      const { result } = renderHook(() => useFasesAPI('estefania'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.editarFase('fase-1', { titulo: 'Título' }, onSuccess)
      })

      expect(onSuccess).not.toHaveBeenCalled()
      expect(result.current.editingFase.has('fase-1')).toBe(false)
    })
  })

  describe('criacao de fase (POST)', () => {
    it('should add new fase to list after successful POST', async () => {
      const faseExistente = createFaseAPI()
      const faseNova = createFaseAPI({ id: 'fase-2', titulo: 'Ativar Indicação' })
      mockApiGet.mockResolvedValue({ data: createPainelResponse([faseExistente]) })
      mockApiPost.mockResolvedValue({ data: faseNova })
      const useFasesAPI = await getHook()

      const { result } = renderHook(() => useFasesAPI('estefania'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.criarFase({ titulo: 'Ativar Indicação', resumo: 'Meta: 12 alunos' })
      })

      expect(result.current.fases).toHaveLength(2)
      expect(result.current.fases[1].id).toBe('fase-2')
      expect(result.current.submitError).toBeNull()
    })

    it('should set submitting true during POST', async () => {
      mockApiGet.mockResolvedValue({ data: createPainelResponse([]) })
      let resolvePost!: (value: unknown) => void
      mockApiPost.mockReturnValue(new Promise((r) => { resolvePost = r }))
      const useFasesAPI = await getHook()

      const { result } = renderHook(() => useFasesAPI('estefania'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        void result.current.criarFase({ titulo: 'Nova Fase', resumo: 'Resumo da fase' })
      })

      expect(result.current.submitting).toBe(true)

      await act(async () => {
        resolvePost({ data: createFaseAPI({ id: 'fase-nova' }) })
      })

      expect(result.current.submitting).toBe(false)
    })

    it('should set submitError when POST fails', async () => {
      mockApiGet.mockResolvedValue({ data: createPainelResponse([]) })
      mockApiPost.mockRejectedValue(new Error('Server error'))
      const useFasesAPI = await getHook()

      const { result } = renderHook(() => useFasesAPI('estefania'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.criarFase({ titulo: 'Nova Fase', resumo: 'Resumo' })
      })

      expect(result.current.submitError).toBe('Erro ao adicionar fase')
      expect(result.current.submitting).toBe(false)
    })
  })
})
