import { useState, useCallback } from 'react'
import { api } from '../../../lib/api'

interface UseObservacaoAPIResult {
  saving: Set<string>
  saveObservacao: (tarefaId: string, conteudo: string) => Promise<void>
}

export function useObservacaoAPI(clienteId: string): UseObservacaoAPIResult {
  const [saving, setSaving] = useState<Set<string>>(new Set())

  const saveObservacao = useCallback(
    async (tarefaId: string, conteudo: string) => {
      setSaving((prev) => new Set([...prev, tarefaId]))
      try {
        const trimmed = conteudo.trim()
        if (trimmed.length === 0) {
          await api.delete(
            `/api/clientes/${clienteId}/tarefas/${tarefaId}/observacao`,
            { headers: { 'X-Client-ID': clienteId } },
          )
        } else {
          await api.put(
            `/api/clientes/${clienteId}/tarefas/${tarefaId}/observacao`,
            { conteudo: trimmed },
            { headers: { 'X-Client-ID': clienteId } },
          )
        }
      } catch {
        // erro silencioso — status de UI gerenciado pelo useDebouncedSave
      } finally {
        setSaving((prev) => {
          const next = new Set(prev)
          next.delete(tarefaId)
          return next
        })
      }
    },
    [clienteId],
  )

  return { saving, saveObservacao }
}
