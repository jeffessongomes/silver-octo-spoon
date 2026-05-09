import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePainelState } from './usePainelState'
import { buildPainelStorageKey } from '../../../constants/storage-keys'
import { FASE_INICIAL_EXPANDIDA } from '../data'
import type { EstadoPainel } from '../types'

const CLIENTE = 'estefania'
const STORAGE_KEY = buildPainelStorageKey(CLIENTE)

const readStorage = (): EstadoPainel => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')

describe('usePainelState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('hydration on first access', () => {
    it('should expand fase-1 by default when storage is empty', () => {
      const { result } = renderHook(() => usePainelState(CLIENTE))

      expect(result.current.estado.expandidas).toContain(FASE_INICIAL_EXPANDIDA)
    })

    it('should restore persisted expandidas from storage', () => {
      const persisted: EstadoPainel = {
        expandidas: ['fase-2'],
        obsAbertas: [],
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))

      const { result } = renderHook(() => usePainelState(CLIENTE))

      expect(result.current.estado.expandidas).toContain('fase-2')
    })

    it('should restore persisted obsAbertas from storage', () => {
      const persisted: EstadoPainel = {
        expandidas: ['fase-1'],
        obsAbertas: ['t1-1', 't1-2'],
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))

      const { result } = renderHook(() => usePainelState(CLIENTE))

      expect(result.current.estado.obsAbertas).toEqual(['t1-1', 't1-2'])
    })
  })

  describe('persistence', () => {
    it('should persist expandidas on TOGGLE_FASE', () => {
      const { result } = renderHook(() => usePainelState(CLIENTE))

      act(() => {
        result.current.dispatch({ type: 'TOGGLE_FASE', faseId: 'fase-3' })
      })

      expect(readStorage().expandidas).toContain('fase-3')
    })

    it('should persist obsAbertas on TOGGLE_OBS', () => {
      const { result } = renderHook(() => usePainelState(CLIENTE))

      act(() => {
        result.current.dispatch({ type: 'TOGGLE_OBS', tarefaId: 't1-4' })
      })

      expect(readStorage().obsAbertas).toContain('t1-4')
    })
  })
})
