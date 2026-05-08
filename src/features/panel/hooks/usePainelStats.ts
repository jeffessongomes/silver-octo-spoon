import { useMemo } from 'react'
import type { FaseAPI, FaseStatus } from '../types'

export interface FaseStats {
  concluidas: number
  total: number
  statusVisual: FaseStatus
}

export interface PainelStats {
  totalConcluidas: number
  totalTarefas: number
  percentual: number
  porFase: Record<string, FaseStats>
}

export const calcularStatusVisual = (concluidas: number, total: number): FaseStatus => {
  if (total > 0 && concluidas === total) return 'done'
  if (concluidas > 0) return 'active'
  return 'pending'
}

export const usePainelStats = (fases: FaseAPI[]): PainelStats => {
  return useMemo(() => {
    const porFase: Record<string, FaseStats> = {}
    let totalConcluidas = 0
    let totalTarefas = 0

    for (const fase of fases) {
      const tarefas = fase.tarefas ?? []
      const concluidas = tarefas.filter((t) => t.concluida).length
      const total = tarefas.length
      porFase[fase.id] = {
        concluidas,
        total,
        statusVisual: calcularStatusVisual(concluidas, total),
      }
      totalConcluidas += concluidas
      totalTarefas += total
    }

    const percentual = totalTarefas > 0 ? (totalConcluidas / totalTarefas) * 100 : 0

    return { totalConcluidas, totalTarefas, percentual, porFase }
  }, [fases])
}
