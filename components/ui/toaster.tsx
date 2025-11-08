"use client"

import { useToast } from "@/components/ui/use-toast"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="bg-green-700 text-white border-green-600 mx-auto">
            <div className="grid gap-2">
              {title && <ToastTitle className="text-lg font-bold text-white">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-base text-white/90">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-md" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
