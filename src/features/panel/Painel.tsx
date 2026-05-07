import { useCallback, useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { AGENDA_SEMANA, dadosPainel, HEADER_INFO } from './data'
import { Filters } from './components/Filters'
import { Hero } from './components/Hero'
import { PainelHeader } from './components/PainelHeader'
import { Sidebar } from './components/Sidebar'
import { Trilha } from './components/Trilha'
import { usePainelState } from './hooks/usePainelState'
import { usePainelStats } from './hooks/usePainelStats'
import type { FiltroTarefas } from './types'
import './Painel.css'

export const Painel = () => {
  const { estado, dispatch } = usePainelState(dadosPainel.cliente)
  const stats = usePainelStats(dadosPainel.fases, estado.tarefas)
  const [filtro, setFiltro] = useState<FiltroTarefas>('todas')
  const { showToast } = useToast()

  const handleToggleTarefa = useCallback(
    (id: string) => {
      const ficouConcluida = !estado.tarefas[id]
      dispatch({ type: 'TOGGLE_TAREFA', tarefaId: id })
      if (ficouConcluida) showToast('Tarefa concluída')
    },
    [estado.tarefas, dispatch, showToast],
  )

  const handleToggleFase = useCallback(
    (id: string) => dispatch({ type: 'TOGGLE_FASE', faseId: id }),
    [dispatch],
  )

  const handleToggleObs = useCallback(
    (id: string) => dispatch({ type: 'TOGGLE_OBS', tarefaId: id }),
    [dispatch],
  )

  const handleChangeObservacao = useCallback(
    (id: string, valor: string) =>
      dispatch({ type: 'SET_OBSERVACAO', tarefaId: id, valor }),
    [dispatch],
  )

  return (
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
          fases={dadosPainel.fases}
          estado={estado}
          stats={stats}
          filtro={filtro}
          onToggleFase={handleToggleFase}
          onToggleTarefa={handleToggleTarefa}
          onToggleObs={handleToggleObs}
          onChangeObservacao={handleChangeObservacao}
        />
      </main>
      <Sidebar agenda={AGENDA_SEMANA} />
    </div>
  )
}
