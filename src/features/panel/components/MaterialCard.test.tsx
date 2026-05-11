import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent } from '../../../test/test-utils'
import { MaterialCard } from './MaterialCard'
import type { Material } from '../types'

const createMaterial = (overrides: Partial<Material> = {}): Material => ({
  nome: 'Política de Alunos Fundadores',
  tipo: 'PDF',
  url: '',
  ...overrides,
})

describe('MaterialCard', () => {
  describe('when url is empty', () => {
    it('should render as pending with badge', () => {
      render(<MaterialCard material={createMaterial({ url: '' })} />)

      expect(
        screen.getByTestId('card-pending-material-politica-de-alunos-fundadores'),
      ).toBeInTheDocument()
      expect(screen.getByText('Em breve')).toBeInTheDocument()
      expect(screen.getByText('Aguardando link')).toBeInTheDocument()
    })
  })

  describe("when url is '#'", () => {
    it('should render as pending', () => {
      render(<MaterialCard material={createMaterial({ url: '#' })} />)

      expect(
        screen.getByTestId('card-pending-material-politica-de-alunos-fundadores'),
      ).toBeInTheDocument()
    })
  })

  describe('when url is valid', () => {
    it('should render as link with correct attributes', () => {
      render(
        <MaterialCard
          material={createMaterial({ nome: 'Roadmap completo', url: 'https://exemplo.com/r.pdf' })}
        />,
      )

      const link = screen.getByTestId('link-open-material-roadmap-completo')
      expect(link).toHaveAttribute('href', 'https://exemplo.com/r.pdf')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(screen.getByText('Abrir material')).toBeInTheDocument()
    })
  })

  it('should display material tipo as icon', () => {
    render(<MaterialCard material={createMaterial({ tipo: 'XLS' })} />)

    expect(screen.getByText('XLS')).toBeInTheDocument()
  })

  describe('admin delete action', () => {
    it('should not render delete button when onDelete is not provided', () => {
      render(<MaterialCard material={createMaterial({ id: 'mat-001', url: 'https://exemplo.com/r.pdf' })} />)

      expect(screen.queryByTestId('btn-delete-material-mat-001')).not.toBeInTheDocument()
    })

    it('should not render delete button when materialId is not provided', () => {
      render(<MaterialCard material={createMaterial({ url: 'https://exemplo.com/r.pdf' })} onDelete={vi.fn()} />)

      expect(screen.queryByRole('button', { name: /excluir/i })).not.toBeInTheDocument()
    })

    it('should render delete button when onDelete and materialId are provided', () => {
      render(
        <MaterialCard
          material={createMaterial({ url: 'https://exemplo.com/r.pdf' })}
          onDelete={vi.fn()}
          materialId="mat-001"
        />,
      )

      expect(screen.getByTestId('btn-delete-material-mat-001')).toBeInTheDocument()
    })

    it('should call onDelete with materialId when delete button is clicked', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()
      render(
        <MaterialCard
          material={createMaterial({ url: 'https://exemplo.com/r.pdf' })}
          onDelete={onDelete}
          materialId="mat-001"
        />,
      )

      await user.click(screen.getByTestId('btn-delete-material-mat-001'))

      expect(onDelete).toHaveBeenCalledWith('mat-001')
    })

    it('should render delete button on pending material when onDelete and materialId provided', () => {
      render(
        <MaterialCard
          material={createMaterial({ url: '' })}
          onDelete={vi.fn()}
          materialId="mat-002"
        />,
      )

      expect(screen.getByTestId('btn-delete-material-mat-002')).toBeInTheDocument()
    })
  })
})
