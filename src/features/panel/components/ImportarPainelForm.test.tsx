import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent } from '../../../test/test-utils'
import { ImportarPainelForm } from './ImportarPainelForm'

const { mockImportar, mockHookReturn } = vi.hoisted(() => {
  const mockImportar = vi.fn()
  const mockHookReturn = {
    importar: mockImportar,
    submitting: false,
    error: null as string | null,
  }
  return { mockImportar, mockHookReturn }
})

vi.mock('../hooks/useImportarPainelAPI', () => ({
  useImportarPainelAPI: () => mockHookReturn,
}))

const JSON_VALIDO = JSON.stringify({
  fases: [
    {
      titulo: 'Briefing',
      tarefas: [
        { texto: 'Colher requisitos', observacao: 'Via video chamada' },
        { texto: 'Assinar contrato' },
      ],
      materiais: [{ nome: 'Contrato', tipo: 'PDF', url: 'https://ref.pdf' }],
    },
    {
      titulo: 'Criacao',
      tarefas: [{ texto: 'Criar logo' }],
    },
  ],
})

async function colarJson(user: ReturnType<typeof userEvent.setup>, valor: string) {
  await user.click(screen.getByTestId('input-import-json'))
  await user.paste(valor)
}

describe('ImportarPainelForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHookReturn.submitting = false
    mockHookReturn.error = null
  })

  describe('idle state (textarea empty)', () => {
    it('should render textarea and disabled confirm button', () => {
      render(<ImportarPainelForm clienteId="estefania" onSuccess={vi.fn()} />)

      expect(screen.getByTestId('input-import-json')).toBeInTheDocument()
      expect(screen.getByTestId('btn-confirm-import')).toBeDisabled()
      expect(screen.queryByTestId('preview-import-painel')).not.toBeInTheDocument()
    })
  })

  describe('when JSON is syntactically invalid', () => {
    it('should show parse error and keep button disabled', async () => {
      const user = userEvent.setup()
      render(<ImportarPainelForm clienteId="estefania" onSuccess={vi.fn()} />)

      await colarJson(user, '{ invalido json }')

      expect(await screen.findByTestId('msg-import-json-error')).toBeInTheDocument()
      expect(screen.getByTestId('btn-confirm-import')).toBeDisabled()
      expect(screen.queryByTestId('preview-import-painel')).not.toBeInTheDocument()
    })
  })

  describe('when JSON is structurally invalid', () => {
    it('should show error when fases field is missing', async () => {
      const user = userEvent.setup()
      render(<ImportarPainelForm clienteId="estefania" onSuccess={vi.fn()} />)

      await colarJson(user, '{}')

      expect(await screen.findByTestId('msg-import-json-error')).toBeInTheDocument()
      expect(screen.getByTestId('btn-confirm-import')).toBeDisabled()
    })

    it('should show error when fases is empty array', async () => {
      const user = userEvent.setup()
      render(<ImportarPainelForm clienteId="estefania" onSuccess={vi.fn()} />)

      await colarJson(user, '{"fases":[]}')

      expect(await screen.findByTestId('msg-import-json-error')).toBeInTheDocument()
      expect(screen.getByTestId('btn-confirm-import')).toBeDisabled()
    })

    it('should show error when fase titulo is too short', async () => {
      const user = userEvent.setup()
      render(<ImportarPainelForm clienteId="estefania" onSuccess={vi.fn()} />)

      await colarJson(user, '{"fases":[{"titulo":"AB"}]}')

      expect(await screen.findByTestId('msg-import-json-error')).toBeInTheDocument()
      expect(screen.getByTestId('btn-confirm-import')).toBeDisabled()
    })
  })

  describe('when JSON is valid', () => {
    it('should show preview with correct counts and enable button', async () => {
      const user = userEvent.setup()
      render(<ImportarPainelForm clienteId="estefania" onSuccess={vi.fn()} />)

      await colarJson(user, JSON_VALIDO)

      expect(await screen.findByTestId('preview-import-painel')).toBeInTheDocument()
      expect(screen.queryByTestId('msg-import-json-error')).not.toBeInTheDocument()
      expect(screen.getByTestId('btn-confirm-import')).toBeEnabled()

      const preview = screen.getByTestId('preview-import-painel')
      expect(preview).toHaveTextContent('2')
      expect(preview).toHaveTextContent('3')
      expect(preview).toHaveTextContent('1')
    })
  })

  describe('when submitting', () => {
    it('should disable button and show loading text', () => {
      mockHookReturn.submitting = true

      render(<ImportarPainelForm clienteId="estefania" onSuccess={vi.fn()} />)

      const btn = screen.getByTestId('btn-confirm-import')
      expect(btn).toBeDisabled()
      expect(btn).toHaveTextContent('Importando...')
    })
  })

  describe('when api returns error', () => {
    it('should display error message from hook', () => {
      mockHookReturn.error = 'Payload invalido'

      render(<ImportarPainelForm clienteId="estefania" onSuccess={vi.fn()} />)

      expect(screen.getByText(/Payload invalido/i)).toBeInTheDocument()
    })
  })

  describe('integration: success flow', () => {
    it('should call importar with parsed payload, call onSuccess, and clear textarea', async () => {
      mockImportar.mockImplementation(
        async (_payload: unknown, onSuccess: () => void) => { onSuccess() }
      )
      const onSuccess = vi.fn()
      const user = userEvent.setup()

      render(<ImportarPainelForm clienteId="estefania" onSuccess={onSuccess} />)

      await colarJson(user, JSON_VALIDO)
      await screen.findByTestId('btn-confirm-import')
      await user.click(screen.getByTestId('btn-confirm-import'))

      expect(mockImportar).toHaveBeenCalledOnce()
      expect(onSuccess).toHaveBeenCalledOnce()
      expect(
        (screen.getByTestId('input-import-json') as HTMLTextAreaElement).value
      ).toBe('')
    })
  })
})
