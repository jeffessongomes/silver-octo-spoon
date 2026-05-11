import { useState, useCallback } from 'react'
import { api } from '../../../lib/api'
import type { TarefaAPI, CriarTarefaInput, EditarTarefaInput, ToggleTarefaResponse } from '../types'

interface UseTarefasAPIResult {
  toggling: Set<string>
  toggleError: string | null
  deleting: Set<string>
  editing: Set<string>
  addingTarefaFaseId: string | null
  addTarefaError: string | null
  toggleConcluida: (tarefaId: string, concluida: boolean, onSuccess: () => void) => Promise<void>
  deletarTarefa: (tarefaId: string, onSuccess: () => void, onError: () => void) => Promise<void>
  editarTarefa: (tarefaId: string, input: EditarTarefaInput, onSuccess: (tarefa: TarefaAPI) => void) => Promise<void>
  criarTarefa: (faseId: string, input: CriarTarefaInput, onSuccess: () => void) => Promise<void>
}

type SetSetter = (updater: (prev: Set<string>) => Set<string>) => void

const addToSet = (setter: SetSetter, id: string) =>
  setter((prev) => new Set([...prev, id]))

const removeFromSet = (setter: SetSetter, id: string) =>
  setter((prev) => { const s = new Set(prev); s.delete(id); return s })

export function useTarefasAPI(clienteId: string): UseTarefasAPIResult {
  const [toggling, setToggling] = useState<Set<string>>(new Set())
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<Set<string>>(new Set())
  const [addingTarefaFaseId, setAddingTarefaFaseId] = useState<string | null>(null)
  const [addTarefaError, setAddTarefaError] = useState<string | null>(null)

  const toggleConcluida = useCallback(
    async (tarefaId: string, concluida: boolean, onSuccess: () => void) => {
      setToggling((prev) => new Set([...prev, tarefaId]))
      setToggleError(null)
      try {
        await api.patch<ToggleTarefaResponse>(
          `/api/clientes/${clienteId}/tarefas/${tarefaId}`,
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

  const deletarTarefa = useCallback(
    async (tarefaId: string, onSuccess: () => void, onError: () => void) => {
      addToSet(setDeleting, tarefaId)
      try {
        await api.delete(`/api/clientes/${clienteId}/tarefas/${tarefaId}`, {
          headers: { 'X-Client-ID': clienteId },
        })
        onSuccess()
      } catch (err) {
        const status = (err as { response?: { status?: number } }).response?.status
        if (status === 404) {
          onSuccess()
        } else {
          onError()
        }
      } finally {
        removeFromSet(setDeleting, tarefaId)
      }
    },
    [clienteId],
  )

  const editarTarefa = useCallback(
    async (tarefaId: string, input: EditarTarefaInput, onSuccess: (tarefa: TarefaAPI) => void) => {
      addToSet(setEditing, tarefaId)
      try {
        const { data } = await api.patch<{ tarefa: TarefaAPI }>(
          `/api/clientes/${clienteId}/tarefas/${tarefaId}`,
          input,
          { headers: { 'X-Client-ID': clienteId } },
        )
        onSuccess(data.tarefa)
      } catch {
        // erro silenciado — o componente gerencia o rollback
      } finally {
        removeFromSet(setEditing, tarefaId)
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

  return { toggling, toggleError, deleting, editing, addingTarefaFaseId, addTarefaError, toggleConcluida, deletarTarefa, editarTarefa, criarTarefa }
}
