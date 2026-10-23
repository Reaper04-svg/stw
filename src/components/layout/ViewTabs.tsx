import type { SchematicCategory } from '../../types'
import { CATEGORY_INFO } from '../../lib/categories'
import { CountBadge } from '../ui/Badge'
import { ViewIcon } from '../ui/CategoryIcon'

export function ViewTabs({
  view,
  counts,
  onSelect,
}: {
  view: SchematicCategory
  counts: Record<SchematicCategory, number>
  onSelect: (view: SchematicCategory) => void
}) {
  const tabs: Array<{ key: SchematicCategory; label: string; count: number }> = [
    { key: 'guns', label: CATEGORY_INFO.guns.plural, count: counts.guns },
    { key: 'melee', label: CATEGORY_INFO.melee.plural, count: counts.melee },
    { key: 'traps', label: CATEGORY_INFO.traps.plural, count: counts.traps },
  ]

  return (
    <nav aria-label="Collection views" className="mb-4">
      <div className="hide-scrollbar flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect(tab.key)}
            data-active={view === tab.key}
            aria-current={view === tab.key ? 'page' : undefined}
            className="nav-tab"
          >
            <ViewIcon view={tab.key} size={14} />
            <span>{tab.label}</span>
            <CountBadge
              className={
                view === tab.key ? 'border-gold/25 bg-gold/10 text-gold-bright' : undefined
              }
            >
              {tab.count}
            </CountBadge>
          </button>
        ))}
      </div>
    </nav>
  )
}
