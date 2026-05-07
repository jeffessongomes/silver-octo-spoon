import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDebouncedSave } from './useDebouncedSave'

describe('useDebouncedSave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should set status to saving when schedule is called', () => {
    const onSave = vi.fn()
    const { result } = renderHook(() => useDebouncedSave(onSave))

    act(() => {
      result.current.schedule('hello')
    })

    expect(result.current.status).toBe('saving')
  })

  it('should call onSave after delay', () => {
    const onSave = vi.fn()
    const { result } = renderHook(() => useDebouncedSave(onSave, { delayMs: 400 }))

    act(() => {
      result.current.schedule('texto')
    })

    expect(onSave).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(onSave).toHaveBeenCalledWith('texto')
    expect(result.current.status).toBe('saved')
  })

  it('should reset to idle after hideSavedAfterMs', () => {
    const onSave = vi.fn()
    const { result } = renderHook(() =>
      useDebouncedSave(onSave, { delayMs: 400, hideSavedAfterMs: 1500 }),
    )

    act(() => {
      result.current.schedule('texto')
      vi.advanceTimersByTime(400)
    })
    expect(result.current.status).toBe('saved')

    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(result.current.status).toBe('idle')
  })

  it('should reset timer on each new schedule call', () => {
    const onSave = vi.fn()
    const { result } = renderHook(() => useDebouncedSave(onSave, { delayMs: 400 }))

    act(() => {
      result.current.schedule('a')
      vi.advanceTimersByTime(300)
      result.current.schedule('ab')
      vi.advanceTimersByTime(300)
    })

    expect(onSave).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith('ab')
  })
})
