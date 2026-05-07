import type { EstadoPainel, Fase as FaseType, FiltroTarefas } from '../types'
import type { PainelStats } from '../hooks/usePainelStats'
import { Fase } from './Fase'

interface TrilhaProps {
  fases: FaseType[]
  estado: EstadoPainel
  stats: PainelStats
  filtro: FiltroTarefas
  onToggleFase: (id: string) => void
  onToggleTarefa: (id: string) => void
  onToggleObs: (id: string) => void
  onChangeObservacao: (id: string, valor: string) => void
}

export const Trilha = ({
  fases,
  estado,
  stats,
  filtro,
  onToggleFase,
  onToggleTarefa,
  onToggleObs,
  onChangeObservacao,
}: TrilhaProps) => {
  return (
    <div className="trilha" data-testid="trilha">
      {fases.map((fase) => {
        const faseStats = stats.porFase[fase.id]
        return (
          <Fase
            key={fase.id}
            fase={fase}
            concluidas={faseStats.concluidas}
            total={faseStats.total}
            statusVisual={faseStats.statusVisual}
            expandida={estado.expandidas.includes(fase.id)}
            estado={estado}
            filtro={filtro}
            onToggleFase={onToggleFase}
            onToggleTarefa={onToggleTarefa}
            onToggleObs={onToggleObs}
            onChangeObservacao={onChangeObservacao}
          />
        )
      })}
    </div>
  )
}
