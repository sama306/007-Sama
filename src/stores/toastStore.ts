import { atom } from 'nanostores'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

export const toasts = atom<Toast[]>([])

let counter = 0

export function addToast(type: ToastType, message: string): void {
  const id = `toast-${++counter}`
  const toast: Toast = { id, type, message }

  toasts.set([...toasts.get(), toast])

  setTimeout(() => {
    removeToast(id)
  }, 3000)
}

export function removeToast(id: string): void {
  toasts.set(toasts.get().filter((t) => t.id !== id))
}
