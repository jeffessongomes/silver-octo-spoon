import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { calcularStatusVisual, usePainelStats } from './usePainelStats'
import type { Fase } from '../types'

const createFase = (id: string, taskCount: number): Fase => ({
  id,
  numero: `Fase ${id}`,
  titulo: `Fase ${id}`,
  resumo: '',
  status: 'pending',
  tarefas: Array.from({ length: taskCount }, (_, i) => ({
    id: `${id}-t${i + 1}`,
    texto: `tarefa ${i + 1}`,
  })),
  materiais: [],
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
    const fases = [createFase('fase-1', 3), createFase('fase-2', 2)]
    const concluidas = { 'fase-1-t1': true, 'fase-1-t2': true, 'fase-2-t1': true }

    const { result } = renderHook(() => usePainelStats(fases, concluidas))

    expect(result.current.totalConcluidas).toBe(3)
    expect(result.current.totalTarefas).toBe(5)
    expect(result.current.percentual).toBe(60)
  })

  it('should compute per-fase stats', () => {
    const fases = [createFase('fase-1', 3)]
    const concluidas = { 'fase-1-t1': true, 'fase-1-t2': true, 'fase-1-t3': true }

    const { result } = renderHook(() => usePainelStats(fases, concluidas))

    expect(result.current.porFase['fase-1']).toEqual({
      concluidas: 3,
      total: 3,
      statusVisual: 'done',
    })
  })

  it('should return zero percentual when there are no tasks', () => {
    const { result } = renderHook(() => usePainelStats([], {}))

    expect(result.current.percentual).toBe(0)
  })
})
