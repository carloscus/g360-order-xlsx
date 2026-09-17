import { createSignal, createEffect, Show, For } from 'solid-js'

const [toasts, setToasts] = createSignal([])

let toastId = 0

export const showToast = (message, type = 'info', duration = 3000) => {
  const id = ++toastId
  setToasts(prev => [...prev, { id, message, type }])
  
  setTimeout(() => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, duration)
}

export const Toast = () => {
  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      default: return 'ℹ️'
    }
  }

  return (
    <div class="toast-container">
      <For each={toasts()}>
        {(toast) => (
          <div class={`toast toast-${toast.type}`}>
            <span class="toast-icon">{getIcon(toast.type)}</span>
            <span class="toast-message">{toast.message}</span>
          </div>
        )}
      </For>
    </div>
  )
}
