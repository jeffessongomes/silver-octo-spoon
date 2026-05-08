/* eslint-disable react-refresh/only-export-components */
import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { AdminModeProvider } from '../features/panel/context/AdminModeContext'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  isAdmin?: boolean
}

const customRender = (
  ui: ReactElement,
  { isAdmin = true, ...options }: CustomRenderOptions = {},
) =>
  render(<AdminModeProvider isAdmin={isAdmin}>{ui}</AdminModeProvider>, options)

export * from '@testing-library/react'
export { customRender as render }
export { userEvent }
