import type { EstadoPainel, FaseAPI, FiltroTarefas, CriarTarefaInput } from '../types'
import type { PainelStats } from '../hooks/usePainelStats'
import { Fase } from './Fase'

interface TrilhaProps {
  fases: FaseAPI[]
  estado: EstadoPainel
  stats: PainelStats
  filtro: FiltroTarefas
  toggling: Set<string>
  onToggleFase: (id: string) => void
  onToggleTarefa: (id: string, concluida: boolean) => void
  onToggleObs: (id: string) => void
  onSaveObservacao: (id: string, valor: string) => void
  criarTarefa: (faseId: string, input: CriarTarefaInput, onSuccess: () => void) => Promise<void>
}

export const Trilha = ({
  fases,
  estado,
  stats,
  filtro,
  toggling,
  onToggleFase,
  onToggleTarefa,
  onToggleObs,
  onSaveObservacao,
  criarTarefa,
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
            toggling={toggling}
            onToggleFase={onToggleFase}
            onToggleTarefa={onToggleTarefa}
            onToggleObs={onToggleObs}
            onSaveObservacao={onSaveObservacao}
            criarTarefa={criarTarefa}
          />
        )
      })}
    </div>
  )
}
