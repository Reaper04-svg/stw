import { Crosshair, Heart, LayoutGrid, Radar, Swords } from 'lucide-react'
import type { SchematicCategory } from '../../types'

export function CategoryIcon({
  category,
  size = 18,
  className,
}: {
  category: SchematicCategory
  size?: number
  className?: string
}) {
  if (category === 'traps') return <Radar size={size} className={className} aria-hidden="true" />
  if (category === 'melee') return <Swords size={size} className={className} aria-hidden="true" />
  return <Crosshair size={size} className={className} aria-hidden="true" />
}

export function ViewIcon({
  view,
  size = 18,
  className,
}: {
  view: 'all' | 'favorites' | SchematicCategory
  size?: number
  className?: string
}) {
  if (view === 'all') return <LayoutGrid size={size} className={className} aria-hidden="true" />
  if (view === 'favorites') return <Heart size={size} className={className} aria-hidden="true" />
  return <CategoryIcon category={view} size={size} className={className} />
}
