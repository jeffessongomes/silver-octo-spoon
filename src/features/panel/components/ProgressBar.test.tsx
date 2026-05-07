import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../test/test-utils'
import { ProgressBar } from './ProgressBar'

describe('ProgressBar', () => {
  it('should display concluidas and total', () => {
    render(<ProgressBar concluidas={3} total={10} percentual={30} />)

    expect(screen.getByTestId('progress-stats')).toHaveTextContent('3/10 tarefas')
  })

  it('should set width to percentual', () => {
    render(<ProgressBar concluidas={3} total={10} percentual={30} />)

    expect(screen.getByTestId('progress-fill')).toHaveStyle({ width: '30%' })
  })

  it('should handle zero total without crashing', () => {
    render(<ProgressBar concluidas={0} total={0} percentual={0} />)

    expect(screen.getByTestId('progress-fill')).toHaveStyle({ width: '0%' })
  })
})
