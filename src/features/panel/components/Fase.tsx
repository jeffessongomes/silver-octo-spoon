import { useState } from 'react'
import type { EstadoPainel, FaseAPI, FaseStatus, FiltroTarefas, CriarTarefaInput } from '../types'
import { useAdminMode } from '../context/AdminModeContext'
import { MaterialCard } from './MaterialCard'
import { TarefaItem } from './TarefaItem'

const STATUS_LABEL: Record<FaseStatus, string> = {
  done: 'Concluída',
  active: 'Em andamento',
  pending: 'Pendente',
}

interface FaseProps {
  fase: FaseAPI
  concluidas: number
  total: number
  statusVisual: FaseStatus
  expandida: boolean
  estado: EstadoPainel
  filtro: FiltroTarefas
  toggling: Set<string>
  onToggleFase: (id: string) => void
  onToggleTarefa: (id: string, concluida: boolean) => void
  onToggleObs: (id: string) => void
  onChangeObservacao: (id: string, valor: string) => void
  criarTarefa: (faseId: string, input: CriarTarefaInput, onSuccess: () => void) => Promise<void>
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
  toggling,
  onToggleFase,
  onToggleTarefa,
  onToggleObs,
  onChangeObservacao,
  criarTarefa,
}: FaseProps) => {
  const { isAdmin } = useAdminMode()
  const isExtra = fase.tipo === 'extra'
  const articleClassName = `fase ${expandida ? 'expanded' : ''}`

  const [novaTarefaTexto, setNovaTarefaTexto] = useState('')
  const [addingTarefa, setAddingTarefa] = useState(false)
  const [addTarefaError, setAddTarefaError] = useState<string | null>(null)

  const handleHeaderClick = () => onToggleFase(fase.id)
  const handleHeaderKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggleFase(fase.id)
    }
  }

  const handleAddTarefa = async () => {
    if (novaTarefaTexto.trim().length < 3) return
    setAddingTarefa(true)
    setAddTarefaError(null)
    await criarTarefa(fase.id, { texto: novaTarefaTexto.trim() }, () => {
      setNovaTarefaTexto('')
    })
    setAddingTarefa(false)
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
            {fase.tarefas.map((tarefa) => (
              <TarefaItem
                key={tarefa.id}
                tarefa={tarefa}
                concluida={tarefa.concluida}
                isToggling={toggling.has(tarefa.id)}
                observacao={estado.observacoes[tarefa.id] ?? ''}
                obsAberta={estado.obsAbertas.includes(tarefa.id)}
                oculta={isTarefaOculta(tarefa.concluida, filtro)}
                onToggleConcluida={() => onToggleTarefa(tarefa.id, !tarefa.concluida)}
                onToggleObs={onToggleObs}
                onChangeObservacao={onChangeObservacao}
              />
            ))}
          </ul>
          {isAdmin && (
            <form
              className="add-tarefa-form"
              data-testid={`form-add-tarefa-${fase.id}`}
              onSubmit={(e) => { e.preventDefault(); void handleAddTarefa() }}
            >
              <input
                type="text"
                className="add-tarefa-input"
                data-testid={`input-add-tarefa-${fase.id}`}
                placeholder="Nova tarefa..."
                value={novaTarefaTexto}
                onChange={(e) => setNovaTarefaTexto(e.target.value)}
              />
              <button
                type="submit"
                data-testid={`btn-add-tarefa-${fase.id}`}
                disabled={novaTarefaTexto.trim().length < 3 || addingTarefa}
              >
                Adicionar
              </button>
              {addTarefaError && (
                <p data-testid={`error-add-tarefa-${fase.id}`}>{addTarefaError}</p>
              )}
            </form>
          )}
          {(fase.materiais ?? []).length > 0 ? (
            <>
              <div className="secao-label">Materiais desta fase</div>
              <div className="materiais-fase" data-testid={`materiais-fase-${fase.id}`}>
                {(fase.materiais ?? []).map((material) => (
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
