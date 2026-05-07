import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../test/test-utils'
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
})
