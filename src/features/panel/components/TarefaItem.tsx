import { useDebouncedSave } from '../../../hooks/useDebouncedSave'
import type { TarefaAPI } from '../types'

interface TarefaItemProps {
  tarefa: TarefaAPI
  isToggling: boolean
  obsAberta: boolean
  oculta: boolean
  onToggleConcluida: (id: string) => void
  onToggleObs: (id: string) => void
  onSaveObservacao: (id: string, valor: string) => void
}

const ObsIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
    style={{ flexShrink: 0 }}
  >
    <path
      d="M2 2h8v6H7l-2 2V8H2V2z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path d="M4 5h4M4 7h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

export const TarefaItem = ({
  tarefa,
  isToggling,
  obsAberta,
  oculta,
  onToggleConcluida,
  onToggleObs,
  onSaveObservacao,
}: TarefaItemProps) => {
  const temObs = (tarefa.observacao ?? '').trim().length > 0
  const { status, schedule } = useDebouncedSave<string>((valor) =>
    onSaveObservacao(tarefa.id, valor),
  )

  const handleCheckboxClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    onToggleConcluida(tarefa.id)
  }

  const handleCheckboxKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      onToggleConcluida(tarefa.id)
    }
  }

  const liClassName = [
    'task',
    tarefa.concluida ? 'done' : '',
    obsAberta ? 'obs-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li
      className={liClassName}
      data-testid={`task-${tarefa.id}`}
      style={oculta ? { display: 'none' } : undefined}
    >
      <div className="task-header">
        <div
          className="task-checkbox"
          role="checkbox"
          aria-checked={tarefa.concluida}
          aria-disabled={isToggling ? true : undefined}
          tabIndex={isToggling ? undefined : 0}
          data-testid={`chk-toggle-tarefa-${tarefa.id}`}
          onClick={!isToggling ? handleCheckboxClick : undefined}
          onKeyDown={!isToggling ? handleCheckboxKeyDown : undefined}
        />
        <div className="task-content">
          <div className="task-text">{tarefa.texto}</div>
          <button
            type="button"
            className={`task-obs-toggle ${temObs ? 'has-content' : ''}`}
            data-testid={`btn-toggle-obs-${tarefa.id}`}
            onClick={() => onToggleObs(tarefa.id)}
          >
            {temObs ? '✎ Observação' : '+ Adicionar observação'}
          </button>
          <div className="task-obs-area">
            {obsAberta && (
              <div className="obs-block">
                <div className="obs-block-label">
                  <ObsIcon />
                  <span>Observação</span>
                </div>
                <textarea
                  className="task-obs-textarea"
                  data-testid={`input-edit-obs-${tarefa.id}`}
                  placeholder="Anote qualquer coisa: o que rolou, dúvidas, próximos passos..."
                  defaultValue={tarefa.observacao ?? ''}
                  onChange={(e) => schedule(e.target.value)}
                />
                <div
                  className={`task-obs-status ${status === 'idle' ? '' : 'visible'} ${status === 'saved' ? 'saved' : ''} ${status === 'saving' ? 'saving' : ''}`}
                  data-testid={`status-obs-${tarefa.id}`}
                >
                  <span className="task-obs-status-dot"></span>
                  <span>{status === 'saving' ? 'Salvando...' : 'Salvo'}</span>
                </div>
              </div>
            )}
            {!obsAberta && temObs && (
              <div className="obs-block obs-block--readonly" data-testid={`obs-readonly-${tarefa.id}`}>
                <div className="obs-block-label">
                  <ObsIcon />
                  <span>Observação</span>
                </div>
                <p className="obs-block-text">{tarefa.observacao}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
