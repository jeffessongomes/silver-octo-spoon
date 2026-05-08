import { useDebouncedSave } from '../../../hooks/useDebouncedSave'
import { useAdminMode } from '../context/AdminModeContext'
import type { Tarefa } from '../types'

interface TarefaItemProps {
  tarefa: Tarefa
  concluida: boolean
  isToggling: boolean
  observacao: string
  obsAberta: boolean
  oculta: boolean
  onToggleConcluida: (id: string) => void
  onToggleObs: (id: string) => void
  onChangeObservacao: (id: string, valor: string) => void
}

export const TarefaItem = ({
  tarefa,
  concluida,
  isToggling,
  observacao,
  obsAberta,
  oculta,
  onToggleConcluida,
  onToggleObs,
  onChangeObservacao,
}: TarefaItemProps) => {
  const { isAdmin } = useAdminMode()
  const temObs = observacao.trim().length > 0
  const { status, schedule } = useDebouncedSave<string>((valor) =>
    onChangeObservacao(tarefa.id, valor),
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
    concluida ? 'done' : '',
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
          aria-checked={concluida}
          aria-disabled={isToggling ? true : undefined}
          tabIndex={isAdmin ? 0 : undefined}
          data-testid={`chk-toggle-tarefa-${tarefa.id}`}
          onClick={isAdmin && !isToggling ? handleCheckboxClick : undefined}
          onKeyDown={isAdmin && !isToggling ? handleCheckboxKeyDown : undefined}
        />
        <div className="task-content">
          <div className="task-text">{tarefa.texto}</div>
          {isAdmin ? (
            <>
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
                  <>
                    <textarea
                      className="task-obs-textarea"
                      data-testid={`input-edit-obs-${tarefa.id}`}
                      placeholder="Anote qualquer coisa: o que rolou, dúvidas, próximos passos..."
                      defaultValue={observacao}
                      onChange={(e) => schedule(e.target.value)}
                    />
                    <div
                      className={`task-obs-status ${status === 'idle' ? '' : 'visible'} ${status === 'saved' ? 'saved' : ''} ${status === 'saving' ? 'saving' : ''}`}
                      data-testid={`status-obs-${tarefa.id}`}
                    >
                      <span className="task-obs-status-dot"></span>
                      <span>{status === 'saving' ? 'Salvando...' : 'Salvo'}</span>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            temObs && (
              <p
                className="task-obs-readonly"
                data-testid={`obs-readonly-${tarefa.id}`}
              >
                {observacao}
              </p>
            )
          )}
        </div>
      </div>
    </li>
  )
}
