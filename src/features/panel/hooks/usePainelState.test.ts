import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePainelState } from './usePainelState'
import { buildPainelStorageKey } from '../../../constants/storage-keys'
import { TAREFAS_PRE_CONCLUIDAS, FASE_INICIAL_EXPANDIDA } from '../data'
import type { EstadoPainel } from '../types'

const CLIENTE = 'estefania'
const STORAGE_KEY = buildPainelStorageKey(CLIENTE)

const readStorage = (): EstadoPainel => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')

describe('usePainelState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('hydration on first access', () => {
    it('should mark pre-concluidas tasks as done when storage is empty', () => {
      const { result } = renderHook(() => usePainelState(CLIENTE))

      for (const id of TAREFAS_PRE_CONCLUIDAS) {
        expect(result.current.estado.tarefas[id]).toBe(true)
      }
    })

    it('should expand fase-1 by default when storage is empty', () => {
      const { result } = renderHook(() => usePainelState(CLIENTE))

      expect(result.current.estado.expandidas).toContain(FASE_INICIAL_EXPANDIDA)
    })

    it('should restore persisted state', () => {
      const persisted: EstadoPainel = {
        tarefas: { 't2-1': true },
        observacoes: { 't2-1': 'feito' },
        expandidas: ['fase-2'],
        obsAbertas: [],
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))

      const { result } = renderHook(() => usePainelState(CLIENTE))

      expect(result.current.estado.tarefas['t2-1']).toBe(true)
      expect(result.current.estado.observacoes['t2-1']).toBe('feito')
      expect(result.current.estado.expandidas).toContain('fase-2')
    })

    it('should not override pre-concluidas marked as false in storage', () => {
      const persisted: EstadoPainel = {
        tarefas: { 't0-1': false },
        observacoes: {},
        expandidas: ['fase-1'],
        obsAbertas: [],
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))

      const { result } = renderHook(() => usePainelState(CLIENTE))

      expect(result.current.estado.tarefas['t0-1']).toBe(false)
    })
  })

  describe('persistence', () => {
    it('should persist state on every action', () => {
      const { result } = renderHook(() => usePainelState(CLIENTE))

      act(() => {
        result.current.dispatch({ type: 'TOGGLE_TAREFA', tarefaId: 't1-4' })
      })

      expect(readStorage().tarefas['t1-4']).toBe(true)
    })

    it('should persist observation text', () => {
      const { result } = renderHook(() => usePainelState(CLIENTE))

      act(() => {
        result.current.dispatch({
          type: 'SET_OBSERVACAO',
          tarefaId: 't1-4',
          valor: 'Combinou com a Juliana',
        })
      })

      expect(readStorage().observacoes['t1-4']).toBe('Combinou com a Juliana')
    })
  })
})
