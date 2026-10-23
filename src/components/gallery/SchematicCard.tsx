import { ChevronRight } from 'lucide-react'
import type { Schematic } from '../../types'
import { CATEGORY_INFO } from '../../lib/categories'
import { SchematicImage } from './SchematicImage'

export function SchematicCard({
  item,
  priority = false,
  onOpen,
}: {
  item: Schematic
  priority?: boolean
  onOpen: (id: string) => void
}) {
  const info = CATEGORY_INFO[item.category]

  return (
    <article className="schematic-card group">
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        aria-haspopup="dialog"
        aria-label={`View schematic (${info.label})`}
        className="block w-full rounded-[13px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/70"
      >
        <div className="schematic-media">
          <SchematicImage
            src={item.thumbnailUrl ?? item.url}
            fallbackSrc={item.url}
            alt=""
            eager={priority}
          />

          <span
            className="pointer-events-none absolute left-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-black/60 px-1.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-bone/90 backdrop-blur-sm"
            aria-hidden="true"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: info.accent }} />
            {info.label}
          </span>

          <ChevronRight
            size={15}
            aria-hidden="true"
            className="absolute bottom-2 right-2 translate-x-1 text-bone/50 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:text-bone group-hover:opacity-100"
          />
        </div>
      </button>
    </article>
  )
}
