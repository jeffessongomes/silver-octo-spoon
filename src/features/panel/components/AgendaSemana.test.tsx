import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../test/test-utils'
import { AgendaSemana } from './AgendaSemana'

describe('AgendaSemana', () => {
  it('should render each item with sequential 2-digit number', () => {
    render(
      <AgendaSemana
        itens={['Preencher planilha', 'Registrar fundadores', 'Mandar relatórios']}
      />,
    )

    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.getByText('03')).toBeInTheDocument()
    expect(screen.getByText('Preencher planilha')).toBeInTheDocument()
  })

  it('should render heading', () => {
    render(<AgendaSemana itens={['item']} />)

    expect(screen.getByText('Foco imediato')).toBeInTheDocument()
    expect(screen.getByText('Esta semana')).toBeInTheDocument()
  })
})
