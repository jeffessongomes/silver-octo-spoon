import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { TarefaAPI, ToggleTarefaResponse } from '../types'

const { mockApiPatch, mockApiPost, mockApiDelete } = vi.hoisted(() => ({
  mockApiPatch: vi.fn(),
  mockApiPost: vi.fn(),
  mockApiDelete: vi.fn(),
}))

vi.mock('../../../lib/api', () => ({
  api: {
    patch: mockApiPatch,
    post: mockApiPost,
    delete: mockApiDelete,
  },
}))

const createToggleResponse = (tarefaId: string, concluida: boolean): ToggleTarefaResponse => ({
  tarefa: { id: tarefaId, concluida },
  fase_status: concluida ? 'done' : 'active',
})

const createTarefaAPI = (overrides?: Partial<TarefaAPI>): TarefaAPI => ({
  id: 'tarefa-001',
  texto: 'Combinar com a Juliana',
  fase_id: 'fase-1',
  cliente_id: 'estefania',
  concluida: false,
  observacao: null,
  ordem: 0,
  ...overrides,
})

describe('useTarefasAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const getHook = async () => {
    const { useTarefasAPI } = await import('./useTarefasAPI')
    return useTarefasAPI
  }

  describe('toggleConcluida (PATCH)', () => {
    it('should start with empty toggling Set and no error', async () => {
      const useTarefasAPI = await getHook()

      const { result } = renderHook(() => useTarefasAPI('estefania'))

      expect(result.current.toggling.size).toBe(0)
      expect(result.current.toggleError).toBeNull()
    })

    it('should add tarefaId to toggling set while PATCH is in progress', async () => {
      let resolvePatch!: (value: unknown) => void
      mockApiPatch.mockReturnValue(new Promise((r) => { resolvePatch = r }))
      const useTarefasAPI = await getHook()
      const onSuccess = vi.fn()

      const { result } = renderHook(() => useTarefasAPI('estefania'))

      act(() => {
        void result.current.toggleConcluida('tarefa-001', true, onSuccess)
      })

      expect(result.current.toggling.has('tarefa-001')).toBe(true)

      await act(async () => {
        resolvePatch({ data: createToggleResponse('tarefa-001', true) })
      })

      expect(result.current.toggling.has('tarefa-001')).toBe(false)
    })

    it('should call onSuccess after successful PATCH', async () => {
      mockApiPatch.mockResolvedValue({ data: createToggleResponse('tarefa-001', true) })
      const useTarefasAPI = await getHook()
      const onSuccess = vi.fn()

      const { result } = renderHook(() => useTarefasAPI('estefania'))

      await act(async () => {
        await result.current.toggleConcluida('tarefa-001', true, onSuccess)
      })

      expect(onSuccess).toHaveBeenCalledOnce()
      expect(result.current.toggleError).toBeNull()
    })

    it('should set toggleError and clear toggling when PATCH fails', async () => {
      mockApiPatch.mockRejectedValue(new Error('Network error'))
      const useTarefasAPI = await getHook()
      const onSuccess = vi.fn()

      const { result } = renderHook(() => useTarefasAPI('estefania'))

      await act(async () => {
        await result.current.toggleConcluida('tarefa-001', true, onSuccess)
      })

      expect(result.current.toggleError).toBe('Erro ao atualizar tarefa')
      expect(result.current.toggling.has('tarefa-001')).toBe(false)
      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('should handle two simultaneous toggles on different tarefas', async () => {
      let resolvePatch1!: (value: unknown) => void
      let resolvePatch2!: (value: unknown) => void
      mockApiPatch
        .mockReturnValueOnce(new Promise((r) => { resolvePatch1 = r }))
        .mockReturnValueOnce(new Promise((r) => { resolvePatch2 = r }))
      const useTarefasAPI = await getHook()

      const { result } = renderHook(() => useTarefasAPI('estefania'))

      act(() => {
        void result.current.toggleConcluida('tarefa-001', true, vi.fn())
        void result.current.toggleConcluida('tarefa-002', true, vi.fn())
      })

      await waitFor(() => {
        expect(result.current.toggling.has('tarefa-001')).toBe(true)
        expect(result.current.toggling.has('tarefa-002')).toBe(true)
      })

      await act(async () => {
        resolvePatch1({ data: createToggleResponse('tarefa-001', true) })
        resolvePatch2({ data: createToggleResponse('tarefa-002', true) })
      })

      expect(result.current.toggling.size).toBe(0)
    })
  })

  describe('deletarTarefa (DELETE)', () => {
    it('should call onSuccess after successful DELETE', async () => {
      mockApiDelete.mockResolvedValue({})
      const useTarefasAPI = await getHook()
      const onSuccess = vi.fn()
      const onError = vi.fn()

      const { result } = renderHook(() => useTarefasAPI('estefania'))

      await act(async () => {
        await result.current.deletarTarefa('tarefa-001', onSuccess, onError)
      })

      expect(onSuccess).toHaveBeenCalledOnce()
      expect(onError).not.toHaveBeenCalled()
    })

    it('should call onSuccess when DELETE returns 404 (already deleted)', async () => {
      const err = Object.assign(new Error('Not Found'), { response: { status: 404 } })
      mockApiDelete.mockRejectedValue(err)
      const useTarefasAPI = await getHook()
      const onSuccess = vi.fn()
      const onError = vi.fn()

      const { result } = renderHook(() => useTarefasAPI('estefania'))

      await act(async () => {
        await result.current.deletarTarefa('tarefa-001', onSuccess, onError)
      })

      expect(onSuccess).toHaveBeenCalledOnce()
      expect(onError).not.toHaveBeenCalled()
    })

    it('should call onError when DELETE fails with non-404 error', async () => {
      const err = Object.assign(new Error('Server error'), { response: { status: 500 } })
      mockApiDelete.mockRejectedValue(err)
      const useTarefasAPI = await getHook()
      const onSuccess = vi.fn()
      const onError = vi.fn()

      const { result } = renderHook(() => useTarefasAPI('estefania'))

      await act(async () => {
        await result.current.deletarTarefa('tarefa-001', onSuccess, onError)
      })

      expect(onError).toHaveBeenCalledOnce()
      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('should add tarefaId to deleting Set during DELETE and remove after', async () => {
      let resolveDelete!: (value: unknown) => void
      mockApiDelete.mockReturnValue(new Promise((r) => { resolveDelete = r }))
      const useTarefasAPI = await getHook()

      const { result } = renderHook(() => useTarefasAPI('estefania'))

      act(() => {
        void result.current.deletarTarefa('tarefa-001', vi.fn(), vi.fn())
      })

      expect(result.current.deleting.has('tarefa-001')).toBe(true)

      await act(async () => { resolveDelete({}) })

      expect(result.current.deleting.has('tarefa-001')).toBe(false)
    })
  })

  describe('editarTarefa (PATCH texto)', () => {
    it('should call onSuccess with updated tarefa after PATCH', async () => {
      const updatedTarefa = createTarefaAPI({ texto: 'Texto atualizado com Juliana' })
      mockApiPatch.mockResolvedValue({ data: { tarefa: updatedTarefa } })
      const useTarefasAPI = await getHook()
      const onSuccess = vi.fn<(tarefa: TarefaAPI) => void>()

      const { result } = renderHook(() => useTarefasAPI('estefania'))

      await act(async () => {
        await result.current.editarTarefa('tarefa-001', { texto: 'Texto atualizado com Juliana' }, onSuccess)
      })

      expect(onSuccess).toHaveBeenCalledWith(updatedTarefa)
    })

    it('should add tarefaId to editing Set during PATCH and remove after', async () => {
      let resolvePatch!: (value: unknown) => void
      mockApiPatch.mockReturnValue(new Promise((r) => { resolvePatch = r }))
      const useTarefasAPI = await getHook()

      const { result } = renderHook(() => useTarefasAPI('estefania'))

      act(() => {
        void result.current.editarTarefa('tarefa-001', { texto: 'Texto' }, vi.fn())
      })

      await waitFor(() => expect(result.current.editing.has('tarefa-001')).toBe(true))

      await act(async () => {
        resolvePatch({ data: { tarefa: createTarefaAPI() } })
      })

      expect(result.current.editing.has('tarefa-001')).toBe(false)
    })

    it('should not call onSuccess when PATCH fails', async () => {
      mockApiPatch.mockRejectedValue(new Error('Server error'))
      const useTarefasAPI = await getHook()
      const onSuccess = vi.fn()

      const { result } = renderHook(() => useTarefasAPI('estefania'))

      await act(async () => {
        await result.current.editarTarefa('tarefa-001', { texto: 'Texto' }, onSuccess)
      })

      expect(onSuccess).not.toHaveBeenCalled()
      expect(result.current.editing.has('tarefa-001')).toBe(false)
    })
  })

  describe('criarTarefa (POST)', () => {
    it('should start with no addingTarefaFaseId and no error', async () => {
      const useTarefasAPI = await getHook()

      const { result } = renderHook(() => useTarefasAPI('estefania'))

      expect(result.current.addingTarefaFaseId).toBeNull()
      expect(result.current.addTarefaError).toBeNull()
    })

    it('should set addingTarefaFaseId during POST and clear after success', async () => {
      let resolvePost!: (value: unknown) => void
      mockApiPost.mockReturnValue(new Promise((r) => { resolvePost = r }))
      const useTarefasAPI = await getHook()
      const onSuccess = vi.fn()

      const { result } = renderHook(() => useTarefasAPI('estefania'))

      act(() => {
        void result.current.criarTarefa('fase-1', { texto: 'Nova tarefa da Juliana' }, onSuccess)
      })

      expect(result.current.addingTarefaFaseId).toBe('fase-1')

      await act(async () => {
        resolvePost({ data: createTarefaAPI({ id: 'tarefa-002', texto: 'Nova tarefa da Juliana' }) })
      })

      expect(result.current.addingTarefaFaseId).toBeNull()
      expect(onSuccess).toHaveBeenCalledOnce()
    })

    it('should set addTarefaError when POST fails', async () => {
      mockApiPost.mockRejectedValue(new Error('Server error'))
      const useTarefasAPI = await getHook()
      const onSuccess = vi.fn()

      const { result } = renderHook(() => useTarefasAPI('estefania'))

      await act(async () => {
        await result.current.criarTarefa('fase-1', { texto: 'Nova tarefa' }, onSuccess)
      })

      expect(result.current.addTarefaError).toBe('Erro ao adicionar tarefa')
      expect(result.current.addingTarefaFaseId).toBeNull()
      expect(onSuccess).not.toHaveBeenCalled()
    })
  })
})
