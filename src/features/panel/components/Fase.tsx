import { useState } from 'react'
import type { EstadoPainel, FaseAPI, FaseStatus, FiltroTarefas, CriarTarefaInput, EditarFaseInput, EditarTarefaInput } from '../types'
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
  onSaveObservacao: (id: string, valor: string) => void
  criarTarefa: (faseId: string, input: CriarTarefaInput, onSuccess: () => void) => Promise<void>
  onDeleteFase?: (id: string) => void
  onEditFase?: (id: string, input: EditarFaseInput) => void
  onDeleteTarefa?: (id: string) => void
  onEditTarefa?: (id: string, input: EditarTarefaInput) => void
  onDeleteMaterial?: (materialId: string) => void
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
  onSaveObservacao,
  criarTarefa,
  onDeleteFase,
  onEditFase,
  onDeleteTarefa,
  onEditTarefa,
  onDeleteMaterial,
}: FaseProps) => {
  const { isAdmin } = useAdminMode()
  const isExtra = fase.tipo === 'extra'
  const articleClassName = `fase ${expandida ? 'expanded' : ''}`

  const [novaTarefaTexto, setNovaTarefaTexto] = useState('')
  const [addingTarefa, setAddingTarefa] = useState(false)
  const [addTarefaError, setAddTarefaError] = useState<string | null>(null)

  const [confirmandoDelete, setConfirmandoDelete] = useState(false)
  const [editandoFase, setEditandoFase] = useState(false)
  const [editTitulo, setEditTitulo] = useState(fase.titulo)
  const [editResumo, setEditResumo] = useState(fase.resumo)
  const [editNumero, setEditNumero] = useState(fase.numero)
  const [editStatus, setEditStatus] = useState(fase.status)

  const handleHeaderClick = () => onToggleFase(fase.id)
  const handleHeaderKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggleFase(fase.id)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmandoDelete(true)
  }

  const handleConfirmarDelete = () => {
    onDeleteFase?.(fase.id)
    setConfirmandoDelete(false)
  }

  const handleCancelarDelete = () => setConfirmandoDelete(false)

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditTitulo(fase.titulo)
    setEditResumo(fase.resumo)
    setEditNumero(fase.numero)
    setEditStatus(fase.status)
    setEditandoFase(true)
  }

  const handleSalvarEdicao = () => {
    onEditFase?.(fase.id, { titulo: editTitulo.trim(), resumo: editResumo.trim(), numero: editNumero.trim(), status: editStatus })
    setEditandoFase(false)
  }

  const handleCancelarEdicao = () => setEditandoFase(false)

  const isTituloValido = editTitulo.trim().length >= 3

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
          {isAdmin && (
            <div className="fase-admin-actions" onClick={(e) => e.stopPropagation()}>
              {onEditFase && (
                <button
                  type="button"
                  className="admin-action-btn admin-action-btn--secondary"
                  data-testid={`btn-edit-fase-${fase.id}`}
                  onClick={handleEditClick}
                >
                  Editar
                </button>
              )}
              {onDeleteFase && (
                <button
                  type="button"
                  className="admin-action-btn admin-action-btn--danger"
                  data-testid={`btn-delete-fase-${fase.id}`}
                  onClick={handleDeleteClick}
                >
                  Excluir
                </button>
              )}
            </div>
          )}
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
      {confirmandoDelete && (
        <div
          role="dialog"
          className="admin-confirm-dialog"
          data-testid={`dialog-confirm-delete-fase-${fase.id}`}
        >
          <p>
            {fase.tarefas.length === 0
              ? 'Nenhuma tarefa será perdida. Confirmar exclusão desta fase?'
              : `Esta fase possui ${fase.tarefas.length} tarefa${fase.tarefas.length > 1 ? 's' : ''} que serão perdidas. Confirmar exclusão?`}
          </p>
          <div className="admin-confirm-actions">
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              data-testid={`btn-cancel-delete-fase-${fase.id}`}
              onClick={handleCancelarDelete}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--danger"
              data-testid={`btn-confirm-delete-fase-${fase.id}`}
              onClick={handleConfirmarDelete}
            >
              Confirmar exclusão
            </button>
          </div>
        </div>
      )}
      {editandoFase && (
        <form
          className="admin-form edit-fase-form"
          data-testid={`form-edit-fase-${fase.id}`}
          onSubmit={(e) => { e.preventDefault(); handleSalvarEdicao() }}
        >
          <input
            type="text"
            className="admin-input"
            data-testid={`input-numero-fase-${fase.id}`}
            placeholder="Número da fase"
            value={editNumero}
            onChange={(e) => setEditNumero(e.target.value)}
          />
          <input
            type="text"
            className="admin-input"
            data-testid={`input-titulo-fase-${fase.id}`}
            placeholder="Título da fase"
            value={editTitulo}
            onChange={(e) => setEditTitulo(e.target.value)}
          />
          <input
            type="text"
            className="admin-input"
            data-testid={`input-resumo-fase-${fase.id}`}
            placeholder="Resumo"
            value={editResumo}
            onChange={(e) => setEditResumo(e.target.value)}
          />
          <select
            className="admin-input"
            data-testid={`sel-status-fase-${fase.id}`}
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as FaseStatus)}
          >
            <option value="pending">Pendente</option>
            <option value="active">Em andamento</option>
            <option value="done">Concluída</option>
          </select>
          <div className="admin-form-row admin-form-row--actions">
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              data-testid={`btn-cancel-edit-fase-${fase.id}`}
              onClick={handleCancelarEdicao}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              data-testid={`btn-save-edit-fase-${fase.id}`}
              disabled={!isTituloValido}
            >
              Salvar alterações
            </button>
          </div>
        </form>
      )}
      <div className="fase-conteudo">
        <div className="fase-body">
          <div className="secao-label">Tarefas</div>
          <ul className="tasks">
            {fase.tarefas.map((tarefa) => (
              <TarefaItem
                key={tarefa.id}
                tarefa={tarefa}
                isToggling={toggling.has(tarefa.id)}
                obsAberta={estado.obsAbertas.includes(tarefa.id)}
                oculta={isTarefaOculta(tarefa.concluida, filtro)}
                onToggleConcluida={() => onToggleTarefa(tarefa.id, !tarefa.concluida)}
                onToggleObs={onToggleObs}
                onSaveObservacao={onSaveObservacao}
                onEdit={onEditTarefa}
                onDelete={onDeleteTarefa}
              />
            ))}
          </ul>
          {isAdmin && (
            <form
              className="admin-form add-tarefa-form"
              data-testid={`form-add-tarefa-${fase.id}`}
              onSubmit={(e) => { e.preventDefault(); void handleAddTarefa() }}
            >
              <div className="admin-form-row">
                <input
                  type="text"
                  className="admin-input"
                  data-testid={`input-add-tarefa-${fase.id}`}
                  placeholder="Descreva a nova tarefa..."
                  value={novaTarefaTexto}
                  onChange={(e) => setNovaTarefaTexto(e.target.value)}
                />
                <button
                  type="submit"
                  className="admin-btn"
                  data-testid={`btn-add-tarefa-${fase.id}`}
                  disabled={novaTarefaTexto.trim().length < 3 || addingTarefa}
                >
                  {addingTarefa ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
              {addTarefaError && (
                <p className="admin-form-error" data-testid={`error-add-tarefa-${fase.id}`}>
                  {addTarefaError}
                </p>
              )}
            </form>
          )}
          {(fase.materiais ?? []).length > 0 ? (
            <>
              <div className="secao-label">Materiais desta fase</div>
              <div className="materiais-fase" data-testid={`materiais-fase-${fase.id}`}>
                {(fase.materiais ?? []).map((material) => (
                  <MaterialCard
                    key={material.id ?? material.nome}
                    material={material}
                    materialId={material.id}
                    onDelete={onDeleteMaterial}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </article>
  )
}
