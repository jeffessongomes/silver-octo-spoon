import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent } from '@testing-library/react'
import { render, screen, userEvent } from '../../../test/test-utils'
import { TarefaItem } from './TarefaItem'
import type { TarefaAPI } from '../types'

const createTarefa = (overrides: Partial<TarefaAPI> = {}): TarefaAPI => ({
  id: 't1-1',
  texto: 'Combinou com a Juliana sobre o relatório',
  concluida: false,
  observacao: null,
  ...overrides,
})

const renderTarefaItem = (
  overrides: Partial<React.ComponentProps<typeof TarefaItem>> = {},
  renderOptions: { isAdmin?: boolean } = {},
) => {
  const props: React.ComponentProps<typeof TarefaItem> = {
    tarefa: createTarefa(),
    isToggling: false,
    obsAberta: false,
    oculta: false,
    onToggleConcluida: vi.fn(),
    onToggleObs: vi.fn(),
    onSaveObservacao: vi.fn(),
    ...overrides,
  }
  return { ...render(<TarefaItem {...props} />, { isAdmin: renderOptions.isAdmin ?? true }), props }
}

describe('TarefaItem', () => {
  describe('checkbox interaction', () => {
    it('should call onToggleConcluida when checkbox is clicked by admin', async () => {
      const user = userEvent.setup()
      const onToggleConcluida = vi.fn()
      renderTarefaItem({ onToggleConcluida })

      await user.click(screen.getByTestId('chk-toggle-tarefa-t1-1'))

      expect(onToggleConcluida).toHaveBeenCalledWith('t1-1')
    })

    it('should call onToggleConcluida when checkbox is clicked by non-admin user', async () => {
      const user = userEvent.setup()
      const onToggleConcluida = vi.fn()
      renderTarefaItem({ onToggleConcluida }, { isAdmin: false })

      await user.click(screen.getByTestId('chk-toggle-tarefa-t1-1'))

      expect(onToggleConcluida).toHaveBeenCalledWith('t1-1')
    })

    it('should reflect concluida state on the task element', () => {
      renderTarefaItem({ tarefa: createTarefa({ concluida: true }) })

      expect(screen.getByTestId('task-t1-1')).toHaveClass('done')
      expect(screen.getByTestId('chk-toggle-tarefa-t1-1')).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('observation toggle', () => {
    it('should display "+ Adicionar observação" when there is no observation', () => {
      renderTarefaItem({ tarefa: createTarefa({ observacao: null }) })

      expect(screen.getByTestId('btn-toggle-obs-t1-1')).toHaveTextContent('+ Adicionar observação')
    })

    it('should display "✎ Observação" when there is an observation', () => {
      renderTarefaItem({ tarefa: createTarefa({ observacao: 'Combinou com a Juliana' }) })

      const btn = screen.getByTestId('btn-toggle-obs-t1-1')
      expect(btn).toHaveTextContent('✎ Observação')
      expect(btn).toHaveClass('has-content')
    })

    it('should call onToggleObs when toggle button is clicked', async () => {
      const user = userEvent.setup()
      const onToggleObs = vi.fn()
      renderTarefaItem({ onToggleObs })

      await user.click(screen.getByTestId('btn-toggle-obs-t1-1'))

      expect(onToggleObs).toHaveBeenCalledWith('t1-1')
    })

    it('should apply obs-open class when obsAberta is true', () => {
      renderTarefaItem({ obsAberta: true })

      expect(screen.getByTestId('task-t1-1')).toHaveClass('obs-open')
    })

    it('should render observation toggle button for non-admin users', () => {
      renderTarefaItem({}, { isAdmin: false })

      expect(screen.getByTestId('btn-toggle-obs-t1-1')).toBeInTheDocument()
    })
  })

  describe('observation block when open', () => {
    it('should render label "Observação" when obs is open', () => {
      renderTarefaItem({ obsAberta: true })

      expect(screen.getByText('Observação')).toBeInTheDocument()
    })

    it('should render textarea with initial value from tarefa.observacao', () => {
      renderTarefaItem({
        tarefa: createTarefa({ observacao: 'Rascunho inicial da Juliana' }),
        obsAberta: true,
      })

      const textarea = screen.getByTestId('input-edit-obs-t1-1') as HTMLTextAreaElement
      expect(textarea.defaultValue).toBe('Rascunho inicial da Juliana')
    })

    it('should render textarea for non-admin when obs is open', () => {
      renderTarefaItem({ obsAberta: true }, { isAdmin: false })

      expect(screen.getByTestId('input-edit-obs-t1-1')).toBeInTheDocument()
    })
  })

  describe('observation block when closed and has content', () => {
    it('should show readonly block with label "Observação" when obs is closed but not empty', () => {
      renderTarefaItem({
        tarefa: createTarefa({ observacao: 'Anotação da Juliana' }),
        obsAberta: false,
      })

      expect(screen.getByTestId('obs-readonly-t1-1')).toBeInTheDocument()
      expect(screen.getAllByText('Observação').length).toBeGreaterThan(0)
      expect(screen.getByText('Anotação da Juliana')).toBeInTheDocument()
    })

    it('should not show readonly block when observation is null', () => {
      renderTarefaItem({ tarefa: createTarefa({ observacao: null }), obsAberta: false })

      expect(screen.queryByTestId('obs-readonly-t1-1')).not.toBeInTheDocument()
    })

    it('should show readonly obs block for non-admin when obs is closed and not empty', () => {
      renderTarefaItem(
        { tarefa: createTarefa({ observacao: 'Nota importante' }), obsAberta: false },
        { isAdmin: false },
      )

      expect(screen.getByTestId('obs-readonly-t1-1')).toBeInTheDocument()
    })
  })

  describe('observation persistence', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should display "Salvando..." right after change event', () => {
      const onSaveObservacao = vi.fn()
      renderTarefaItem({ onSaveObservacao, obsAberta: true })

      act(() => {
        fireEvent.change(screen.getByTestId('input-edit-obs-t1-1'), {
          target: { value: 'feito' },
        })
      })

      expect(screen.getByTestId('status-obs-t1-1')).toHaveTextContent('Salvando...')
      expect(onSaveObservacao).not.toHaveBeenCalled()
    })

    it('should call onSaveObservacao after the debounce delay', () => {
      const onSaveObservacao = vi.fn()
      renderTarefaItem({ onSaveObservacao, obsAberta: true })

      act(() => {
        fireEvent.change(screen.getByTestId('input-edit-obs-t1-1'), {
          target: { value: 'feito' },
        })
      })

      act(() => {
        vi.advanceTimersByTime(400)
      })

      expect(onSaveObservacao).toHaveBeenCalledWith('t1-1', 'feito')
    })
  })

  describe('hidden state', () => {
    it('should set display: none when oculta is true', () => {
      renderTarefaItem({ oculta: true })

      expect(screen.getByTestId('task-t1-1')).toHaveStyle({ display: 'none' })
    })
  })

  describe('when isToggling is true', () => {
    it('should render checkbox with aria-disabled true', () => {
      renderTarefaItem({ isToggling: true })

      expect(screen.getByTestId('chk-toggle-tarefa-t1-1')).toHaveAttribute('aria-disabled', 'true')
    })

    it('should not call onToggleConcluida when checkbox is clicked while toggling', async () => {
      const user = userEvent.setup()
      const onToggleConcluida = vi.fn()
      renderTarefaItem({ isToggling: true, onToggleConcluida })

      await user.click(screen.getByTestId('chk-toggle-tarefa-t1-1'))

      expect(onToggleConcluida).not.toHaveBeenCalled()
    })
  })

  describe('admin actions — delete tarefa', () => {
    it('should not render delete button when not admin', () => {
      renderTarefaItem({ onDelete: vi.fn() }, { isAdmin: false })

      expect(screen.queryByTestId('btn-delete-tarefa-t1-1')).not.toBeInTheDocument()
    })

    it('should not render delete button when onDelete is not provided', () => {
      renderTarefaItem()

      expect(screen.queryByTestId('btn-delete-tarefa-t1-1')).not.toBeInTheDocument()
    })

    it('should render delete button when admin and onDelete provided', () => {
      renderTarefaItem({ onDelete: vi.fn() })

      expect(screen.getByTestId('btn-delete-tarefa-t1-1')).toBeInTheDocument()
    })

    it('should show confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup()
      renderTarefaItem({ onDelete: vi.fn() })

      await user.click(screen.getByTestId('btn-delete-tarefa-t1-1'))

      expect(screen.getByTestId('dialog-confirm-delete-tarefa-t1-1')).toBeInTheDocument()
    })

    it('should not call onDelete directly when delete button is clicked', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()
      renderTarefaItem({ onDelete })

      await user.click(screen.getByTestId('btn-delete-tarefa-t1-1'))

      expect(onDelete).not.toHaveBeenCalled()
    })

    it('should call onDelete with tarefa id when confirmation is confirmed', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()
      renderTarefaItem({ onDelete })

      await user.click(screen.getByTestId('btn-delete-tarefa-t1-1'))
      await user.click(screen.getByTestId('btn-confirm-delete-tarefa-t1-1'))

      expect(onDelete).toHaveBeenCalledWith('t1-1')
    })

    it('should hide dialog without calling onDelete when cancel is clicked', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()
      renderTarefaItem({ onDelete })

      await user.click(screen.getByTestId('btn-delete-tarefa-t1-1'))
      await user.click(screen.getByTestId('btn-cancel-delete-tarefa-t1-1'))

      expect(onDelete).not.toHaveBeenCalled()
      expect(screen.queryByTestId('dialog-confirm-delete-tarefa-t1-1')).not.toBeInTheDocument()
    })
  })

  describe('admin actions — edit tarefa inline', () => {
    it('should not open edit mode when not admin', async () => {
      const user = userEvent.setup()
      renderTarefaItem({ onEdit: vi.fn() }, { isAdmin: false })

      await user.click(screen.getByText('Combinou com a Juliana sobre o relatório'))

      expect(screen.queryByTestId('input-edit-tarefa-t1-1')).not.toBeInTheDocument()
    })

    it('should not open edit mode when onEdit is not provided', async () => {
      const user = userEvent.setup()
      renderTarefaItem()

      await user.click(screen.getByText('Combinou com a Juliana sobre o relatório'))

      expect(screen.queryByTestId('input-edit-tarefa-t1-1')).not.toBeInTheDocument()
    })

    it('should show input with current text when admin clicks on task text', async () => {
      const user = userEvent.setup()
      renderTarefaItem({ onEdit: vi.fn() })

      await user.click(screen.getByTestId('task-text-t1-1'))

      expect(screen.getByTestId('input-edit-tarefa-t1-1')).toBeInTheDocument()
      expect(screen.getByTestId('input-edit-tarefa-t1-1')).toHaveValue('Combinou com a Juliana sobre o relatório')
    })
  })

  describe('when editing task text — debounce auto-save', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should show saving indicator while debounce is pending', () => {
      const onEdit = vi.fn()
      renderTarefaItem({ onEdit })

      act(() => { fireEvent.click(screen.getByTestId('task-text-t1-1')) })
      act(() => {
        fireEvent.change(screen.getByTestId('input-edit-tarefa-t1-1'), {
          target: { value: 'Novo texto válido aqui' },
        })
      })

      expect(screen.getByTestId('status-edit-tarefa-t1-1')).toHaveTextContent('Salvando...')
    })

    it('should call onEdit after debounce delay with valid text', () => {
      const onEdit = vi.fn()
      renderTarefaItem({ onEdit })

      act(() => { fireEvent.click(screen.getByTestId('task-text-t1-1')) })
      act(() => {
        fireEvent.change(screen.getByTestId('input-edit-tarefa-t1-1'), {
          target: { value: 'Texto válido novo' },
        })
      })
      act(() => { vi.advanceTimersByTime(600) })

      expect(onEdit).toHaveBeenCalledWith('t1-1', { texto: 'Texto válido novo' })
    })

    it('should not call onEdit when text is unchanged', () => {
      const onEdit = vi.fn()
      renderTarefaItem({ onEdit })

      act(() => { fireEvent.click(screen.getByTestId('task-text-t1-1')) })
      act(() => {
        fireEvent.change(screen.getByTestId('input-edit-tarefa-t1-1'), {
          target: { value: 'Combinou com a Juliana sobre o relatório' },
        })
      })
      act(() => { vi.advanceTimersByTime(600) })

      expect(onEdit).not.toHaveBeenCalled()
    })

    it('should not call onEdit when text has fewer than 3 chars', () => {
      const onEdit = vi.fn()
      renderTarefaItem({ onEdit })

      act(() => { fireEvent.click(screen.getByTestId('task-text-t1-1')) })
      act(() => {
        fireEvent.change(screen.getByTestId('input-edit-tarefa-t1-1'), {
          target: { value: 'ab' },
        })
      })
      act(() => { vi.advanceTimersByTime(600) })

      expect(onEdit).not.toHaveBeenCalled()
    })
  })

  describe('when editing task text — keyboard and blur', () => {
    it('should cancel and restore original text on Escape', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      renderTarefaItem({ onEdit })

      await user.click(screen.getByTestId('task-text-t1-1'))
      await user.clear(screen.getByTestId('input-edit-tarefa-t1-1'))
      await user.type(screen.getByTestId('input-edit-tarefa-t1-1'), 'Texto temporário')
      await user.keyboard('{Escape}')

      expect(onEdit).not.toHaveBeenCalled()
      expect(screen.queryByTestId('input-edit-tarefa-t1-1')).not.toBeInTheDocument()
      expect(screen.getByText('Combinou com a Juliana sobre o relatório')).toBeInTheDocument()
    })

    it('should call onEdit immediately on blur with valid text', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      renderTarefaItem({ onEdit })

      await user.click(screen.getByTestId('task-text-t1-1'))
      await user.clear(screen.getByTestId('input-edit-tarefa-t1-1'))
      await user.type(screen.getByTestId('input-edit-tarefa-t1-1'), 'Texto salvo no blur')
      fireEvent.blur(screen.getByTestId('input-edit-tarefa-t1-1'))

      expect(onEdit).toHaveBeenCalledWith('t1-1', { texto: 'Texto salvo no blur' })
    })

    it('should not call onEdit on blur when text is invalid', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      renderTarefaItem({ onEdit })

      await user.click(screen.getByTestId('task-text-t1-1'))
      await user.clear(screen.getByTestId('input-edit-tarefa-t1-1'))
      await user.type(screen.getByTestId('input-edit-tarefa-t1-1'), 'ab')
      fireEvent.blur(screen.getByTestId('input-edit-tarefa-t1-1'))

      expect(onEdit).not.toHaveBeenCalled()
    })

    it('should close edit mode after saving on blur', async () => {
      const user = userEvent.setup()
      renderTarefaItem({ onEdit: vi.fn() })

      await user.click(screen.getByTestId('task-text-t1-1'))
      await user.clear(screen.getByTestId('input-edit-tarefa-t1-1'))
      await user.type(screen.getByTestId('input-edit-tarefa-t1-1'), 'Texto salvo no blur')
      fireEvent.blur(screen.getByTestId('input-edit-tarefa-t1-1'))

      expect(screen.queryByTestId('input-edit-tarefa-t1-1')).not.toBeInTheDocument()
    })
  })
})
