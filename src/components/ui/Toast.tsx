import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ToastContext, type ToastInput, type ToastTone } from './toast-context'

interface ToastRecord extends ToastInput {
  id: string
  tone: ToastTone
}

const toneStyles: Record<ToastTone, { icon: ReactNode; className: string }> = {
  success: {
    icon: <CheckCircle2 size={17} />,
    className: 'text-success',
  },
  error: {
    icon: <AlertTriangle size={17} />,
    className: 'text-danger',
  },
  info: {
    icon: <Info size={17} />,
    className: 'text-teal',
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const timers = useRef(new Map<string, number>())
  const counter = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) window.clearTimeout(timer)
    timers.current.delete(id)
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      counter.current += 1
      const id = `toast-${Date.now()}-${counter.current}`
      const record: ToastRecord = {
        ...input,
        id,
        tone: input.tone ?? 'success',
      }
      setToasts((current) => [...current.slice(-3), record])
      const duration = input.duration ?? (record.tone === 'error' ? 7000 : 4600)
      const timer = window.setTimeout(() => dismiss(id), duration)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  useEffect(() => {
    const timersMap = timers.current
    return () => {
      for (const timer of timersMap.values()) window.clearTimeout(timer)
      timersMap.clear()
    }
  }, [])

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          aria-relevant="additions"
          className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2 pb-[env(safe-area-inset-bottom)]"
        >
          {toasts.map((item) => {
            const tone = toneStyles[item.tone]
            return (
              <div
                key={item.id}
                role={item.tone === 'error' ? 'alert' : 'status'}
                className="toast pointer-events-auto"
              >
                <span className={cn('mt-0.5 shrink-0', tone.className)}>{tone.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-bone">{item.title}</p>
                  {item.description ? (
                    <p className="mt-0.5 text-[12px] leading-relaxed text-ash">{item.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss notification"
                  className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-smoke transition hover:bg-white/[0.06] hover:text-bone"
                >
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
