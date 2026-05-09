import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { calcularStatusVisual, usePainelStats } from './usePainelStats'
import type { FaseAPI, TarefaAPI } from '../types'

const createTarefaAPI = (id: string, concluida = false): TarefaAPI => ({
  id,
  texto: `tarefa ${id}`,
  fase_id: 'fase-1',
  cliente_id: 'estefania',
  concluida,
  ordem: 0,
})

const createFaseAPI = (id: string, tarefas: TarefaAPI[]): FaseAPI => ({
  id,
  numero: `Fase ${id}`,
  titulo: `Fase ${id}`,
  resumo: '',
  status: 'pending',
  tarefas,
  materiais: [],
  cliente_id: 'estefania',
  ordem: 0,
})

describe('calcularStatusVisual', () => {
  it('should return done when all tasks are completed', () => {
    expect(calcularStatusVisual(3, 3)).toBe('done')
  })

  it('should return active when some tasks are completed', () => {
    expect(calcularStatusVisual(1, 3)).toBe('active')
  })

  it('should return pending when no tasks are completed', () => {
    expect(calcularStatusVisual(0, 3)).toBe('pending')
  })

  it('should return pending when fase has no tasks', () => {
    expect(calcularStatusVisual(0, 0)).toBe('pending')
  })
})

describe('usePainelStats', () => {
  it('should compute totals across all fases', () => {
    const fases = [
      createFaseAPI('fase-1', [
        createTarefaAPI('fase-1-t1', true),
        createTarefaAPI('fase-1-t2', true),
        createTarefaAPI('fase-1-t3', false),
      ]),
      createFaseAPI('fase-2', [
        createTarefaAPI('fase-2-t1', true),
        createTarefaAPI('fase-2-t2', false),
      ]),
    ]

    const { result } = renderHook(() => usePainelStats(fases))

    expect(result.current.totalConcluidas).toBe(3)
    expect(result.current.totalTarefas).toBe(5)
    expect(result.current.percentual).toBe(60)
  })

  it('should compute per-fase stats', () => {
    const fases = [
      createFaseAPI('fase-1', [
        createTarefaAPI('t1', true),
        createTarefaAPI('t2', true),
        createTarefaAPI('t3', true),
      ]),
    ]

    const { result } = renderHook(() => usePainelStats(fases))

    expect(result.current.porFase['fase-1']).toEqual({
      concluidas: 3,
      total: 3,
      statusVisual: 'done',
    })
  })

  it('should return zero percentual when there are no fases', () => {
    const { result } = renderHook(() => usePainelStats([]))

    expect(result.current.percentual).toBe(0)
  })

  it('should compute statusVisual as active when some tasks are done', () => {
    const fases = [
      createFaseAPI('fase-1', [
        createTarefaAPI('t1', true),
        createTarefaAPI('t2', false),
      ]),
    ]

    const { result } = renderHook(() => usePainelStats(fases))

    expect(result.current.porFase['fase-1'].statusVisual).toBe('active')
  })
})
