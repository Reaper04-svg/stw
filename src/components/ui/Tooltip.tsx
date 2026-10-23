import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Side = 'top' | 'bottom' | 'left' | 'right'

const positions: Record<Side, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

export function Tooltip({
  label,
  children,
  side = 'bottom',
  className,
}: {
  label: string
  children: ReactNode
  side?: Side
  className?: string
}) {
  return (
    <span className={cn('tooltip-wrap relative inline-flex', className)}>
      {children}
      <span role="tooltip" className={cn('tooltip', positions[side])}>
        {label}
      </span>
    </span>
  )
}
