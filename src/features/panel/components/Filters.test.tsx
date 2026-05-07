import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent } from '../../../test/test-utils'
import { Filters } from './Filters'

describe('Filters', () => {
  it('should mark active filter with the active class', () => {
    render(<Filters ativo="todas" onChange={vi.fn()} />)

    expect(screen.getByTestId('btn-filter-todas')).toHaveClass('active')
    expect(screen.getByTestId('btn-filter-pendentes')).not.toHaveClass('active')
    expect(screen.getByTestId('btn-filter-concluidas')).not.toHaveClass('active')
  })

  describe('when user clicks a filter button', () => {
    it('should call onChange with the new filter value', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Filters ativo="todas" onChange={onChange} />)

      await user.click(screen.getByTestId('btn-filter-pendentes'))

      expect(onChange).toHaveBeenCalledWith('pendentes')
    })
  })
})
