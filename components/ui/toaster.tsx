"use client"

import { toast } from "sonner"

type ToastType = 'default' | 'success' | 'info' | 'warning' | 'error' | 'promise'
type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

export function showToast(type: ToastType, message: string, position?: ToastPosition) {
    const options = { position }

    switch (type) {
        case 'success':
            toast.success(message, options)
            break
        case 'info':
            toast.info(message, options)
            break
        case 'warning':
            toast.warning(message, options)
            break
        case 'error':
            toast.error(message, options)
            break
        case 'promise':
            toast.promise(
                new Promise((resolve) => setTimeout(() => resolve({ name: message }), 2000)),
                {
                    loading: 'Loading...',
                    success: message,
                    error: 'Error',
                    position
                }
            )
            break
        default:
            toast(message, options)
    }
}