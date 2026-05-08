import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, userEvent } from '../../test/test-utils'
import { ToastProvider } from '../../components/Toast'
import { Painel } from './Painel'
import type { FaseAPI, TarefaAPI, MaterialAPI } from './types'

// --- Factories ---

const createTarefaAPI = (overrides?: Partial<TarefaAPI>): TarefaAPI => ({
  id: 't1-1',
  texto: '+4 alunos novos fechados',
  fase_id: 'fase-1',
  cliente_id: 'estefania',
  concluida: false,
  ordem: 0,
  ...overrides,
})

const createFaseAPI = (overrides?: Partial<FaseAPI>): FaseAPI => ({
  id: 'fase-1',
  numero: 'Fase 01 · Mês 1',
  titulo: 'Arrumar a Casa',
  resumo: 'Meta de receita: R$2.000/mês',
  status: 'active',
  tarefas: [
    createTarefaAPI({ id: 't1-1', concluida: true }),
    createTarefaAPI({ id: 't1-2', concluida: true }),
    createTarefaAPI({ id: 't1-3', concluida: true }),
    createTarefaAPI({ id: 't1-4', concluida: false, texto: 'Regra de preço protegida' }),
  ],
  materiais: [],
  cliente_id: 'estefania',
  ordem: 0,
  ...overrides,
})

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

// --- Mocks ---

const { mockUseFasesAPI, mockUseTarefasAPI } = vi.hoisted(() => ({
  mockUseFasesAPI: vi.fn(),
  mockUseTarefasAPI: vi.fn(),
}))

vi.mock('./hooks/useFasesAPI', () => ({
  useFasesAPI: mockUseFasesAPI,
}))

vi.mock('./hooks/useTarefasAPI', () => ({
  useTarefasAPI: mockUseTarefasAPI,
}))

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

// --- Default mock values ---

const mockFetchFases = vi.fn()
const mockCriarFase = vi.fn()
const mockToggleConcluida = vi.fn()
const mockCriarTarefa = vi.fn()

const defaultFasesAPI = () => ({
  fases: [createFaseAPI()],
  loading: false,
  error: null,
  submitting: false,
  submitError: null,
  fetchFases: mockFetchFases,
  criarFase: mockCriarFase,
})

const defaultTarefasAPI = () => ({
  toggling: new Set<string>(),
  toggleError: null,
  addingTarefaFaseId: null,
  addTarefaError: null,
  toggleConcluida: mockToggleConcluida,
  criarTarefa: mockCriarTarefa,
})

// --- Render helper ---

const renderPainel = (isAdmin = true) =>
  render(
    <MemoryRouter initialEntries={['/estefania']}>
      <ToastProvider>
        <Routes>
          <Route path="/:clientId" element={<Painel isAdmin={isAdmin} />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  )

describe('Painel (integration)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockUseFasesAPI.mockReturnValue(defaultFasesAPI())
    mockUseTarefasAPI.mockReturnValue(defaultTarefasAPI())
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

    it('should render tasks with concluida state from API', () => {
      renderPainel()

      expect(screen.getByTestId('chk-toggle-tarefa-t1-1')).toHaveAttribute('aria-checked', 'true')
      expect(screen.getByTestId('chk-toggle-tarefa-t1-4')).toHaveAttribute('aria-checked', 'false')
    })

    it('should display correct progress count from API data', () => {
      renderPainel()

      expect(screen.getByTestId('progress-stats')).toHaveTextContent('3/')
    })
  })

  describe('loading state', () => {
    it('should display skeleton when loading is true', () => {
      mockUseFasesAPI.mockReturnValue({ ...defaultFasesAPI(), loading: true, fases: [] })

      renderPainel()

      expect(screen.getByTestId('skeleton-fases')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('should display error banner and retry button when error is set', () => {
      mockUseFasesAPI.mockReturnValue({
        ...defaultFasesAPI(),
        loading: false,
        fases: [],
        error: 'Erro ao carregar fases',
      })

      renderPainel()

      expect(screen.getByTestId('btn-retry-fases')).toBeInTheDocument()
      expect(screen.getByText('Erro ao carregar fases')).toBeInTheDocument()
    })

    it('should call fetchFases when retry button is clicked', async () => {
      const user = userEvent.setup()
      mockUseFasesAPI.mockReturnValue({
        ...defaultFasesAPI(),
        loading: false,
        fases: [],
        error: 'Erro ao carregar fases',
      })

      renderPainel()

      await user.click(screen.getByTestId('btn-retry-fases'))

      expect(mockFetchFases).toHaveBeenCalledOnce()
    })
  })

  describe('when user clicks a pending task (admin)', () => {
    it('should call toggleConcluida with tarefaId and new concluida state', async () => {
      const user = userEvent.setup()
      mockToggleConcluida.mockResolvedValue(undefined)
      renderPainel()

      await user.click(screen.getByTestId('chk-toggle-tarefa-t1-4'))

      expect(mockToggleConcluida).toHaveBeenCalledWith('t1-4', true, expect.any(Function))
    })

    it('should show toast when marking as done', async () => {
      const user = userEvent.setup()
      mockToggleConcluida.mockImplementation(
        (_id: string, _concluida: boolean, onSuccess: () => void) => {
          onSuccess()
          return Promise.resolve()
        },
      )
      renderPainel()

      await user.click(screen.getByTestId('chk-toggle-tarefa-t1-4'))

      expect(screen.getByTestId('toast-feedback')).toHaveClass('visible')
      expect(screen.getByTestId('toast-feedback')).toHaveTextContent('Tarefa concluída')
    })

    it('should not show toast when unmarking a done task', async () => {
      const user = userEvent.setup()
      mockToggleConcluida.mockImplementation(
        (_id: string, _concluida: boolean, onSuccess: () => void) => {
          onSuccess()
          return Promise.resolve()
        },
      )
      renderPainel()

      await user.click(screen.getByTestId('chk-toggle-tarefa-t1-1'))

      expect(screen.getByTestId('toast-feedback')).not.toHaveClass('visible')
    })
  })

  describe('when user clicks fase header', () => {
    it('should toggle expansion', async () => {
      const user = userEvent.setup()
      mockUseFasesAPI.mockReturnValue({
        ...defaultFasesAPI(),
        fases: [createFaseAPI(), createFaseAPI({ id: 'fase-2', titulo: 'Ativar Indicação' })],
      })
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

  describe('when isAdmin is false', () => {
    it('should not call task handler when checkbox is clicked', async () => {
      const user = userEvent.setup()
      renderPainel(false)

      await user.click(screen.getByTestId('chk-toggle-tarefa-t1-4'))

      expect(mockToggleConcluida).not.toHaveBeenCalled()
    })

    it('should not render observation toggle buttons', () => {
      renderPainel(false)

      expect(screen.queryByTestId('btn-toggle-obs-t1-4')).not.toBeInTheDocument()
    })

    it('should not render the biblioteca add form', () => {
      renderPainel(false)

      expect(screen.queryByTestId('btn-submit-material')).not.toBeInTheDocument()
    })

    it('should not render the add-fase form', () => {
      renderPainel(false)

      expect(screen.queryByTestId('btn-add-fase')).not.toBeInTheDocument()
    })
  })

  describe('formulário adicionar fase (admin)', () => {
    it('should display add-fase form when isAdmin is true', () => {
      renderPainel()

      expect(screen.getByTestId('input-add-fase-titulo')).toBeInTheDocument()
      expect(screen.getByTestId('btn-add-fase')).toBeInTheDocument()
    })

    it('should disable submit button when fields are empty', () => {
      renderPainel()

      expect(screen.getByTestId('btn-add-fase')).toBeDisabled()
    })

    it('should call criarFase on submit with titulo and resumo', async () => {
      const user = userEvent.setup()
      mockCriarFase.mockResolvedValue(undefined)
      renderPainel()

      await user.type(screen.getByTestId('input-add-fase-titulo'), 'Nova Fase de Marketing')
      await user.type(screen.getByTestId('input-add-fase-resumo'), 'Resumo da nova fase')
      await user.click(screen.getByTestId('btn-add-fase'))

      expect(mockCriarFase).toHaveBeenCalledWith({
        titulo: 'Nova Fase de Marketing',
        resumo: 'Resumo da nova fase',
        numero: '2',
      })
    })

    it('should clear form after successful submit', async () => {
      const user = userEvent.setup()
      mockCriarFase.mockResolvedValue(undefined)
      renderPainel()

      await user.type(screen.getByTestId('input-add-fase-titulo'), 'Nova Fase')
      await user.type(screen.getByTestId('input-add-fase-resumo'), 'Resumo aqui')
      await user.click(screen.getByTestId('btn-add-fase'))

      expect(screen.getByTestId('input-add-fase-titulo')).toHaveValue('')
      expect(screen.getByTestId('input-add-fase-resumo')).toHaveValue('')
    })
  })
})
