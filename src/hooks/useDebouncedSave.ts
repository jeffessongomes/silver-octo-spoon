import { useCallback, useEffect, useRef, useState } from 'react'

export type DebouncedSaveStatus = 'idle' | 'saving' | 'saved'

export interface UseDebouncedSaveOptions {
  delayMs?: number
  hideSavedAfterMs?: number
}

export interface UseDebouncedSaveResult<T> {
  status: DebouncedSaveStatus
  schedule: (value: T) => void
}

const DEFAULT_DELAY_MS = 400
const DEFAULT_HIDE_SAVED_AFTER_MS = 1500

export const useDebouncedSave = <T>(
  onSave: (value: T) => void,
  options: UseDebouncedSaveOptions = {},
): UseDebouncedSaveResult<T> => {
  const { delayMs = DEFAULT_DELAY_MS, hideSavedAfterMs = DEFAULT_HIDE_SAVED_AFTER_MS } = options
  const [status, setStatus] = useState<DebouncedSaveStatus>('idle')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSaveRef = useRef(onSave)

  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

  const schedule = useCallback(
    (value: T) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)

      setStatus('saving')

      saveTimerRef.current = setTimeout(() => {
        onSaveRef.current(value)
        setStatus('saved')
        hideTimerRef.current = setTimeout(() => setStatus('idle'), hideSavedAfterMs)
      }, delayMs)
    },
    [delayMs, hideSavedAfterMs],
  )

  return { status, schedule }
}
