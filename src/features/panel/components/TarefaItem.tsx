import { useState, useRef } from 'react'
import { useDebouncedSave } from '../../../hooks/useDebouncedSave'
import { useAdminMode } from '../context/AdminModeContext'
import type { TarefaAPI, EditarTarefaInput } from '../types'

interface TarefaItemProps {
  tarefa: TarefaAPI
  isToggling: boolean
  obsAberta: boolean
  oculta: boolean
  onToggleConcluida: (id: string) => void
  onToggleObs: (id: string) => void
  onSaveObservacao: (id: string, valor: string) => void
  onEdit?: (id: string, input: EditarTarefaInput) => void
  onDelete?: (id: string) => void
}

type EditSaveStatus = 'idle' | 'saving' | 'saved'

const EDIT_DEBOUNCE_MS = 600
const SAVED_HIDE_MS = 2000

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
  onEdit,
  onDelete,
}: TarefaItemProps) => {
  const { isAdmin } = useAdminMode()

  const [isEditingTexto, setIsEditingTexto] = useState(false)
  const [editTextoValue, setEditTextoValue] = useState(tarefa.texto)
  const [editSaveStatus, setEditSaveStatus] = useState<EditSaveStatus>('idle')
  const editDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [confirmandoDelete, setConfirmandoDelete] = useState(false)

  const temObs = (tarefa.observacao ?? '').trim().length > 0
  const { status, schedule } = useDebouncedSave<string>((valor) =>
    onSaveObservacao(tarefa.id, valor),
  )

  const isTextoValido = (t: string) =>
    t.trim().length >= 3 && t.trim() !== tarefa.texto

  const clearEditTimers = () => {
    if (editDebounceRef.current) clearTimeout(editDebounceRef.current)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
  }

  const commitSave = (texto: string) => {
    clearEditTimers()
    setEditSaveStatus('saving')
    onEdit?.(tarefa.id, { texto: texto.trim() })
    setEditSaveStatus('saved')
    savedTimerRef.current = setTimeout(() => setEditSaveStatus('idle'), SAVED_HIDE_MS)
  }

  const handleTextoClick = () => {
    if (!isAdmin || !onEdit) return
    setEditTextoValue(tarefa.texto)
    setEditSaveStatus('idle')
    setIsEditingTexto(true)
  }

  const handleTextoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setEditTextoValue(val)

    clearEditTimers()

    if (!isTextoValido(val)) {
      setEditSaveStatus('idle')
      return
    }

    setEditSaveStatus('saving')
    editDebounceRef.current = setTimeout(() => {
      commitSave(val)
    }, EDIT_DEBOUNCE_MS)
  }

  const handleTextoBlur = () => {
    if (isTextoValido(editTextoValue)) {
      commitSave(editTextoValue)
    } else {
      clearEditTimers()
      setEditSaveStatus('idle')
    }
    setIsEditingTexto(false)
  }

  const handleTextoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      clearEditTimers()
      setEditTextoValue(tarefa.texto)
      setEditSaveStatus('idle')
      setIsEditingTexto(false)
    }
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

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

  const handleDeleteClick = () => {
    setConfirmandoDelete(true)
  }

  const handleConfirmarDelete = () => {
    onDelete?.(tarefa.id)
    setConfirmandoDelete(false)
  }

  const handleCancelarDelete = () => {
    setConfirmandoDelete(false)
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
          {isEditingTexto ? (
            <div className="task-edit-row">
              <input
                type="text"
                className="admin-input task-text-input"
                data-testid={`input-edit-tarefa-${tarefa.id}`}
                value={editTextoValue}
                onChange={handleTextoChange}
                onBlur={handleTextoBlur}
                onKeyDown={handleTextoKeyDown}
                autoFocus
              />
              {editSaveStatus !== 'idle' && (
                <span
                  className={`task-edit-status task-edit-status--${editSaveStatus}`}
                  data-testid={`status-edit-tarefa-${tarefa.id}`}
                >
                  {editSaveStatus === 'saving' ? 'Salvando...' : 'Salvo'}
                </span>
              )}
            </div>
          ) : (
            <div
              className={`task-text ${isAdmin && onEdit ? 'task-text--editable' : ''}`}
              data-testid={`task-text-${tarefa.id}`}
              onClick={handleTextoClick}
              role={isAdmin && onEdit ? 'button' : undefined}
              tabIndex={isAdmin && onEdit ? 0 : undefined}
              onKeyDown={isAdmin && onEdit ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleTextoClick() } : undefined}
            >
              {tarefa.texto}
            </div>
          )}
          {isAdmin && !isEditingTexto && (
            <div className="task-admin-actions">
              {onDelete && !confirmandoDelete && (
                <button
                  type="button"
                  className="admin-action-btn admin-action-btn--danger"
                  data-testid={`btn-delete-tarefa-${tarefa.id}`}
                  onClick={handleDeleteClick}
                >
                  Excluir
                </button>
              )}
              {confirmandoDelete && (
                <div
                  role="dialog"
                  className="task-confirm-delete"
                  data-testid={`dialog-confirm-delete-tarefa-${tarefa.id}`}
                >
                  <span className="task-confirm-delete-label">Excluir esta tarefa?</span>
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger"
                    data-testid={`btn-confirm-delete-tarefa-${tarefa.id}`}
                    onClick={handleConfirmarDelete}
                  >
                    Sim, excluir
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    data-testid={`btn-cancel-delete-tarefa-${tarefa.id}`}
                    onClick={handleCancelarDelete}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
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
