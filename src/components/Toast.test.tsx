import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import { render, screen } from '../test/test-utils'
import { ToastProvider } from './Toast'
import { useToast } from '../hooks/useToast'

const TriggerButton = ({ mensagem }: { mensagem: string }) => {
  const { showToast } = useToast()
  return (
    <button data-testid="btn-show-toast" onClick={() => showToast(mensagem)}>
      mostrar
    </button>
  )
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not be visible initially', () => {
    render(
      <ToastProvider>
        <TriggerButton mensagem="Tarefa concluida" />
      </ToastProvider>,
    )

    expect(screen.getByTestId('toast-feedback')).not.toHaveClass('visible')
  })

  describe('when showToast is called', () => {
    it('should display the message and become visible', () => {
      render(
        <ToastProvider>
          <TriggerButton mensagem="Tarefa concluida" />
        </ToastProvider>,
      )

      act(() => {
        screen.getByTestId('btn-show-toast').click()
      })

      const toast = screen.getByTestId('toast-feedback')
      expect(toast).toHaveTextContent('Tarefa concluida')
      expect(toast).toHaveClass('visible')
    })

    it('should hide after default duration', () => {
      render(
        <ToastProvider>
          <TriggerButton mensagem="Tarefa concluida" />
        </ToastProvider>,
      )

      act(() => {
        screen.getByTestId('btn-show-toast').click()
      })
      expect(screen.getByTestId('toast-feedback')).toHaveClass('visible')

      act(() => {
        vi.advanceTimersByTime(1800)
      })
      expect(screen.getByTestId('toast-feedback')).not.toHaveClass('visible')
    })
  })

  it('should throw when useToast is used outside provider', () => {
    const Standalone = () => {
      useToast()
      return null
    }

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Standalone />)).toThrow(
      'useToast deve ser usado dentro de <ToastProvider>',
    )

    consoleSpy.mockRestore()
  })
})
