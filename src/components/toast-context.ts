import { createContext } from 'react'

export interface ToastContextValue {
  showToast: (mensagem: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
