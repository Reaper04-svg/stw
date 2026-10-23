import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Badge({
  children,
  color,
  className,
}: {
  children: ReactNode
  color?: string
  className?: string
}) {
  return (
    <span
      className={cn('chip !min-h-6 !py-1 !text-[11px]', className)}
      style={
        color
          ? {
              color,
              borderColor: `${color}55`,
              backgroundColor: `${color}14`,
            }
          : undefined
      }
    >
      {children}
    </span>
  )
}

export function CountBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-5 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[10.5px] font-semibold leading-none text-ash',
        className,
      )}
    >
      {children}
    </span>
  )
}
