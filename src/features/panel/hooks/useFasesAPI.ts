import { useState, useEffect, useCallback } from 'react'
import { api } from '../../../lib/api'
import type { FaseAPI, CriarFaseInput, EditarFaseInput } from '../types'

interface PainelAPIResponse {
  cliente: string
  fases: FaseAPI[]
  biblioteca: unknown[]
}

type SetSetter = (updater: (prev: Set<string>) => Set<string>) => void

const addToSet = (setter: SetSetter, id: string) =>
  setter((prev) => new Set([...prev, id]))

const removeFromSet = (setter: SetSetter, id: string) =>
  setter((prev) => { const s = new Set(prev); s.delete(id); return s })

interface UseFasesAPIResult {
  fases: FaseAPI[]
  loading: boolean
  error: string | null
  submitting: boolean
  submitError: string | null
  deletingFase: Set<string>
  editingFase: Set<string>
  fetchFases: () => void
  setFases: (updater: FaseAPI[] | ((prev: FaseAPI[]) => FaseAPI[])) => void
  criarFase: (input: CriarFaseInput) => Promise<void>
  deletarFase: (faseId: string, onSuccess: () => void) => Promise<void>
  editarFase: (faseId: string, input: EditarFaseInput, onSuccess: (fase: FaseAPI) => void) => Promise<void>
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
  const [deletingFase, setDeletingFase] = useState<Set<string>>(new Set())
  const [editingFase, setEditingFase] = useState<Set<string>>(new Set())
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

  const deletarFase = useCallback(
    async (faseId: string, onSuccess: () => void) => {
      addToSet(setDeletingFase, faseId)
      try {
        await api.delete(`/api/clientes/${clienteId}/fases/${faseId}`, {
          headers: { 'X-Client-ID': clienteId },
        })
        onSuccess()
      } catch (err) {
        const status = (err as { response?: { status?: number } }).response?.status
        if (status === 404) {
          onSuccess()
        }
      } finally {
        removeFromSet(setDeletingFase, faseId)
      }
    },
    [clienteId],
  )

  const editarFase = useCallback(
    async (faseId: string, input: EditarFaseInput, onSuccess: (fase: FaseAPI) => void) => {
      addToSet(setEditingFase, faseId)
      try {
        const { data } = await api.patch<FaseAPI>(
          `/api/clientes/${clienteId}/fases/${faseId}`,
          input,
          { headers: { 'X-Client-ID': clienteId } },
        )
        onSuccess(data)
      } catch {
        // erro silenciado — o componente gerencia o rollback
      } finally {
        removeFromSet(setEditingFase, faseId)
      }
    },
    [clienteId],
  )

  return { fases, loading, error, submitting, submitError, deletingFase, editingFase, fetchFases, setFases, criarFase, deletarFase, editarFase }
}
