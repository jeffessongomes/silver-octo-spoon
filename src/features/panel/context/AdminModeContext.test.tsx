import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../test/test-utils'
import { AdminModeProvider, useAdminMode } from './AdminModeContext'

const AdminModeConsumer = () => {
  const { isAdmin } = useAdminMode()
  return <div data-testid="admin-value">{String(isAdmin)}</div>
}

describe('AdminModeContext', () => {
  describe('when rendered without a provider', () => {
    it('should default to isAdmin false', () => {
      render(<AdminModeConsumer />, { isAdmin: false })

      expect(screen.getByTestId('admin-value')).toHaveTextContent('false')
    })
  })

  describe('AdminModeProvider', () => {
    it('should provide isAdmin false when passed false', () => {
      render(
        <AdminModeProvider isAdmin={false}>
          <AdminModeConsumer />
        </AdminModeProvider>,
        { isAdmin: false },
      )

      expect(screen.getByTestId('admin-value')).toHaveTextContent('false')
    })

    it('should provide isAdmin true when passed true', () => {
      render(
        <AdminModeProvider isAdmin={true}>
          <AdminModeConsumer />
        </AdminModeProvider>,
        { isAdmin: false },
      )

      expect(screen.getByTestId('admin-value')).toHaveTextContent('true')
    })
  })
})
