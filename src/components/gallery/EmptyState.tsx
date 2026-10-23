import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function EmptyState({
  icon,
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  icon: ReactNode
  eyebrow?: string
  title: string
  description: ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.11] bg-white/[0.014] px-5 py-12 text-center sm:px-8 sm:py-16',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.06] text-gold">
        {icon}
      </div>
      {eyebrow ? (
        <p className="eyebrow mt-4" style={{ color: '#d7a84a' }}>
          {eyebrow}
        </p>
      ) : null}
      <h2 className="display-title mt-1.5 text-[27px] leading-none text-bone">{title}</h2>
      <div className="mt-2.5 max-w-md text-[13px] leading-relaxed text-ash">{description}</div>
      {children ? <div className="mt-5 w-full max-w-lg">{children}</div> : null}
      {actions ? <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{actions}</div> : null}
    </div>
  )
}
