import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'error' | 'success' | 'info'
  onDismiss: () => void
}

function Toast({ message, type = 'info', onDismiss }: ToastProps) {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsClosing(true), 5000)
    return () => window.clearTimeout(timeoutId)
  }, [message])

  return (
    <div
      className={`toast-notification toast-${type}${isClosing ? ' toast-closing' : ''}`}
      role={type === 'error' ? 'alert' : 'status'}
      onAnimationEnd={(event) => {
        if (isClosing && event.animationName === 'toast-exit') onDismiss()
      }}
    >
      <span>{message}</span>
      <button type="button" aria-label="Dismiss notification" title="Dismiss notification" onClick={() => setIsClosing(true)}>×</button>
    </div>
  )
}

export default Toast
