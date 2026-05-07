import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { ToastContext } from './toast-context'
import './Toast.css'

const DEFAULT_DURATION_MS = 1800

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [mensagem, setMensagem] = useState('')
  const [visivel, setVisivel] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((novaMensagem: string) => {
    setMensagem(novaMensagem)
    setVisivel(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisivel(false), DEFAULT_DURATION_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={`toast ${visivel ? 'visible' : ''}`}
        data-testid="toast-feedback"
        role="status"
        aria-live="polite"
      >
        <span className="toast-dot"></span>
        <span>{mensagem}</span>
      </div>
    </ToastContext.Provider>
  )
}
