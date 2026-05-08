import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { FaseAPI, TarefaAPI } from '../types'

const { mockApiGet, mockApiPost } = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockApiPost: vi.fn(),
}))

vi.mock('../../../lib/api', () => ({
  api: {
    get: mockApiGet,
    post: mockApiPost,
  },
}))

const createTarefaAPI = (overrides?: Partial<TarefaAPI>): TarefaAPI => ({
  id: 'tarefa-001',
  texto: 'Combinar com a Juliana sobre o relatório',
  fase_id: 'fase-1',
  cliente_id: 'estefania',
  concluida: false,
  ordem: 0,
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
  cliente_id: 'estefania',
  ordem: 0,
  ...overrides,
})

describe('useFasesAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const getHook = async () => {
    const { useFasesAPI } = await import('./useFasesAPI')
    return useFasesAPI
  }

  describe('listagem (GET)', () => {
    it('should start with loading true and empty fases list', async () => {
      mockApiGet.mockResolvedValue({ data: [] })
      const useFasesAPI = await getHook()

      const { result } = renderHook(() => useFasesAPI('estefania'))

      expect(result.current.loading).toBe(true)
      expect(result.current.fases).toEqual([])
    })

    it('should populate fases after successful GET', async () => {
      const fases = [createFaseAPI(), createFaseAPI({ id: 'fase-2', titulo: 'Ativar Indicação' })]
      mockApiGet.mockResolvedValue({ data: fases })
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
        .mockResolvedValueOnce({ data: primeiraLista })
        .mockResolvedValueOnce({ data: segundaLista })
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
        .mockResolvedValueOnce({ data: [createFaseAPI()] })
      const useFasesAPI = await getHook()

      const { result } = renderHook(() => useFasesAPI('estefania'))
      await waitFor(() => expect(result.current.error).toBe('Erro ao carregar fases'))

      act(() => { result.current.fetchFases() })
      await waitFor(() => expect(result.current.error).toBeNull())
      expect(result.current.fases).toHaveLength(1)
    })
  })

  describe('criacao de fase (POST)', () => {
    it('should add new fase to list after successful POST', async () => {
      const faseExistente = createFaseAPI()
      const faseNova = createFaseAPI({ id: 'fase-2', titulo: 'Ativar Indicação' })
      mockApiGet.mockResolvedValue({ data: [faseExistente] })
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
      mockApiGet.mockResolvedValue({ data: [] })
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
      mockApiGet.mockResolvedValue({ data: [] })
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
