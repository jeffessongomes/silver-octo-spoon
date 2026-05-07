import { useState, useEffect, useCallback } from 'react'
import { api, getClienteIdFromUrl } from '../../../lib/api'
import type { MaterialAPI, CriarMaterialInput } from '../types'

interface UseBibliotecaResult {
  materiais: MaterialAPI[]
  loading: boolean
  error: string | null
  submitting: boolean
  submitError: string | null
  fetchBiblioteca: () => void
  criarMaterial: (input: CriarMaterialInput) => Promise<void>
  deletarMaterial: (id: string) => Promise<void>
}

export function useBiblioteca(clienteId: string = getClienteIdFromUrl()): UseBibliotecaResult {
  const [materiais, setMateriais] = useState<MaterialAPI[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fetchTrigger, setFetchTrigger] = useState(0)
  const [lastFetched, setLastFetched] = useState<number | null>(null)

  const loading = lastFetched !== fetchTrigger

  const fetchBiblioteca = useCallback(() => {
    setFetchTrigger((t) => t + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    api
      .get<MaterialAPI[]>(`/api/clientes/${clienteId}/biblioteca`, {
        headers: { 'X-Client-ID': clienteId },
      })
      .then(({ data }) => {
        if (!cancelled) {
          setMateriais(data)
          setError(null)
          setLastFetched(fetchTrigger)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Erro ao carregar materiais')
          setLastFetched(fetchTrigger)
        }
      })

    return () => {
      cancelled = true
    }
  }, [clienteId, fetchTrigger])

  const criarMaterial = useCallback(async (input: CriarMaterialInput) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const { data } = await api.post<MaterialAPI>(
        `/api/clientes/${clienteId}/biblioteca`,
        input,
        { headers: { 'X-Client-ID': clienteId } },
      )
      setMateriais((prev) => [...prev, data])
    } catch {
      setSubmitError('Erro ao salvar material')
    } finally {
      setSubmitting(false)
    }
  }, [clienteId])

  const deletarMaterial = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/clientes/${clienteId}/materiais/${id}`, {
        headers: { 'X-Client-ID': clienteId },
      })
      setMateriais((prev) => prev.filter((m) => m.id !== id))
    } catch {
      setError('Erro ao remover material')
    }
  }, [clienteId])

  return { materiais, loading, error, submitting, submitError, fetchBiblioteca, criarMaterial, deletarMaterial }
}
