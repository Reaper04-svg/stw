import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Tooltip } from './Tooltip'

export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'aria-label'> {
  label: string
  tooltip?: string
  active?: boolean
  side?: 'top' | 'bottom' | 'left' | 'right'
  children: ReactNode
}

export function IconButton({
  label,
  tooltip,
  active = false,
  side = 'bottom',
  className,
  children,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <Tooltip label={tooltip ?? label} side={side}>
      <button
        type={type}
        aria-label={label}
        className={cn(
          'icon-btn',
          active && 'border-gold/25 bg-gold/10 text-gold-bright hover:bg-gold/15',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    </Tooltip>
  )
}
