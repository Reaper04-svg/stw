import { cn } from '../../lib/cn'

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-bone">{label}</p>
        {description ? <p className="mt-0.5 text-[12px] leading-relaxed text-smoke">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors duration-150',
          checked
            ? 'border-gold/60 bg-gold/80'
            : 'border-line-strong bg-white/[0.06] hover:bg-white/[0.1]',
          disabled && 'opacity-40',
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full shadow-sm transition-[left,background-color] duration-150',
            checked ? 'left-[22px] bg-[#171208]' : 'left-[3px] bg-ash',
          )}
        />
      </button>
    </div>
  )
}
