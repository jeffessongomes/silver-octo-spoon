import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, userEvent } from '../../test/test-utils'
import { ToastProvider } from '../../components/Toast'
import { Painel } from './Painel'
import type { MaterialAPI } from './types'

const createMaterialAPI = (overrides?: Partial<MaterialAPI>): MaterialAPI => ({
  id: 'mat-001',
  nome: 'Guia de Fonética',
  tipo: 'PDF',
  url: 'https://exemplo.com/fonetica.pdf',
  cliente_id: 'estefania',
  fase_id: null,
  ordem: 0,
  ...overrides,
})

vi.mock('./hooks/useBiblioteca', () => ({
  useBiblioteca: vi.fn(() => ({
    materiais: [createMaterialAPI()],
    loading: false,
    error: null,
    submitting: false,
    submitError: null,
    fetchBiblioteca: vi.fn(),
    criarMaterial: vi.fn(),
    deletarMaterial: vi.fn(),
  })),
}))

const renderPainel = () =>
  render(
    <ToastProvider>
      <Painel />
    </ToastProvider>,
  )

describe('Painel (integration)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('initial state', () => {
    it('should display the header brand and client', () => {
      renderPainel()

      expect(screen.getByText('Azilab')).toBeInTheDocument()
      expect(screen.getByText('Estefânia · Reforço de Inglês')).toBeInTheDocument()
    })

    it('should expand fase-1 by default', () => {
      renderPainel()

      expect(screen.getByTestId('fase-fase-1')).toHaveClass('expanded')
    })

    it('should mark pre-completed tasks as done', () => {
      renderPainel()

      expect(screen.getByTestId('chk-toggle-tarefa-t1-1')).toHaveAttribute('aria-checked', 'true')
      expect(screen.getByTestId('chk-toggle-tarefa-t1-2')).toHaveAttribute('aria-checked', 'true')
      expect(screen.getByTestId('chk-toggle-tarefa-t1-3')).toHaveAttribute('aria-checked', 'true')
    })

    it('should display correct progress count', () => {
      renderPainel()

      expect(screen.getByTestId('progress-stats')).toHaveTextContent('8/')
    })
  })

  describe('when user clicks a pending task', () => {
    it('should mark it as done and show toast', async () => {
      const user = userEvent.setup()
      renderPainel()

      await user.click(screen.getByTestId('chk-toggle-tarefa-t1-4'))

      expect(screen.getByTestId('chk-toggle-tarefa-t1-4')).toHaveAttribute('aria-checked', 'true')
      expect(screen.getByTestId('toast-feedback')).toHaveClass('visible')
      expect(screen.getByTestId('toast-feedback')).toHaveTextContent('Tarefa concluída')
    })

    it('should not show toast when unmarking a done task', async () => {
      const user = userEvent.setup()
      renderPainel()

      await user.click(screen.getByTestId('chk-toggle-tarefa-t1-1'))

      expect(screen.getByTestId('toast-feedback')).not.toHaveClass('visible')
    })
  })

  describe('when user clicks fase header', () => {
    it('should toggle expansion', async () => {
      const user = userEvent.setup()
      renderPainel()

      await user.click(screen.getByTestId('btn-toggle-fase-fase-2'))

      expect(screen.getByTestId('fase-fase-2')).toHaveClass('expanded')
    })
  })

  describe('when user changes filter', () => {
    it('should hide concluded tasks when filter is pendentes', async () => {
      const user = userEvent.setup()
      renderPainel()

      await user.click(screen.getByTestId('btn-filter-pendentes'))

      expect(screen.getByTestId('task-t1-1')).toHaveStyle({ display: 'none' })
      expect(screen.getByTestId('task-t1-4')).not.toHaveStyle({ display: 'none' })
    })

    it('should hide pending tasks when filter is concluidas', async () => {
      const user = userEvent.setup()
      renderPainel()

      await user.click(screen.getByTestId('btn-filter-concluidas'))

      expect(screen.getByTestId('task-t1-1')).not.toHaveStyle({ display: 'none' })
      expect(screen.getByTestId('task-t1-4')).toHaveStyle({ display: 'none' })
    })
  })

  describe('persistence', () => {
    it('should persist task toggle to localStorage', async () => {
      const user = userEvent.setup()
      renderPainel()

      await user.click(screen.getByTestId('chk-toggle-tarefa-t1-4'))

      const stored = JSON.parse(localStorage.getItem('painel_estefania') ?? '{}')
      expect(stored.tarefas['t1-4']).toBe(true)
    })
  })

  describe('extra fase', () => {
    it('should display Extra badge for extra phases', () => {
      renderPainel()

      expect(screen.getByTestId('fase-fase-extra-cartoes')).toHaveAttribute('data-tipo', 'extra')
      expect(screen.getByText('Extra')).toBeInTheDocument()
    })
  })

  describe('sidebar', () => {
    it('should render agenda section', () => {
      renderPainel()

      expect(screen.getByTestId('sidebar-agenda')).toBeInTheDocument()
      expect(screen.getByText('Foco imediato')).toBeInTheDocument()
    })

    it('should render biblioteca list', () => {
      renderPainel()

      expect(screen.getByTestId('list-biblioteca')).toBeInTheDocument()
    })
  })
})
