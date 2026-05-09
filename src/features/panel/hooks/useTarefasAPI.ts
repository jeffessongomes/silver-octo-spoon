import { useState, useCallback } from 'react'
import { api } from '../../../lib/api'
import type { TarefaAPI, CriarTarefaInput, ToggleTarefaResponse } from '../types'

interface UseTarefasAPIResult {
  toggling: Set<string>
  toggleError: string | null
  addingTarefaFaseId: string | null
  addTarefaError: string | null
  toggleConcluida: (tarefaId: string, concluida: boolean, onSuccess: () => void) => Promise<void>
  criarTarefa: (faseId: string, input: CriarTarefaInput, onSuccess: () => void) => Promise<void>
}

export function useTarefasAPI(clienteId: string): UseTarefasAPIResult {
  const [toggling, setToggling] = useState<Set<string>>(new Set())
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [addingTarefaFaseId, setAddingTarefaFaseId] = useState<string | null>(null)
  const [addTarefaError, setAddTarefaError] = useState<string | null>(null)

  const toggleConcluida = useCallback(
    async (tarefaId: string, concluida: boolean, onSuccess: () => void) => {
      setToggling((prev) => new Set([...prev, tarefaId]))
      setToggleError(null)
      try {
        await api.patch<ToggleTarefaResponse>(
          `/api/clientes/${clienteId}/tarefas/${tarefaId}/concluida`,
          { concluida },
          { headers: { 'X-Client-ID': clienteId } },
        )
        onSuccess()
      } catch {
        setToggleError('Erro ao atualizar tarefa')
      } finally {
        setToggling((prev) => {
          const next = new Set(prev)
          next.delete(tarefaId)
          return next
        })
      }
    },
    [clienteId],
  )

  const criarTarefa = useCallback(
    async (faseId: string, input: CriarTarefaInput, onSuccess: () => void) => {
      setAddingTarefaFaseId(faseId)
      setAddTarefaError(null)
      try {
        await api.post<TarefaAPI>(
          `/api/clientes/${clienteId}/fases/${faseId}/tarefas`,
          input,
          { headers: { 'X-Client-ID': clienteId } },
        )
        onSuccess()
      } catch {
        setAddTarefaError('Erro ao adicionar tarefa')
      } finally {
        setAddingTarefaFaseId(null)
      }
    },
    [clienteId],
  )

  return { toggling, toggleError, addingTarefaFaseId, addTarefaError, toggleConcluida, criarTarefa }
}
