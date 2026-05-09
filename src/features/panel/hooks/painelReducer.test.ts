import { describe, it, expect } from 'vitest'
import { painelReducer, estadoInicialVazio } from './painelReducer'
import type { EstadoPainel } from '../types'

const createEstado = (overrides: Partial<EstadoPainel> = {}): EstadoPainel => ({
  ...estadoInicialVazio,
  ...overrides,
})

describe('painelReducer', () => {
  describe('TOGGLE_FASE', () => {
    it('should add fase id when not present', () => {
      const next = painelReducer(createEstado(), { type: 'TOGGLE_FASE', faseId: 'fase-1' })

      expect(next.expandidas).toEqual(['fase-1'])
    })

    it('should remove fase id when already present', () => {
      const initial = createEstado({ expandidas: ['fase-1', 'fase-2'] })

      const next = painelReducer(initial, { type: 'TOGGLE_FASE', faseId: 'fase-1' })

      expect(next.expandidas).toEqual(['fase-2'])
    })

    it('should return a new state object (immutability)', () => {
      const initial = createEstado()

      const next = painelReducer(initial, { type: 'TOGGLE_FASE', faseId: 'fase-1' })

      expect(next).not.toBe(initial)
      expect(next.expandidas).not.toBe(initial.expandidas)
    })
  })

  describe('TOGGLE_OBS', () => {
    it('should add tarefa id when not present', () => {
      const next = painelReducer(createEstado(), { type: 'TOGGLE_OBS', tarefaId: 't1-1' })

      expect(next.obsAbertas).toEqual(['t1-1'])
    })

    it('should remove tarefa id when already present', () => {
      const initial = createEstado({ obsAbertas: ['t1-1'] })

      const next = painelReducer(initial, { type: 'TOGGLE_OBS', tarefaId: 't1-1' })

      expect(next.obsAbertas).toEqual([])
    })
  })

  describe('HYDRATE', () => {
    it('should replace state entirely', () => {
      const initial = createEstado({ expandidas: ['fase-1'] })

      const next = painelReducer(initial, {
        type: 'HYDRATE',
        estado: createEstado({ expandidas: ['fase-2'], obsAbertas: ['t1-1'] }),
      })

      expect(next.expandidas).toEqual(['fase-2'])
      expect(next.obsAbertas).toEqual(['t1-1'])
    })
  })
})
