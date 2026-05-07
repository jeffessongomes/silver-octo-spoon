import type { EstadoPainel, Fase as FaseType, FaseStatus, FiltroTarefas } from '../types'
import { MaterialCard } from './MaterialCard'
import { TarefaItem } from './TarefaItem'

const STATUS_LABEL: Record<FaseStatus, string> = {
  done: 'Concluída',
  active: 'Em andamento',
  pending: 'Pendente',
}

interface FaseProps {
  fase: FaseType
  concluidas: number
  total: number
  statusVisual: FaseStatus
  expandida: boolean
  estado: EstadoPainel
  filtro: FiltroTarefas
  onToggleFase: (id: string) => void
  onToggleTarefa: (id: string) => void
  onToggleObs: (id: string) => void
  onChangeObservacao: (id: string, valor: string) => void
}

const isTarefaOculta = (concluida: boolean, filtro: FiltroTarefas): boolean => {
  if (filtro === 'todas') return false
  if (filtro === 'pendentes') return concluida
  return !concluida
}

export const Fase = ({
  fase,
  concluidas,
  total,
  statusVisual,
  expandida,
  estado,
  filtro,
  onToggleFase,
  onToggleTarefa,
  onToggleObs,
  onChangeObservacao,
}: FaseProps) => {
  const isExtra = fase.tipo === 'extra'
  const articleClassName = `fase ${expandida ? 'expanded' : ''}`

  const handleHeaderClick = () => onToggleFase(fase.id)
  const handleHeaderKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggleFase(fase.id)
    }
  }

  return (
    <article
      className={articleClassName}
      data-status={statusVisual}
      data-fase-id={fase.id}
      data-tipo={isExtra ? 'extra' : undefined}
      data-testid={`fase-${fase.id}`}
    >
      <div
        className="fase-header"
        role="button"
        tabIndex={0}
        aria-expanded={expandida}
        data-testid={`btn-toggle-fase-${fase.id}`}
        onClick={handleHeaderClick}
        onKeyDown={handleHeaderKeyDown}
      >
        <div className="fase-info">
          <div className="fase-meta">
            <span className="fase-numero">{fase.numero}</span>
            <span className={`fase-status ${statusVisual}`}>{STATUS_LABEL[statusVisual]}</span>
            {isExtra ? <span className="fase-badge-extra">Extra</span> : null}
          </div>
          <h2 className="fase-titulo">{fase.titulo}</h2>
          <p className="fase-resumo">{fase.resumo}</p>
        </div>
        <div className="fase-controle">
          <div className="fase-progresso-mini">
            {concluidas}
            <span>/{total}</span>
          </div>
          <div className="fase-toggle" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="fase-conteudo">
        <div className="fase-body">
          <div className="secao-label">Tarefas</div>
          <ul className="tasks">
            {fase.tarefas.map((tarefa) => {
              const concluidaTarefa = Boolean(estado.tarefas[tarefa.id])
              return (
                <TarefaItem
                  key={tarefa.id}
                  tarefa={tarefa}
                  concluida={concluidaTarefa}
                  observacao={estado.observacoes[tarefa.id] ?? ''}
                  obsAberta={estado.obsAbertas.includes(tarefa.id)}
                  oculta={isTarefaOculta(concluidaTarefa, filtro)}
                  onToggleConcluida={onToggleTarefa}
                  onToggleObs={onToggleObs}
                  onChangeObservacao={onChangeObservacao}
                />
              )
            })}
          </ul>
          {fase.materiais.length > 0 ? (
            <>
              <div className="secao-label">Materiais desta fase</div>
              <div className="materiais-fase" data-testid={`materiais-fase-${fase.id}`}>
                {fase.materiais.map((material) => (
                  <MaterialCard key={material.nome} material={material} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </article>
  )
}
