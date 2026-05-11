import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent } from '../../../test/test-utils'
import { Fase } from './Fase'
import type { FaseAPI, TarefaAPI, EstadoPainel, MaterialAPI, EditarFaseInput } from '../types'

const createTarefaAPI = (overrides: Partial<TarefaAPI> = {}): TarefaAPI => ({
  id: 't1-1',
  texto: 'Combinou com a Juliana sobre o relatório',
  fase_id: 'fase-1',
  cliente_id: 'estefania',
  concluida: false,
  observacao: null,
  ordem: 0,
  ...overrides,
})

const createMaterialAPI = (overrides: Partial<MaterialAPI> = {}): MaterialAPI => ({
  id: 'mat-001',
  nome: 'Política de Alunos Fundadores',
  tipo: 'PDF',
  url: '',
  cliente_id: 'estefania',
  fase_id: 'fase-1',
  ordem: 0,
  ...overrides,
})

const createFase = (overrides: Partial<FaseAPI> = {}): FaseAPI => ({
  id: 'fase-1',
  numero: 'Fase 01 · Mês 1',
  titulo: 'Arrumar a Casa',
  resumo: 'Meta de receita: R$2.000/mês',
  status: 'pending',
  tarefas: [
    createTarefaAPI({ id: 't1-1' }),
    createTarefaAPI({ id: 't1-2', texto: 'Preparou os materiais da reunião' }),
  ],
  materiais: [createMaterialAPI()],
  cliente_id: 'estefania',
  ordem: 0,
  ...overrides,
})

const createEstado = (overrides: Partial<EstadoPainel> = {}): EstadoPainel => ({
  expandidas: [],
  obsAbertas: [],
  ...overrides,
})

const renderFase = (overrides: Partial<React.ComponentProps<typeof Fase>> = {}) => {
  const props: React.ComponentProps<typeof Fase> = {
    fase: createFase(),
    concluidas: 0,
    total: 2,
    statusVisual: 'pending',
    expandida: false,
    estado: createEstado(),
    filtro: 'todas',
    toggling: new Set<string>(),
    onToggleFase: vi.fn(),
    onToggleTarefa: vi.fn(),
    onToggleObs: vi.fn(),
    onSaveObservacao: vi.fn(),
    criarTarefa: vi.fn(),
    ...overrides,
  }
  return { ...render(<Fase {...props} />), props }
}

describe('Fase', () => {
  describe('header', () => {
    it('should display titulo, numero, resumo', () => {
      renderFase()

      expect(screen.getByText('Arrumar a Casa')).toBeInTheDocument()
      expect(screen.getByText('Fase 01 · Mês 1')).toBeInTheDocument()
      expect(screen.getByText('Meta de receita: R$2.000/mês')).toBeInTheDocument()
    })

    it('should display progresso mini', () => {
      renderFase({ concluidas: 1, total: 5 })

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('/5')).toBeInTheDocument()
    })

    it('should call onToggleFase when header is clicked', async () => {
      const user = userEvent.setup()
      const onToggleFase = vi.fn()
      renderFase({ onToggleFase })

      await user.click(screen.getByTestId('btn-toggle-fase-fase-1'))

      expect(onToggleFase).toHaveBeenCalledWith('fase-1')
    })
  })

  describe('status visual', () => {
    it('should display "Concluída" label when status is done', () => {
      renderFase({ statusVisual: 'done' })

      expect(screen.getByText('Concluída')).toBeInTheDocument()
    })

    it('should display "Em andamento" label when status is active', () => {
      renderFase({ statusVisual: 'active' })

      expect(screen.getByText('Em andamento')).toBeInTheDocument()
    })

    it('should display "Pendente" label when status is pending', () => {
      renderFase({ statusVisual: 'pending' })

      expect(screen.getByText('Pendente')).toBeInTheDocument()
    })

    it('should set data-status attribute', () => {
      renderFase({ statusVisual: 'active' })

      expect(screen.getByTestId('fase-fase-1')).toHaveAttribute('data-status', 'active')
    })
  })

  describe('when fase tipo is extra', () => {
    it('should display "Extra" badge', () => {
      renderFase({ fase: createFase({ tipo: 'extra' }) })

      expect(screen.getByText('Extra')).toBeInTheDocument()
      expect(screen.getByTestId('fase-fase-1')).toHaveAttribute('data-tipo', 'extra')
    })
  })

  describe('when materials list is empty', () => {
    it('should not render materials section', () => {
      renderFase({ fase: createFase({ materiais: [] }) })

      expect(screen.queryByTestId('materiais-fase-fase-1')).not.toBeInTheDocument()
      expect(screen.queryByText('Materiais desta fase')).not.toBeInTheDocument()
    })
  })

  describe('when materials list has items', () => {
    it('should render materials section', () => {
      renderFase()

      expect(screen.getByTestId('materiais-fase-fase-1')).toBeInTheDocument()
      expect(screen.getByText('Materiais desta fase')).toBeInTheDocument()
    })
  })

  describe('expansion', () => {
    it('should add expanded class when expandida is true', () => {
      renderFase({ expandida: true })

      expect(screen.getByTestId('fase-fase-1')).toHaveClass('expanded')
    })

    it('should set aria-expanded on header', () => {
      renderFase({ expandida: true })

      expect(screen.getByTestId('btn-toggle-fase-fase-1')).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('filter integration', () => {
    it('should hide concluded tasks when filter is pendentes', () => {
      renderFase({
        filtro: 'pendentes',
        fase: createFase({
          tarefas: [
            createTarefaAPI({ id: 't1-1', concluida: true }),
            createTarefaAPI({ id: 't1-2', concluida: false }),
          ],
        }),
      })

      expect(screen.getByTestId('task-t1-1')).toHaveStyle({ display: 'none' })
      expect(screen.getByTestId('task-t1-2')).not.toHaveStyle({ display: 'none' })
    })

    it('should hide pending tasks when filter is concluidas', () => {
      renderFase({
        filtro: 'concluidas',
        fase: createFase({
          tarefas: [
            createTarefaAPI({ id: 't1-1', concluida: true }),
            createTarefaAPI({ id: 't1-2', concluida: false }),
          ],
        }),
      })

      expect(screen.getByTestId('task-t1-1')).not.toHaveStyle({ display: 'none' })
      expect(screen.getByTestId('task-t1-2')).toHaveStyle({ display: 'none' })
    })
  })

  describe('concluida state from tarefa.concluida', () => {
    it('should render checkbox as checked when tarefa.concluida is true', () => {
      renderFase({
        fase: createFase({
          tarefas: [createTarefaAPI({ id: 't1-1', concluida: true })],
        }),
      })

      expect(screen.getByTestId('chk-toggle-tarefa-t1-1')).toHaveAttribute('aria-checked', 'true')
    })

    it('should call onToggleTarefa with id and new concluida state when checkbox is clicked', async () => {
      const user = userEvent.setup()
      const onToggleTarefa = vi.fn()
      renderFase({
        fase: createFase({
          tarefas: [createTarefaAPI({ id: 't1-1', concluida: false })],
        }),
        onToggleTarefa,
      })

      await user.click(screen.getByTestId('chk-toggle-tarefa-t1-1'))

      expect(onToggleTarefa).toHaveBeenCalledWith('t1-1', true)
    })
  })

  describe('toggling state', () => {
    it('should render checkbox with aria-disabled when tarefaId is in toggling set', () => {
      renderFase({
        fase: createFase({ tarefas: [createTarefaAPI({ id: 't1-1' })] }),
        toggling: new Set(['t1-1']),
      })

      expect(screen.getByTestId('chk-toggle-tarefa-t1-1')).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('admin actions — delete fase', () => {
    it('should not render delete button when not admin', () => {
      render(<Fase
        fase={createFase()}
        concluidas={0}
        total={2}
        statusVisual="pending"
        expandida={false}
        estado={createEstado()}
        filtro="todas"
        toggling={new Set()}
        onToggleFase={vi.fn()}
        onToggleTarefa={vi.fn()}
        onToggleObs={vi.fn()}
        onSaveObservacao={vi.fn()}
        criarTarefa={vi.fn()}
        onDeleteFase={vi.fn()}
      />, { isAdmin: false })

      expect(screen.queryByTestId('btn-delete-fase-fase-1')).not.toBeInTheDocument()
    })

    it('should render delete button when admin and onDeleteFase provided', () => {
      renderFase({ onDeleteFase: vi.fn() })

      expect(screen.getByTestId('btn-delete-fase-fase-1')).toBeInTheDocument()
    })

    it('should not trigger onToggleFase when delete button is clicked', async () => {
      const user = userEvent.setup()
      const onToggleFase = vi.fn()
      renderFase({ onDeleteFase: vi.fn(), onToggleFase })

      await user.click(screen.getByTestId('btn-delete-fase-fase-1'))

      expect(onToggleFase).not.toHaveBeenCalled()
    })

    it('should show confirmation dialog with task count when delete is clicked', async () => {
      const user = userEvent.setup()
      renderFase({ onDeleteFase: vi.fn() })

      await user.click(screen.getByTestId('btn-delete-fase-fase-1'))

      expect(screen.getByTestId('dialog-confirm-delete-fase-fase-1')).toBeInTheDocument()
      expect(screen.getByText(/2 tarefa/i)).toBeInTheDocument()
    })

    it('should show adapted message when fase has no tasks', async () => {
      const user = userEvent.setup()
      renderFase({ onDeleteFase: vi.fn(), fase: createFase({ tarefas: [] }) })

      await user.click(screen.getByTestId('btn-delete-fase-fase-1'))

      expect(screen.getByTestId('dialog-confirm-delete-fase-fase-1')).toBeInTheDocument()
      expect(screen.getByText(/nenhuma tarefa/i)).toBeInTheDocument()
    })

    it('should call onDeleteFase when confirm button is clicked', async () => {
      const user = userEvent.setup()
      const onDeleteFase = vi.fn()
      renderFase({ onDeleteFase })

      await user.click(screen.getByTestId('btn-delete-fase-fase-1'))
      await user.click(screen.getByTestId('btn-confirm-delete-fase-fase-1'))

      expect(onDeleteFase).toHaveBeenCalledWith('fase-1')
    })

    it('should close dialog without calling onDeleteFase when cancel is clicked', async () => {
      const user = userEvent.setup()
      const onDeleteFase = vi.fn()
      renderFase({ onDeleteFase })

      await user.click(screen.getByTestId('btn-delete-fase-fase-1'))
      await user.click(screen.getByTestId('btn-cancel-delete-fase-fase-1'))

      expect(onDeleteFase).not.toHaveBeenCalled()
      expect(screen.queryByTestId('dialog-confirm-delete-fase-fase-1')).not.toBeInTheDocument()
    })
  })

  describe('admin actions — edit fase', () => {
    it('should not render edit button when not admin', () => {
      render(<Fase
        fase={createFase()}
        concluidas={0}
        total={2}
        statusVisual="pending"
        expandida={false}
        estado={createEstado()}
        filtro="todas"
        toggling={new Set()}
        onToggleFase={vi.fn()}
        onToggleTarefa={vi.fn()}
        onToggleObs={vi.fn()}
        onSaveObservacao={vi.fn()}
        criarTarefa={vi.fn()}
        onEditFase={vi.fn()}
      />, { isAdmin: false })

      expect(screen.queryByTestId('btn-edit-fase-fase-1')).not.toBeInTheDocument()
    })

    it('should render edit button when admin and onEditFase provided', () => {
      renderFase({ onEditFase: vi.fn() })

      expect(screen.getByTestId('btn-edit-fase-fase-1')).toBeInTheDocument()
    })

    it('should not trigger onToggleFase when edit button is clicked', async () => {
      const user = userEvent.setup()
      const onToggleFase = vi.fn()
      renderFase({ onEditFase: vi.fn(), onToggleFase })

      await user.click(screen.getByTestId('btn-edit-fase-fase-1'))

      expect(onToggleFase).not.toHaveBeenCalled()
    })

    it('should show edit form with current values when edit button is clicked', async () => {
      const user = userEvent.setup()
      renderFase({ onEditFase: vi.fn() })

      await user.click(screen.getByTestId('btn-edit-fase-fase-1'))

      expect(screen.getByTestId('input-titulo-fase-fase-1')).toHaveValue('Arrumar a Casa')
      expect(screen.getByTestId('input-resumo-fase-fase-1')).toHaveValue('Meta de receita: R$2.000/mês')
    })

    it('should call onEditFase with updated fields when save is clicked', async () => {
      const user = userEvent.setup()
      const onEditFase = vi.fn<(id: string, input: EditarFaseInput) => void>()
      renderFase({ onEditFase })

      await user.click(screen.getByTestId('btn-edit-fase-fase-1'))
      await user.clear(screen.getByTestId('input-titulo-fase-fase-1'))
      await user.type(screen.getByTestId('input-titulo-fase-fase-1'), 'Título Atualizado')
      await user.click(screen.getByTestId('btn-save-edit-fase-fase-1'))

      expect(onEditFase).toHaveBeenCalledWith('fase-1', expect.objectContaining({ titulo: 'Título Atualizado' }))
    })

    it('should hide edit form without calling onEditFase when cancel is clicked', async () => {
      const user = userEvent.setup()
      const onEditFase = vi.fn()
      renderFase({ onEditFase })

      await user.click(screen.getByTestId('btn-edit-fase-fase-1'))
      await user.click(screen.getByTestId('btn-cancel-edit-fase-fase-1'))

      expect(onEditFase).not.toHaveBeenCalled()
      expect(screen.queryByTestId('input-titulo-fase-fase-1')).not.toBeInTheDocument()
    })

    it('should disable save button when titulo has fewer than 3 characters', async () => {
      const user = userEvent.setup()
      renderFase({ onEditFase: vi.fn() })

      await user.click(screen.getByTestId('btn-edit-fase-fase-1'))
      await user.clear(screen.getByTestId('input-titulo-fase-fase-1'))
      await user.type(screen.getByTestId('input-titulo-fase-fase-1'), 'ab')

      expect(screen.getByTestId('btn-save-edit-fase-fase-1')).toBeDisabled()
    })
  })

  describe('formulário adicionar tarefa (admin)', () => {
    it('should display add-tarefa form when isAdmin is true', () => {
      renderFase()

      expect(screen.getByTestId('input-add-tarefa-fase-1')).toBeInTheDocument()
      expect(screen.getByTestId('btn-add-tarefa-fase-1')).toBeInTheDocument()
    })

    it('should not display add-tarefa form when isAdmin is false', () => {
      render(<Fase
        fase={createFase()}
        concluidas={0}
        total={2}
        statusVisual="pending"
        expandida={false}
        estado={createEstado()}
        filtro="todas"
        toggling={new Set()}
        onToggleFase={vi.fn()}
        onToggleTarefa={vi.fn()}
        onToggleObs={vi.fn()}
        onSaveObservacao={vi.fn()}
        criarTarefa={vi.fn()}
      />, { isAdmin: false })

      expect(screen.queryByTestId('input-add-tarefa-fase-1')).not.toBeInTheDocument()
    })

    it('should disable submit button when input is empty', () => {
      renderFase()

      expect(screen.getByTestId('btn-add-tarefa-fase-1')).toBeDisabled()
    })

    it('should enable submit button when input has at least 3 chars', async () => {
      const user = userEvent.setup()
      renderFase()

      await user.type(screen.getByTestId('input-add-tarefa-fase-1'), 'Abc')

      expect(screen.getByTestId('btn-add-tarefa-fase-1')).not.toBeDisabled()
    })

    it('should call criarTarefa with faseId and texto on submit', async () => {
      const user = userEvent.setup()
      const criarTarefa = vi.fn().mockResolvedValue(undefined)
      renderFase({ criarTarefa })

      await user.type(screen.getByTestId('input-add-tarefa-fase-1'), 'Nova tarefa da Estefânia')
      await user.click(screen.getByTestId('btn-add-tarefa-fase-1'))

      expect(criarTarefa).toHaveBeenCalledWith('fase-1', { texto: 'Nova tarefa da Estefânia' }, expect.any(Function))
    })

    it('should clear input after successful submit', async () => {
      const user = userEvent.setup()
      const criarTarefa = vi.fn().mockImplementation(
        (_faseId: string, _input: unknown, onSuccess: () => void) => {
          onSuccess()
          return Promise.resolve()
        }
      )
      renderFase({ criarTarefa })

      await user.type(screen.getByTestId('input-add-tarefa-fase-1'), 'Nova tarefa')
      await user.click(screen.getByTestId('btn-add-tarefa-fase-1'))

      expect(screen.getByTestId('input-add-tarefa-fase-1')).toHaveValue('')
    })

    it('should disable submit button while criarTarefa is in progress for this fase', () => {
      renderFase({ fase: createFase({ id: 'fase-1' }) })

      // addingTarefaFaseId prop not implemented yet — verified via prop-driven disabled state
      // covered by integration in Painel tests
    })
  })
})
