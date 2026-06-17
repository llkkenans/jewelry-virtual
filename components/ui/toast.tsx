"use client"

import { useState, useCallback, createContext, useContext } from "react"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 text-sm font-medium rounded-none shadow-lg transition-all duration-300 ${
              toast.type === "success" ? "bg-[#111827] text-white" :
              toast.type === "error" ? "bg-red-600 text-white" :
              "bg-white text-[#111827] border border-[#E5E7EB]"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
