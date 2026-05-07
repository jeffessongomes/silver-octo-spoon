import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { MaterialAPI } from '../types'

const { mockApiGet, mockApiPost, mockApiDelete } = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockApiPost: vi.fn(),
  mockApiDelete: vi.fn(),
}))

vi.mock('../../../lib/api', () => ({
  api: {
    get: mockApiGet,
    post: mockApiPost,
    delete: mockApiDelete,
  },
}))

const createMaterialAPI = (overrides?: Partial<MaterialAPI>): MaterialAPI => ({
  id: 'mat-001',
  nome: 'Guia de Fonética',
  tipo: 'PDF',
  url: 'https://exemplo.com/fonetica.pdf',
  cliente_id: 'estefania',
  fase_id: null,
  ordem: 0,
  ...overrides,
})

describe('useBiblioteca', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Importação lazy para garantir que o mock está ativo
  const getHook = async () => {
    const { useBiblioteca } = await import('./useBiblioteca')
    return useBiblioteca
  }

  describe('listagem (GET)', () => {
    it('should start with loading true and empty list', async () => {
      mockApiGet.mockResolvedValue({ data: [] })
      const useBiblioteca = await getHook()

      const { result } = renderHook(() => useBiblioteca('estefania'))

      expect(result.current.loading).toBe(true)
      expect(result.current.materiais).toEqual([])
    })

    it('should populate materiais after successful GET', async () => {
      const materiais = [createMaterialAPI(), createMaterialAPI({ id: 'mat-002', nome: 'Planilha de Modelo' })]
      mockApiGet.mockResolvedValue({ data: materiais })
      const useBiblioteca = await getHook()

      const { result } = renderHook(() => useBiblioteca('estefania'))

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.materiais).toEqual(materiais)
      expect(result.current.error).toBeNull()
    })

    it('should set error when GET fails', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'))
      const useBiblioteca = await getHook()

      const { result } = renderHook(() => useBiblioteca('estefania'))

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.error).toBe('Erro ao carregar materiais')
      expect(result.current.materiais).toEqual([])
    })

    it('should refetch when fetchBiblioteca is called', async () => {
      const primeiraLista = [createMaterialAPI()]
      const segundaLista = [createMaterialAPI(), createMaterialAPI({ id: 'mat-002', nome: 'Novo' })]
      mockApiGet.mockResolvedValueOnce({ data: primeiraLista }).mockResolvedValueOnce({ data: segundaLista })
      const useBiblioteca = await getHook()

      const { result } = renderHook(() => useBiblioteca('estefania'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.materiais).toHaveLength(1)

      act(() => { result.current.fetchBiblioteca() })
      await waitFor(() => expect(result.current.materiais).toHaveLength(2))
    })

    it('should clear error on successful retry', async () => {
      mockApiGet
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: [createMaterialAPI()] })
      const useBiblioteca = await getHook()

      const { result } = renderHook(() => useBiblioteca('estefania'))
      await waitFor(() => expect(result.current.error).toBe('Erro ao carregar materiais'))

      act(() => { result.current.fetchBiblioteca() })
      await waitFor(() => expect(result.current.error).toBeNull())
      expect(result.current.materiais).toHaveLength(1)
    })
  })

  describe('criacao (POST)', () => {
    it('should add new material to list after successful POST', async () => {
      const materialExistente = createMaterialAPI()
      const materialNovo = createMaterialAPI({ id: 'mat-002', nome: 'Planilha de Modelo', tipo: 'XLS' })
      mockApiGet.mockResolvedValue({ data: [materialExistente] })
      mockApiPost.mockResolvedValue({ data: materialNovo })
      const useBiblioteca = await getHook()

      const { result } = renderHook(() => useBiblioteca('estefania'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.criarMaterial({ nome: 'Planilha de Modelo', tipo: 'XLS', url: 'https://exemplo.com/planilha.xlsx' })
      })

      expect(result.current.materiais).toHaveLength(2)
      expect(result.current.materiais[1].id).toBe('mat-002')
      expect(result.current.submitError).toBeNull()
    })

    it('should set submitting true during POST', async () => {
      mockApiGet.mockResolvedValue({ data: [] })
      let resolvePost!: (value: unknown) => void
      mockApiPost.mockReturnValue(new Promise((r) => { resolvePost = r }))
      const useBiblioteca = await getHook()

      const { result } = renderHook(() => useBiblioteca('estefania'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        void result.current.criarMaterial({ nome: 'Teste', tipo: 'PDF', url: 'https://exemplo.com' })
      })

      expect(result.current.submitting).toBe(true)

      await act(async () => {
        resolvePost({ data: createMaterialAPI() })
      })

      expect(result.current.submitting).toBe(false)
    })

    it('should set submitError when POST fails', async () => {
      mockApiGet.mockResolvedValue({ data: [] })
      mockApiPost.mockRejectedValue(new Error('Server error'))
      const useBiblioteca = await getHook()

      const { result } = renderHook(() => useBiblioteca('estefania'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.criarMaterial({ nome: 'Teste', tipo: 'PDF', url: 'https://exemplo.com' })
      })

      expect(result.current.submitError).toBe('Erro ao salvar material')
      expect(result.current.submitting).toBe(false)
    })
  })

  describe('delecao (DELETE)', () => {
    it('should remove material from list after successful DELETE', async () => {
      const mat1 = createMaterialAPI({ id: 'mat-001' })
      const mat2 = createMaterialAPI({ id: 'mat-002', nome: 'Segundo' })
      mockApiGet.mockResolvedValue({ data: [mat1, mat2] })
      mockApiDelete.mockResolvedValue({})
      const useBiblioteca = await getHook()

      const { result } = renderHook(() => useBiblioteca('estefania'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.deletarMaterial('mat-001')
      })

      expect(result.current.materiais).toHaveLength(1)
      expect(result.current.materiais[0].id).toBe('mat-002')
    })

    it('should set error when DELETE fails', async () => {
      const mat1 = createMaterialAPI()
      mockApiGet.mockResolvedValue({ data: [mat1] })
      mockApiDelete.mockRejectedValue(new Error('Server error'))
      const useBiblioteca = await getHook()

      const { result } = renderHook(() => useBiblioteca('estefania'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.deletarMaterial('mat-001')
      })

      expect(result.current.error).toBe('Erro ao remover material')
      expect(result.current.materiais).toHaveLength(1)
    })
  })
})
