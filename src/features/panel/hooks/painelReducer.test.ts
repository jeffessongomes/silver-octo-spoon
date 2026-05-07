import { describe, it, expect } from 'vitest'
import { painelReducer, estadoInicialVazio } from './painelReducer'
import type { EstadoPainel } from '../types'

const createEstado = (overrides: Partial<EstadoPainel> = {}): EstadoPainel => ({
  ...estadoInicialVazio,
  ...overrides,
})

describe('painelReducer', () => {
  describe('TOGGLE_TAREFA', () => {
    it('should mark a previously unmarked task as done', () => {
      const next = painelReducer(createEstado(), { type: 'TOGGLE_TAREFA', tarefaId: 't1-1' })

      expect(next.tarefas['t1-1']).toBe(true)
    })

    it('should unmark a previously done task', () => {
      const initial = createEstado({ tarefas: { 't1-1': true } })

      const next = painelReducer(initial, { type: 'TOGGLE_TAREFA', tarefaId: 't1-1' })

      expect(next.tarefas['t1-1']).toBe(false)
    })

    it('should return a new state object (immutability)', () => {
      const initial = createEstado()

      const next = painelReducer(initial, { type: 'TOGGLE_TAREFA', tarefaId: 't1-1' })

      expect(next).not.toBe(initial)
      expect(next.tarefas).not.toBe(initial.tarefas)
    })
  })

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

  describe('SET_OBSERVACAO', () => {
    it('should set the observation text', () => {
      const next = painelReducer(createEstado(), {
        type: 'SET_OBSERVACAO',
        tarefaId: 't1-1',
        valor: 'Conversei com a Juliana hoje',
      })

      expect(next.observacoes['t1-1']).toBe('Conversei com a Juliana hoje')
    })

    it('should overwrite existing observation', () => {
      const initial = createEstado({ observacoes: { 't1-1': 'antigo' } })

      const next = painelReducer(initial, {
        type: 'SET_OBSERVACAO',
        tarefaId: 't1-1',
        valor: 'novo',
      })

      expect(next.observacoes['t1-1']).toBe('novo')
    })
  })

  describe('HYDRATE', () => {
    it('should replace state entirely', () => {
      const initial = createEstado({ tarefas: { 'old-id': true } })

      const next = painelReducer(initial, {
        type: 'HYDRATE',
        estado: createEstado({ tarefas: { 'new-id': true }, expandidas: ['fase-1'] }),
      })

      expect(next.tarefas).toEqual({ 'new-id': true })
      expect(next.expandidas).toEqual(['fase-1'])
    })
  })
})
