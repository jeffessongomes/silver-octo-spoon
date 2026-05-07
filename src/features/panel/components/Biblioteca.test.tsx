import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent } from '../../../test/test-utils'
import type { MaterialAPI, CriarMaterialInput } from '../types'

interface BibHookResult {
  materiais: MaterialAPI[]
  loading: boolean
  error: string | null
  submitting: boolean
  submitError: string | null
  fetchBiblioteca: () => void
  criarMaterial: (input: CriarMaterialInput) => Promise<void>
  deletarMaterial: (id: string) => Promise<void>
}

const { mockUseBiblioteca } = vi.hoisted(() => ({
  mockUseBiblioteca: vi.fn<() => BibHookResult>(),
}))

vi.mock('../hooks/useBiblioteca', () => ({
  useBiblioteca: mockUseBiblioteca,
}))

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

const makeHookIdle = (overrides?: Partial<BibHookResult>): BibHookResult => ({
  materiais: [],
  loading: false,
  error: null,
  submitting: false,
  submitError: null,
  fetchBiblioteca: vi.fn(),
  criarMaterial: vi.fn(),
  deletarMaterial: vi.fn(),
  ...overrides,
})

describe('Biblioteca', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const getComponent = async () => {
    const { Biblioteca } = await import('./Biblioteca')
    return Biblioteca
  }

  describe('when loading', () => {
    it('should render skeleton items', async () => {
      mockUseBiblioteca.mockReturnValue(makeHookIdle({ loading: true }))
      const Biblioteca = await getComponent()

      render(<Biblioteca />)

      expect(screen.getByTestId('skeleton-biblioteca')).toBeInTheDocument()
    })
  })

  describe('when error', () => {
    it('should render error message and retry button', async () => {
      mockUseBiblioteca.mockReturnValue(makeHookIdle({ error: 'Erro ao carregar materiais' }))
      const Biblioteca = await getComponent()

      render(<Biblioteca />)

      expect(screen.getByText('Erro ao carregar materiais')).toBeInTheDocument()
      expect(screen.getByTestId('btn-retry-biblioteca')).toBeInTheDocument()
    })

    it('should call fetchBiblioteca when retry is clicked', async () => {
      const fetchBiblioteca = vi.fn()
      mockUseBiblioteca.mockReturnValue(makeHookIdle({ error: 'Erro ao carregar materiais', fetchBiblioteca }))
      const Biblioteca = await getComponent()
      const user = userEvent.setup()

      render(<Biblioteca />)

      await user.click(screen.getByTestId('btn-retry-biblioteca'))

      expect(fetchBiblioteca).toHaveBeenCalledOnce()
    })
  })

  describe('when empty list', () => {
    it('should render empty state message', async () => {
      mockUseBiblioteca.mockReturnValue(makeHookIdle({ materiais: [] }))
      const Biblioteca = await getComponent()

      render(<Biblioteca />)

      expect(screen.getByTestId('empty-biblioteca')).toBeInTheDocument()
      expect(screen.getByText('Nenhum material adicionado ainda.')).toBeInTheDocument()
    })
  })

  describe('when list has items', () => {
    it('should render active material as link', async () => {
      const material = createMaterialAPI({ nome: 'Identidade Visual', url: 'https://exemplo.com/id-visual.pdf' })
      mockUseBiblioteca.mockReturnValue(makeHookIdle({ materiais: [material] }))
      const Biblioteca = await getComponent()

      render(<Biblioteca />)

      const link = screen.getByTestId('link-open-biblioteca-identidade-visual')
      expect(link).toHaveAttribute('href', 'https://exemplo.com/id-visual.pdf')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should render pending material as non-clickable item', async () => {
      const material = createMaterialAPI({ nome: 'Roadmap Completo', url: '' })
      mockUseBiblioteca.mockReturnValue(makeHookIdle({ materiais: [material] }))
      const Biblioteca = await getComponent()

      render(<Biblioteca />)

      expect(screen.getByTestId('item-pending-biblioteca-roadmap-completo')).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /Roadmap/ })).not.toBeInTheDocument()
    })

    it('should render delete button for each item', async () => {
      const material = createMaterialAPI({ id: 'mat-abc', nome: 'Guia de Fonética' })
      mockUseBiblioteca.mockReturnValue(makeHookIdle({ materiais: [material] }))
      const Biblioteca = await getComponent()

      render(<Biblioteca />)

      expect(screen.getByTestId('btn-delete-material-mat-abc')).toBeInTheDocument()
    })

    it('should call deletarMaterial when delete button is clicked', async () => {
      const deletarMaterial = vi.fn()
      const material = createMaterialAPI({ id: 'mat-abc' })
      mockUseBiblioteca.mockReturnValue(makeHookIdle({ materiais: [material], deletarMaterial }))
      const Biblioteca = await getComponent()
      const user = userEvent.setup()

      render(<Biblioteca />)

      await user.click(screen.getByTestId('btn-delete-material-mat-abc'))

      expect(deletarMaterial).toHaveBeenCalledWith('mat-abc')
    })
  })

  describe('form', () => {
    it('should render form fields and submit button', async () => {
      mockUseBiblioteca.mockReturnValue(makeHookIdle())
      const Biblioteca = await getComponent()

      render(<Biblioteca />)

      expect(screen.getByTestId('input-nome-material')).toBeInTheDocument()
      expect(screen.getByTestId('sel-tipo-material')).toBeInTheDocument()
      expect(screen.getByTestId('input-url-material')).toBeInTheDocument()
      expect(screen.getByTestId('btn-submit-material')).toBeInTheDocument()
    })

    it('should keep submit button disabled when form is incomplete', async () => {
      mockUseBiblioteca.mockReturnValue(makeHookIdle())
      const Biblioteca = await getComponent()

      render(<Biblioteca />)

      expect(screen.getByTestId('btn-submit-material')).toBeDisabled()
    })

    it('should enable submit button when all fields are valid', async () => {
      mockUseBiblioteca.mockReturnValue(makeHookIdle())
      const Biblioteca = await getComponent()
      const user = userEvent.setup()

      render(<Biblioteca />)

      await user.type(screen.getByTestId('input-nome-material'), 'Guia Prático')
      await user.selectOptions(screen.getByTestId('sel-tipo-material'), 'PDF')
      await user.type(screen.getByTestId('input-url-material'), 'https://exemplo.com/guia.pdf')

      expect(screen.getByTestId('btn-submit-material')).toBeEnabled()
    })

    it('should call criarMaterial with form data on submit', async () => {
      const criarMaterial = vi.fn().mockResolvedValue(undefined)
      mockUseBiblioteca.mockReturnValue(makeHookIdle({ criarMaterial }))
      const Biblioteca = await getComponent()
      const user = userEvent.setup()

      render(<Biblioteca />)

      await user.type(screen.getByTestId('input-nome-material'), 'Guia Prático')
      await user.selectOptions(screen.getByTestId('sel-tipo-material'), 'PDF')
      await user.type(screen.getByTestId('input-url-material'), 'https://exemplo.com/guia.pdf')
      await user.click(screen.getByTestId('btn-submit-material'))

      expect(criarMaterial).toHaveBeenCalledWith({
        nome: 'Guia Prático',
        tipo: 'PDF',
        url: 'https://exemplo.com/guia.pdf',
      })
    })

    it('should reset form fields after successful submission', async () => {
      const criarMaterial = vi.fn().mockResolvedValue(undefined)
      mockUseBiblioteca.mockReturnValue(makeHookIdle({ criarMaterial }))
      const Biblioteca = await getComponent()
      const user = userEvent.setup()

      render(<Biblioteca />)

      await user.type(screen.getByTestId('input-nome-material'), 'Guia Prático')
      await user.selectOptions(screen.getByTestId('sel-tipo-material'), 'PDF')
      await user.type(screen.getByTestId('input-url-material'), 'https://exemplo.com/guia.pdf')
      await user.click(screen.getByTestId('btn-submit-material'))

      expect(screen.getByTestId<HTMLInputElement>('input-nome-material').value).toBe('')
      expect(screen.getByTestId<HTMLInputElement>('input-url-material').value).toBe('')
    })

    it('should show "Salvando..." label while submitting', async () => {
      mockUseBiblioteca.mockReturnValue(makeHookIdle({ submitting: true }))
      const Biblioteca = await getComponent()

      render(<Biblioteca />)

      expect(screen.getByTestId('btn-submit-material')).toHaveTextContent('Salvando...')
      expect(screen.getByTestId('btn-submit-material')).toBeDisabled()
    })

    it('should display submitError message below form', async () => {
      mockUseBiblioteca.mockReturnValue(makeHookIdle({ submitError: 'Erro ao salvar material' }))
      const Biblioteca = await getComponent()

      render(<Biblioteca />)

      expect(screen.getByTestId('error-form-biblioteca')).toHaveTextContent('Erro ao salvar material')
    })

    it('should not submit when url is invalid (missing protocol)', async () => {
      const criarMaterial = vi.fn()
      mockUseBiblioteca.mockReturnValue(makeHookIdle({ criarMaterial }))
      const Biblioteca = await getComponent()
      const user = userEvent.setup()

      render(<Biblioteca />)

      await user.type(screen.getByTestId('input-nome-material'), 'Guia Prático')
      await user.selectOptions(screen.getByTestId('sel-tipo-material'), 'PDF')
      await user.type(screen.getByTestId('input-url-material'), 'exemplo.com/guia.pdf')

      expect(screen.getByTestId('btn-submit-material')).toBeDisabled()
      expect(criarMaterial).not.toHaveBeenCalled()
    })
  })

  it('should render section heading', async () => {
    mockUseBiblioteca.mockReturnValue(makeHookIdle())
    const Biblioteca = await getComponent()

    render(<Biblioteca />)

    expect(screen.getByText('Biblioteca')).toBeInTheDocument()
    expect(screen.getByText('Materiais de consulta')).toBeInTheDocument()
  })
})
