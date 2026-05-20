import { useState, useCallback } from 'react'

export interface ToastState {
  message: string
  type: 'success' | 'error'
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)

  const showSuccess = useCallback((message: string) => {
    setToast({ message, type: 'success' })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const showError = useCallback((message: string) => {
    setToast({ message, type: 'error' })
    setTimeout(() => setToast(null), 5000)
  }, [])

  return { toast, showSuccess, showError }
}
