import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useImportarPainelAPI } from './useImportarPainelAPI'

const { mockApiPost } = vi.hoisted(() => ({
  mockApiPost: vi.fn(),
}))

vi.mock('../../../lib/api', () => ({
  api: { post: mockApiPost },
}))

describe('useImportarPainelAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should start with submitting false and no error', () => {
      const { result } = renderHook(() => useImportarPainelAPI('estefania'))
      expect(result.current.submitting).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('when import succeeds', () => {
    it('should call the correct endpoint and clear error', async () => {
      mockApiPost.mockResolvedValueOnce({
        data: { importado: 2, fases: [{ id: 'f1', titulo: 'Briefing' }] },
      })

      const onSuccess = vi.fn()
      const { result } = renderHook(() => useImportarPainelAPI('estefania'))

      await act(async () => {
        await result.current.importar({ fases: [{ titulo: 'Briefing' }] }, onSuccess)
      })

      expect(mockApiPost).toHaveBeenCalledWith(
        '/api/clientes/estefania/painel/importar',
        { fases: [{ titulo: 'Briefing' }] },
        { headers: { 'X-Client-ID': 'estefania' } }
      )
      expect(onSuccess).toHaveBeenCalledOnce()
      expect(result.current.error).toBeNull()
    })

    it('should set submitting to true during request and false after', async () => {
      let resolveRequest!: (value: unknown) => void
      mockApiPost.mockReturnValueOnce(
        new Promise((resolve) => { resolveRequest = resolve })
      )

      const { result } = renderHook(() => useImportarPainelAPI('estefania'))

      act(() => {
        void result.current.importar({ fases: [{ titulo: 'Fase A' }] }, vi.fn())
      })

      await waitFor(() => expect(result.current.submitting).toBe(true))

      await act(async () => {
        resolveRequest({ data: { importado: 1, fases: [] } })
      })

      await waitFor(() => expect(result.current.submitting).toBe(false))
    })
  })

  describe('when import fails with network error', () => {
    it('should set error message and not call onSuccess', async () => {
      mockApiPost.mockRejectedValueOnce(new Error('Network error'))

      const onSuccess = vi.fn()
      const { result } = renderHook(() => useImportarPainelAPI('estefania'))

      await act(async () => {
        await result.current.importar({ fases: [{ titulo: 'Fase A' }] }, onSuccess)
      })

      expect(result.current.error).not.toBeNull()
      expect(onSuccess).not.toHaveBeenCalled()
      expect(result.current.submitting).toBe(false)
    })
  })

  describe('when import fails with 400 from backend', () => {
    it('should set error from backend response', async () => {
      const axiosError = {
        response: { data: { error: 'Payload invalido', detalhes: ['Fase 1: titulo obrigatorio'] } },
      }
      mockApiPost.mockRejectedValueOnce(axiosError)

      const { result } = renderHook(() => useImportarPainelAPI('estefania'))

      await act(async () => {
        await result.current.importar({ fases: [] }, vi.fn())
      })

      expect(result.current.error).toContain('Payload invalido')
    })
  })
})
