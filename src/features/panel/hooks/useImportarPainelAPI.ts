import { useState, useCallback } from 'react'
import { api } from '../../../lib/api'
import type { ImportarPainelInput, ImportarPainelResponse } from '../types'

interface UseImportarPainelAPIReturn {
  importar: (payload: ImportarPainelInput, onSuccess: () => void) => Promise<void>
  submitting: boolean
  error: string | null
}

export function useImportarPainelAPI(clienteId: string): UseImportarPainelAPIReturn {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const importar = useCallback(
    async (payload: ImportarPainelInput, onSuccess: () => void) => {
      setSubmitting(true)
      setError(null)
      try {
        await api.post<ImportarPainelResponse>(
          `/api/clientes/${clienteId}/painel/importar`,
          payload,
          { headers: { 'X-Client-ID': clienteId } }
        )
        onSuccess()
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string } } }
        const msg = axiosErr?.response?.data?.error ?? 'Erro ao importar painel'
        setError(msg)
      } finally {
        setSubmitting(false)
      }
    },
    [clienteId]
  )

  return { importar, submitting, error }
}
