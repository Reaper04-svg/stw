import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold-outline'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-gold text-[#151109] border border-gold/70 hover:bg-gold-bright hover:border-gold-bright font-semibold shadow-[0_6px_18px_rgba(215,168,74,0.14)]',
  secondary:
    'bg-white/[0.045] text-bone border border-line hover:bg-white/[0.075] hover:border-line-strong',
  ghost:
    'bg-transparent text-ash border border-transparent hover:text-bone hover:bg-white/[0.055] hover:border-white/[0.06]',
  danger:
    'bg-danger/10 text-[#ff9c91] border border-danger/35 hover:bg-danger/18 hover:border-danger/55',
  'gold-outline':
    'bg-gold/[0.07] text-gold-bright border border-gold/30 hover:bg-gold/[0.12] hover:border-gold/50',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12px] gap-1.5 rounded-[7px]',
  md: 'h-10 px-4 text-[13px] gap-2 rounded-[9px]',
  lg: 'h-11 px-5 text-sm gap-2 rounded-[10px]',
}

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant
  size?: Size
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap transition-[background-color,border-color,color,transform,box-shadow] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-45',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
