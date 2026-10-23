import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { isTopDialog, popDialog, pushDialog } from '../../lib/dialogStack'
import { IconButton } from './IconButton'

type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'detail' | 'full'

const sizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  detail: 'max-w-[1480px] h-[min(94vh,1000px)]',
  full: 'max-w-[96vw] w-[96vw] h-[min(94dvh,1100px)]',
}

let bodyLockCount = 0
let previousOverflow = ''
let previousPaddingRight = ''

function lockBodyScroll() {
  if (bodyLockCount === 0) {
    const body = document.body
    previousOverflow = body.style.overflow
    previousPaddingRight = body.style.paddingRight
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarGap > 0) body.style.paddingRight = `${scrollbarGap}px`
    body.style.overflow = 'hidden'
    body.classList.add('modal-open')
  }
  bodyLockCount += 1
}

function unlockBodyScroll() {
  bodyLockCount = Math.max(0, bodyLockCount - 1)
  if (bodyLockCount === 0) {
    const body = document.body
    body.style.overflow = previousOverflow
    body.style.paddingRight = previousPaddingRight
    body.classList.remove('modal-open')
  }
}

function focusableElements(panel: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',')
  return [...panel.querySelectorAll<HTMLElement>(selector)].filter((element) => {
    return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement
  })
}

export interface DialogProps {
  open?: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  headerActions?: ReactNode
  size?: DialogSize
  className?: string
  bodyClassName?: string
  headerClassName?: string
  hideClose?: boolean
  showClose?: boolean
  closeOnOverlay?: boolean
  ariaLabel?: string
}

export function Dialog({
  open = true,
  onClose,
  title,
  description,
  children,
  footer,
  headerActions,
  size = 'md',
  className,
  bodyClassName,
  headerClassName,
  hideClose = false,
  showClose = false,
  closeOnOverlay = true,
  ariaLabel,
}: DialogProps) {
  const dialogId = useId()
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null

    pushDialog(dialogId)
    lockBodyScroll()

    const frame = window.requestAnimationFrame(() => {
      const autoFocus = panel.querySelector<HTMLElement>('[data-autofocus]')
      const focusables = focusableElements(panel)
      const target = autoFocus ?? focusables[0] ?? panel
      target.focus({ preventScroll: true })
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTopDialog(dialogId)) return

      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        closeRef.current()
        return
      }

      if (event.key !== 'Tab') return
      const focusables = focusableElements(panel)
      if (focusables.length === 0) {
        event.preventDefault()
        panel.focus({ preventScroll: true })
        return
      }

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (event.shiftKey) {
        if (active === first || !panel.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else if (active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown, true)
      unlockBodyScroll()
      popDialog(dialogId)
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [open, dialogId])

  if (!open) return null

  return createPortal(
    <div
      className="dialog-overlay"
      onMouseDown={(event) => {
        if (closeOnOverlay && event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn('dialog-panel', sizeClasses[size], className)}
      >
        <header
          className={cn(
            'flex shrink-0 items-start gap-4 border-b border-white/[0.07] px-5 py-4 sm:px-6',
            headerClassName,
          )}
        >
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="display-title text-[24px] text-bone">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-[13px] leading-relaxed text-ash">
                {description}
              </p>
            ) : null}
          </div>
          {headerActions ? <div className="flex shrink-0 items-center gap-1">{headerActions}</div> : null}
          {!hideClose || showClose ? (
            <IconButton label="Close dialog" side="left" onClick={onClose} className="-mr-1 -mt-1">
              <X size={18} />
            </IconButton>
          ) : null}
        </header>

        <div className={cn('min-h-0 flex-1 overflow-y-auto', bodyClassName)}>{children}</div>

        {footer ? (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-white/[0.07] bg-black/15 px-5 py-4 sm:px-6">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
