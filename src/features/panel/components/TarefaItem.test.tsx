import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent } from '@testing-library/react'
import { render, screen, userEvent } from '../../../test/test-utils'
import { TarefaItem } from './TarefaItem'
import type { Tarefa } from '../types'

const createTarefa = (overrides: Partial<Tarefa> = {}): Tarefa => ({
  id: 't1-1',
  texto: 'Combinou com a Juliana sobre o relatório',
  ...overrides,
})

const renderTarefaItem = (overrides: Partial<React.ComponentProps<typeof TarefaItem>> = {}) => {
  const props: React.ComponentProps<typeof TarefaItem> = {
    tarefa: createTarefa(),
    concluida: false,
    observacao: '',
    obsAberta: false,
    oculta: false,
    onToggleConcluida: vi.fn(),
    onToggleObs: vi.fn(),
    onChangeObservacao: vi.fn(),
    ...overrides,
  }
  return { ...render(<TarefaItem {...props} />), props }
}

describe('TarefaItem', () => {
  describe('checkbox interaction', () => {
    it('should call onToggleConcluida when checkbox is clicked', async () => {
      const user = userEvent.setup()
      const onToggleConcluida = vi.fn()
      renderTarefaItem({ onToggleConcluida })

      await user.click(screen.getByTestId('chk-toggle-tarefa-t1-1'))

      expect(onToggleConcluida).toHaveBeenCalledWith('t1-1')
    })

    it('should reflect concluida state on the task element', () => {
      renderTarefaItem({ concluida: true })

      expect(screen.getByTestId('task-t1-1')).toHaveClass('done')
      expect(screen.getByTestId('chk-toggle-tarefa-t1-1')).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('observation toggle', () => {
    it('should display "+ Adicionar observação" when there is no observation', () => {
      renderTarefaItem({ observacao: '' })

      expect(screen.getByTestId('btn-toggle-obs-t1-1')).toHaveTextContent('+ Adicionar observação')
    })

    it('should display "✎ Observação" when there is an observation', () => {
      renderTarefaItem({ observacao: 'Combinou com a Juliana' })

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
  })

  describe('observation persistence', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should display "Salvando..." right after change event', () => {
      const onChangeObservacao = vi.fn()
      renderTarefaItem({ onChangeObservacao, obsAberta: true })

      act(() => {
        fireEvent.change(screen.getByTestId('input-edit-obs-t1-1'), {
          target: { value: 'feito' },
        })
      })

      expect(screen.getByTestId('status-obs-t1-1')).toHaveTextContent('Salvando...')
      expect(onChangeObservacao).not.toHaveBeenCalled()
    })

    it('should call onChangeObservacao after the debounce delay', () => {
      const onChangeObservacao = vi.fn()
      renderTarefaItem({ onChangeObservacao, obsAberta: true })

      act(() => {
        fireEvent.change(screen.getByTestId('input-edit-obs-t1-1'), {
          target: { value: 'feito' },
        })
      })

      act(() => {
        vi.advanceTimersByTime(400)
      })

      expect(onChangeObservacao).toHaveBeenCalledWith('t1-1', 'feito')
    })
  })

  describe('hidden state', () => {
    it('should set display: none when oculta is true', () => {
      renderTarefaItem({ oculta: true })

      expect(screen.getByTestId('task-t1-1')).toHaveStyle({ display: 'none' })
    })
  })
})
