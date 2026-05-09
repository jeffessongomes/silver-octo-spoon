import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useToast } from '../../hooks/useToast'
import { AGENDA_SEMANA, HEADER_INFO } from './data'
import { Filters } from './components/Filters'
import { Hero } from './components/Hero'
import { PainelHeader } from './components/PainelHeader'
import { Sidebar } from './components/Sidebar'
import { Trilha } from './components/Trilha'
import { AdminModeProvider } from './context/AdminModeContext'
import { useFasesAPI } from './hooks/useFasesAPI'
import { useTarefasAPI } from './hooks/useTarefasAPI'
import { usePainelState } from './hooks/usePainelState'
import { usePainelStats } from './hooks/usePainelStats'
import type { CriarFaseInput, FiltroTarefas } from './types'
import './Painel.css'

interface PainelProps {
  isAdmin: boolean
}

export const Painel = ({ isAdmin }: PainelProps) => {
  const { clientId = '' } = useParams<{ clientId: string }>()
  const { estado, dispatch } = usePainelState(clientId)
  const { fases, loading, error, fetchFases, criarFase, submitting: criarFaseSubmitting } =
    useFasesAPI(clientId)
  const { toggling, toggleConcluida, criarTarefa } = useTarefasAPI(clientId)
  const stats = usePainelStats(fases)
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

  const handleChangeObservacao = useCallback(
    (id: string, valor: string) => dispatch({ type: 'SET_OBSERVACAO', tarefaId: id, valor }),
    [dispatch],
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

  const expansaoInicialFeita = useRef(false)

  useEffect(() => {
    if (fases.length === 0 || expansaoInicialFeita.current) return
    expansaoInicialFeita.current = true
    if (!fases.some((f) => estado.expandidas.includes(f.id))) {
      dispatch({ type: 'TOGGLE_FASE', faseId: fases[0].id })
    }
  }, [fases, estado.expandidas, dispatch])

  const handleAddFase = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (novaFase.titulo.trim().length < 3 || novaFase.resumo.trim().length < 3) return
    await criarFase({ titulo: novaFase.titulo.trim(), resumo: novaFase.resumo.trim(), numero: String(fases.length + 1) })
    setNovaFase({ titulo: '', resumo: '' })
  }

  const isInitialLoading = loading && fases.length === 0

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
            fases={fases}
            estado={estado}
            stats={stats}
            filtro={filtro}
            toggling={toggling}
            onToggleFase={handleToggleFase}
            onToggleTarefa={handleToggleTarefa}
            onToggleObs={handleToggleObs}
            onChangeObservacao={handleChangeObservacao}
            criarTarefa={handleCriarTarefa}
          />
          {isAdmin && (
            <form
              className="add-fase-form"
              data-testid="form-add-fase"
              onSubmit={(e) => { void handleAddFase(e) }}
            >
              <input
                type="text"
                className="add-fase-input"
                data-testid="input-add-fase-titulo"
                placeholder="Título da nova fase..."
                value={novaFase.titulo}
                onChange={(e) => setNovaFase((prev) => ({ ...prev, titulo: e.target.value }))}
              />
              <textarea
                className="add-fase-resumo"
                data-testid="input-add-fase-resumo"
                placeholder="Resumo da nova fase..."
                value={novaFase.resumo}
                onChange={(e) => setNovaFase((prev) => ({ ...prev, resumo: e.target.value }))}
              />
              <button
                type="submit"
                data-testid="btn-add-fase"
                disabled={
                  novaFase.titulo.trim().length < 3 ||
                  novaFase.resumo.trim().length < 3 ||
                  criarFaseSubmitting
                }
              >
                Adicionar fase
              </button>
            </form>
          )}
        </main>
        <Sidebar agenda={AGENDA_SEMANA} />
      </div>
    </AdminModeProvider>
  )
}
