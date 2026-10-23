import { Logo } from './Logo'

export function AppHeader({ onHome }: { onHome: () => void }) {
  return (
    <header className="header-surface sticky top-0 z-40">
      <div className="mx-auto flex max-w-[1680px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onHome}
          className="group flex min-w-0 items-center gap-3 rounded-lg text-left focus-visible:outline-offset-4"
          aria-label="STW Schematic Vault home"
        >
          <Logo className="h-10 w-10 shrink-0 text-gold transition-transform duration-200 group-hover:scale-[1.04]" />
          <span className="min-w-0">
            <span className="display-title block truncate text-[19px] leading-none text-bone">
              STW <span className="text-gold">Schematic</span> Vault
            </span>
          </span>
        </button>
      </div>
    </header>
  )
}
