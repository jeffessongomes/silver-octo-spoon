import { useState, useEffect, useCallback } from 'react'
import { api } from '../../../lib/api'
import type { FaseAPI, CriarFaseInput } from '../types'

interface PainelAPIResponse {
  cliente: string
  fases: FaseAPI[]
  biblioteca: unknown[]
}

interface UseFasesAPIResult {
  fases: FaseAPI[]
  loading: boolean
  error: string | null
  submitting: boolean
  submitError: string | null
  fetchFases: () => void
  criarFase: (input: CriarFaseInput) => Promise<void>
}

const normalizarFase = (f: FaseAPI): FaseAPI => ({
  ...f,
  tarefas: f.tarefas ?? [],
  materiais: f.materiais ?? [],
})

export function useFasesAPI(clienteId: string): UseFasesAPIResult {
  const [fases, setFases] = useState<FaseAPI[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fetchTrigger, setFetchTrigger] = useState(0)
  const [lastFetched, setLastFetched] = useState<number | null>(null)

  const loading = lastFetched !== fetchTrigger

  const fetchFases = useCallback(() => {
    setFetchTrigger((t) => t + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    api
      .get<PainelAPIResponse>(`/api/clientes/${clienteId}/painel`, {
        headers: { 'X-Client-ID': clienteId },
      })
      .then(({ data }) => {
        if (!cancelled) {
          setFases(data.fases.map(normalizarFase))
          setError(null)
          setLastFetched(fetchTrigger)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Erro ao carregar fases')
          setLastFetched(fetchTrigger)
        }
      })

    return () => {
      cancelled = true
    }
  }, [clienteId, fetchTrigger])

  const criarFase = useCallback(
    async (input: CriarFaseInput) => {
      setSubmitting(true)
      setSubmitError(null)
      try {
        const { data } = await api.post<FaseAPI>(
          `/api/clientes/${clienteId}/fases`,
          input,
          { headers: { 'X-Client-ID': clienteId } },
        )
        setFases((prev) => [...prev, normalizarFase(data)])
      } catch {
        setSubmitError('Erro ao adicionar fase')
      } finally {
        setSubmitting(false)
      }
    },
    [clienteId],
  )

  return { fases, loading, error, submitting, submitError, fetchFases, criarFase }
}
