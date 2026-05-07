import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent } from '../../../test/test-utils'
import { Fase } from './Fase'
import type { Fase as FaseType, EstadoPainel } from '../types'

const createFase = (overrides: Partial<FaseType> = {}): FaseType => ({
  id: 'fase-1',
  numero: 'Fase 01 · Mês 1',
  titulo: 'Arrumar a Casa',
  resumo: 'Meta de receita: R$2.000/mês',
  status: 'pending',
  tarefas: [
    { id: 't1-1', texto: 'Combinou com a Juliana sobre o relatório' },
    { id: 't1-2', texto: 'Preparou os materiais da reunião' },
  ],
  materiais: [{ nome: 'Política de Alunos Fundadores', tipo: 'PDF', url: '' }],
  ...overrides,
})

const createEstado = (overrides: Partial<EstadoPainel> = {}): EstadoPainel => ({
  tarefas: {},
  observacoes: {},
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
    onToggleFase: vi.fn(),
    onToggleTarefa: vi.fn(),
    onToggleObs: vi.fn(),
    onChangeObservacao: vi.fn(),
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
        estado: createEstado({ tarefas: { 't1-1': true } }),
      })

      expect(screen.getByTestId('task-t1-1')).toHaveStyle({ display: 'none' })
      expect(screen.getByTestId('task-t1-2')).not.toHaveStyle({ display: 'none' })
    })

    it('should hide pending tasks when filter is concluidas', () => {
      renderFase({
        filtro: 'concluidas',
        estado: createEstado({ tarefas: { 't1-1': true } }),
      })

      expect(screen.getByTestId('task-t1-1')).not.toHaveStyle({ display: 'none' })
      expect(screen.getByTestId('task-t1-2')).toHaveStyle({ display: 'none' })
    })
  })
})
