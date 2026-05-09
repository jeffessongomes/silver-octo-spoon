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
})
