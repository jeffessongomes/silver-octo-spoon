import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useObservacaoAPI } from './useObservacaoAPI'
import { api } from '../../../lib/api'

vi.mock('../../../lib/api', () => ({
  api: {
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockApiPut = vi.mocked(api.put)
const mockApiDelete = vi.mocked(api.delete)

const CLIENT_ID = 'cliente-estefania'
const TAREFA_ID = 't-fase-1-001'

describe('useObservacaoAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiPut.mockResolvedValue({ data: {} })
    mockApiDelete.mockResolvedValue({ data: {} })
  })

  describe('saveObservacao', () => {
    it('should call PUT with conteudo when text is non-empty', async () => {
      const { result } = renderHook(() => useObservacaoAPI(CLIENT_ID))

      await act(async () => {
        await result.current.saveObservacao(TAREFA_ID, 'Juliana confirmou para quinta-feira')
      })

      expect(mockApiPut).toHaveBeenCalledWith(
        `/api/clientes/${CLIENT_ID}/tarefas/${TAREFA_ID}/observacao`,
        { conteudo: 'Juliana confirmou para quinta-feira' },
        { headers: { 'X-Client-ID': CLIENT_ID } },
      )
    })

    it('should call DELETE when text is empty after trim', async () => {
      const { result } = renderHook(() => useObservacaoAPI(CLIENT_ID))

      await act(async () => {
        await result.current.saveObservacao(TAREFA_ID, '   ')
      })

      expect(mockApiDelete).toHaveBeenCalledWith(
        `/api/clientes/${CLIENT_ID}/tarefas/${TAREFA_ID}/observacao`,
        { headers: { 'X-Client-ID': CLIENT_ID } },
      )
      expect(mockApiPut).not.toHaveBeenCalled()
    })

    it('should remove tarefaId from saving set after request completes', async () => {
      const { result } = renderHook(() => useObservacaoAPI(CLIENT_ID))

      await act(async () => {
        await result.current.saveObservacao(TAREFA_ID, 'texto qualquer')
      })

      expect(result.current.saving.has(TAREFA_ID)).toBe(false)
    })

    it('should remove tarefaId from saving set even when API throws', async () => {
      mockApiPut.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useObservacaoAPI(CLIENT_ID))

      await act(async () => {
        await result.current.saveObservacao(TAREFA_ID, 'texto qualquer')
      })

      expect(result.current.saving.has(TAREFA_ID)).toBe(false)
    })

    it('should handle multiple concurrent saves independently', async () => {
      const { result } = renderHook(() => useObservacaoAPI(CLIENT_ID))
      const TAREFA_ID_2 = 't-fase-1-002'

      await act(async () => {
        await Promise.all([
          result.current.saveObservacao(TAREFA_ID, 'obs tarefa 1'),
          result.current.saveObservacao(TAREFA_ID_2, 'obs tarefa 2'),
        ])
      })

      expect(mockApiPut).toHaveBeenCalledTimes(2)
      expect(result.current.saving.has(TAREFA_ID)).toBe(false)
      expect(result.current.saving.has(TAREFA_ID_2)).toBe(false)
    })
  })
})
