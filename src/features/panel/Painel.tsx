import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useToast } from '../../hooks/useToast'
import { api } from '../../lib/api'
import { AGENDA_SEMANA, HEADER_INFO } from './data'
import { Filters } from './components/Filters'
import { Hero } from './components/Hero'
import { PainelHeader } from './components/PainelHeader'
import { Sidebar } from './components/Sidebar'
import { Trilha } from './components/Trilha'
import { AdminModeProvider } from './context/AdminModeContext'
import { ImportarPainelForm } from './components/ImportarPainelForm'
import { useFasesAPI } from './hooks/useFasesAPI'
import { useTarefasAPI } from './hooks/useTarefasAPI'
import { useObservacaoAPI } from './hooks/useObservacaoAPI'
import { usePainelState } from './hooks/usePainelState'
import { usePainelStats } from './hooks/usePainelStats'
import type { CriarFaseInput, EditarFaseInput, EditarTarefaInput, FiltroTarefas, TarefaAPI } from './types'
import './Painel.css'

interface PainelProps {
  isAdmin: boolean
}

export const Painel = ({ isAdmin }: PainelProps) => {
  const { clientId = '' } = useParams<{ clientId: string }>()
  const { estado, dispatch } = usePainelState(clientId)
  const { fases: fasesLocal, setFases: setFasesLocal, loading, error, fetchFases, criarFase, submitting: criarFaseSubmitting, deletarFase, editarFase } =
    useFasesAPI(clientId)
  const { toggling, toggleConcluida, criarTarefa, deletarTarefa, editarTarefa } = useTarefasAPI(clientId)
  const { saveObservacao } = useObservacaoAPI(clientId)
  const stats = usePainelStats(fasesLocal)
  const [filtro, setFiltro] = useState<FiltroTarefas>('todas')
  const [novaFase, setNovaFase] = useState<CriarFaseInput>({ titulo: '', resumo: '' })
  const { showToast } = useToast()

  const handleToggleFase = useCallback(
    (id: string) => dispatch({ type: 'TOGGLE_FASE', faseId: id }),
    [dispatch],
  )

  const handleToggleObs = useCallback(
    (id: string) => dispatch({ type: 'TOGGLE_OBS', tarefaId: id }),
    [dispatch],
  )

  const handleSaveObservacao = useCallback(
    (id: string, valor: string) => saveObservacao(id, valor),
    [saveObservacao],
  )

  const handleToggleTarefa = useCallback(
    (tarefaId: string, novoConcluida: boolean) =>
      toggleConcluida(tarefaId, novoConcluida, () => {
        if (novoConcluida) showToast('Tarefa concluída')
        fetchFases()
      }),
    [toggleConcluida, fetchFases, showToast],
  )

  const handleCriarTarefa = useCallback(
    (faseId: string, input: { texto: string }, onSuccess: () => void) =>
      criarTarefa(faseId, input, () => {
        fetchFases()
        onSuccess()
      }),
    [criarTarefa, fetchFases],
  )

  const handleDeletarTarefa = useCallback(
    (tarefaId: string) => {
      setFasesLocal((prev) =>
        prev.map((f) => ({ ...f, tarefas: f.tarefas.filter((t) => t.id !== tarefaId) })),
      )
      void deletarTarefa(
        tarefaId,
        () => {},
        () => {
          fetchFases()
          showToast('Erro ao excluir tarefa')
        },
      )
    },
    [deletarTarefa, fetchFases, showToast, setFasesLocal],
  )

  const handleEditarTarefa = useCallback(
    (tarefaId: string, input: EditarTarefaInput) => {
      void editarTarefa(tarefaId, input, (updatedTarefa: TarefaAPI) => {
        setFasesLocal((prev) =>
          prev.map((f) => ({
            ...f,
            tarefas: f.tarefas.map((t) => (t.id === tarefaId ? { ...t, ...updatedTarefa } : t)),
          })),
        )
      })
    },
    [editarTarefa, setFasesLocal],
  )

  const handleDeletarFase = useCallback(
    (faseId: string) => {
      void deletarFase(faseId, () => { fetchFases() })
    },
    [deletarFase, fetchFases],
  )

  const handleEditarFase = useCallback(
    (faseId: string, input: EditarFaseInput) => {
      void editarFase(faseId, input, () => { fetchFases() })
    },
    [editarFase, fetchFases],
  )

  const handleDeletarMaterial = useCallback(
    async (materialId: string) => {
      setFasesLocal((prev) =>
        prev.map((f) => ({ ...f, materiais: f.materiais.filter((m) => m.id !== materialId) })),
      )
      try {
        await api.delete(`/api/clientes/${clientId}/materiais/${materialId}`, {
          headers: { 'X-Client-ID': clientId },
        })
      } catch {
        fetchFases()
        showToast('Erro ao excluir material')
      }
    },
    [clientId, fetchFases, showToast, setFasesLocal],
  )

  const expansaoInicialFeita = useRef(false)

  useEffect(() => {
    if (fasesLocal.length === 0 || expansaoInicialFeita.current) return
    expansaoInicialFeita.current = true
    if (!fasesLocal.some((f) => estado.expandidas.includes(f.id))) {
      dispatch({ type: 'TOGGLE_FASE', faseId: fasesLocal[0].id })
    }
  }, [fasesLocal, estado.expandidas, dispatch])

  const handleAddFase = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (novaFase.titulo.trim().length < 3 || novaFase.resumo.trim().length < 3) return
    await criarFase({ titulo: novaFase.titulo.trim(), resumo: novaFase.resumo.trim(), numero: String(fasesLocal.length + 1) })
    setNovaFase({ titulo: '', resumo: '' })
  }

  const isInitialLoading = loading && fasesLocal.length === 0

  if (isInitialLoading) {
    return (
      <AdminModeProvider isAdmin={isAdmin}>
        <div className="layout">
          <PainelHeader
            brand={HEADER_INFO.brand}
            brandSubtitle={HEADER_INFO.brandSubtitle}
            date={HEADER_INFO.date}
            client={HEADER_INFO.client}
          />
          <main>
            <div className="skeleton-fases" data-testid="skeleton-fases" />
          </main>
        </div>
      </AdminModeProvider>
    )
  }

  if (error) {
    return (
      <AdminModeProvider isAdmin={isAdmin}>
        <div className="layout">
          <PainelHeader
            brand={HEADER_INFO.brand}
            brandSubtitle={HEADER_INFO.brandSubtitle}
            date={HEADER_INFO.date}
            client={HEADER_INFO.client}
          />
          <main>
            <div className="error-fases" data-testid="error-fases">
              <p>{error}</p>
              <button
                type="button"
                data-testid="btn-retry-fases"
                onClick={fetchFases}
              >
                Tentar novamente
              </button>
            </div>
          </main>
        </div>
      </AdminModeProvider>
    )
  }

  return (
    <AdminModeProvider isAdmin={isAdmin}>
      <div className="layout">
        <PainelHeader
          brand={HEADER_INFO.brand}
          brandSubtitle={HEADER_INFO.brandSubtitle}
          date={HEADER_INFO.date}
          client={HEADER_INFO.client}
        />
        <main>
          <Hero
            totalConcluidas={stats.totalConcluidas}
            totalTarefas={stats.totalTarefas}
            percentual={stats.percentual}
          />
          <Filters ativo={filtro} onChange={setFiltro} />
          <Trilha
            fases={fasesLocal}
            estado={estado}
            stats={stats}
            filtro={filtro}
            toggling={toggling}
            onToggleFase={handleToggleFase}
            onToggleTarefa={handleToggleTarefa}
            onToggleObs={handleToggleObs}
            onSaveObservacao={handleSaveObservacao}
            criarTarefa={handleCriarTarefa}
            onDeleteTarefa={handleDeletarTarefa}
            onEditTarefa={handleEditarTarefa}
            onDeleteFase={handleDeletarFase}
            onEditFase={handleEditarFase}
            onDeleteMaterial={(id) => { void handleDeletarMaterial(id) }}
          />
          {isAdmin && (
            <>
            <section className="admin-section" aria-label="Adicionar nova fase">
              <h3 className="admin-section-title">Nova fase</h3>
              <form
                className="admin-form add-fase-form"
                data-testid="form-add-fase"
                onSubmit={(e) => { void handleAddFase(e) }}
              >
                <div className="admin-form-field">
                  <label htmlFor="input-add-fase-titulo" className="admin-label">
                    Título da fase
                  </label>
                  <input
                    id="input-add-fase-titulo"
                    type="text"
                    className="admin-input"
                    data-testid="input-add-fase-titulo"
                    placeholder="Ex: Identidade Visual"
                    value={novaFase.titulo}
                    onChange={(e) => setNovaFase((prev) => ({ ...prev, titulo: e.target.value }))}
                  />
                </div>
                <div className="admin-form-field">
                  <label htmlFor="input-add-fase-resumo" className="admin-label">
                    Resumo
                  </label>
                  <textarea
                    id="input-add-fase-resumo"
                    className="admin-input admin-textarea"
                    data-testid="input-add-fase-resumo"
                    placeholder="Descreva brevemente o que será entregue nesta fase..."
                    value={novaFase.resumo}
                    onChange={(e) => setNovaFase((prev) => ({ ...prev, resumo: e.target.value }))}
                  />
                </div>
                <div className="admin-form-actions">
                  <button
                    type="submit"
                    className="admin-btn admin-btn--primary"
                    data-testid="btn-add-fase"
                    disabled={
                      novaFase.titulo.trim().length < 3 ||
                      novaFase.resumo.trim().length < 3 ||
                      criarFaseSubmitting
                    }
                  >
                    {criarFaseSubmitting ? 'Adicionando...' : '+ Adicionar fase'}
                  </button>
                </div>
              </form>
            </section>
            <ImportarPainelForm clienteId={clientId} onSuccess={fetchFases} />
            </>
          )}
        </main>
        <Sidebar agenda={AGENDA_SEMANA} />
      </div>
    </AdminModeProvider>
  )
}
