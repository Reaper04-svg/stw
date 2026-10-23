import type {
  Element,
  Facets,
  Filters,
  MainView,
  Rarity,
  Schematic,
  SchematicCategory,
  SortKey,
} from '../types'
import { CATEGORIES, ELEMENTS, RARITIES } from '../types'
import { CATEGORY_INFO, CATEGORY_ORDER, ELEMENT_INFO, RARITY_INFO, isCategoryView } from './categories'
import { hasMetadataContent } from './metadata'

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/** Case/diacritic-insensitive text with punctuation treated as word gaps. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export function compactSearchText(normalized: string): string {
  return normalized.replace(/\s+/g, '')
}

const haystackCache = new WeakMap<Schematic, { spaced: string; compact: string }>()

function haystackFor(item: Schematic): { spaced: string; compact: string } {
  const cached = haystackCache.get(item)
  if (cached) return cached
  const metadata = item.metadata
  const parts = [
    item.name,
    item.derivedName,
    item.file,
    item.id,
    CATEGORY_INFO[item.category].label,
    CATEGORY_INFO[item.sourceCategory].label,
    metadata?.displayName,
    metadata?.rarity,
    metadata?.rarity ? RARITY_INFO[metadata.rarity].label : '',
    metadata?.element,
    metadata?.element ? ELEMENT_INFO[metadata.element].label : '',
    metadata?.subtype,
    metadata?.perks,
    metadata?.notes,
    metadata?.tags?.join(' '),
    metadata?.powerLevel ? `power level pl ${metadata.powerLevel}` : '',
  ]
  const spaced = normalizeSearchText(parts.filter(Boolean).join(' '))
  const result = { spaced, compact: compactSearchText(spaced) }
  haystackCache.set(item, result)
  return result
}

export function createSearchMatcher(query: string): (item: Schematic) => boolean {
  const normalized = normalizeSearchText(query)
  if (!normalized) return () => true
  const tokens = normalized.split(' ')
  return (item) => {
    const { spaced, compact } = haystackFor(item)
    return tokens.every((token) => spaced.includes(token) || compact.includes(token))
  }
}

export function viewScope(items: Schematic[], view: MainView): Schematic[] {
  if (view === 'all') return items
  if (view === 'favorites') return items.filter((item) => item.isFavorite)
  return items.filter((item) => item.category === view)
}

export function getFacets(items: Schematic[]): Facets {
  const tags = new Map<string, string>()
  const rarities = new Set<Rarity>()
  const elements = new Set<Element>()
  const subtypes = new Map<string, string>()
  let hasPowerLevels = false
  let hasAnyMetadata = false

  for (const item of items) {
    const metadata = item.metadata
    if (!metadata) continue
    if (hasMetadataContent(metadata)) hasAnyMetadata = true
    for (const tag of metadata.tags ?? []) {
      const key = tag.toLowerCase()
      if (!tags.has(key)) tags.set(key, tag)
    }
    if (metadata.rarity) rarities.add(metadata.rarity)
    if (metadata.element) elements.add(metadata.element)
    if (metadata.subtype) {
      const key = metadata.subtype.toLowerCase()
      if (!subtypes.has(key)) subtypes.set(key, metadata.subtype)
    }
    if (metadata.powerLevel !== undefined) hasPowerLevels = true
  }

  return {
    tags: [...tags.values()].sort((a, b) => collator.compare(a, b)),
    rarities: RARITIES.filter((rarity) => rarities.has(rarity)),
    elements: ELEMENTS.filter((element) => elements.has(element)),
    subtypes: [...subtypes.values()].sort((a, b) => collator.compare(a, b)),
    hasPowerLevels,
    hasAnyMetadata,
  }
}

export function hasActiveCriteria(filters: Filters, view: MainView, query: string): boolean {
  if (query.trim()) return true
  if (isCategoryView(view)) {
    return (
      filters.favoritesOnly ||
      filters.hasMetadataOnly ||
      filters.rarity !== 'any' ||
      filters.element !== 'any' ||
      filters.subtype !== 'any' ||
      filters.tags.length > 0 ||
      filters.minPower !== null ||
      filters.maxPower !== null
    )
  }
  return (
    filters.category !== 'any' ||
    filters.favoritesOnly ||
    filters.hasMetadataOnly ||
    filters.rarity !== 'any' ||
    filters.element !== 'any' ||
    filters.subtype !== 'any' ||
    filters.tags.length > 0 ||
    filters.minPower !== null ||
    filters.maxPower !== null
  )
}

export function activeFilterCount(filters: Filters, view: MainView): number {
  let count = 0
  if (filters.category !== 'any' && (view === 'all' || view === 'favorites')) count += 1
  if (filters.favoritesOnly) count += 1
  if (filters.hasMetadataOnly) count += 1
  if (filters.rarity !== 'any') count += 1
  if (filters.element !== 'any') count += 1
  if (filters.subtype !== 'any') count += 1
  if (filters.minPower !== null || filters.maxPower !== null) count += 1
  count += filters.tags.length
  return count
}

export function applyFilters(items: Schematic[], filters: Filters, view: MainView): Schematic[] {
  return items.filter((item) => {
    if (isCategoryView(view) && item.category !== view) return false
    if (
      (view === 'all' || view === 'favorites') &&
      filters.category !== 'any' &&
      item.category !== (filters.category as SchematicCategory)
    ) {
      return false
    }
    if ((view === 'favorites' || filters.favoritesOnly) && !item.isFavorite) return false
    if (filters.hasMetadataOnly && !hasMetadataContent(item.metadata)) return false

    const metadata = item.metadata
    if (filters.rarity !== 'any' && metadata?.rarity !== filters.rarity) return false
    if (filters.element !== 'any' && metadata?.element !== filters.element) return false
    if (
      filters.subtype !== 'any' &&
      (metadata?.subtype ?? '').toLowerCase() !== filters.subtype.toLowerCase()
    ) {
      return false
    }
    if (filters.tags.length > 0) {
      const itemTags = new Set((metadata?.tags ?? []).map((tag) => tag.toLowerCase()))
      if (!filters.tags.some((tag) => itemTags.has(tag.toLowerCase()))) return false
    }
    if (filters.minPower !== null || filters.maxPower !== null) {
      const power = metadata?.powerLevel
      if (power === undefined) return false
      if (filters.minPower !== null && power < filters.minPower) return false
      if (filters.maxPower !== null && power > filters.maxPower) return false
    }
    return true
  })
}

function compareName(a: Schematic, b: Schematic): number {
  return collator.compare(a.name, b.name) || collator.compare(a.id, b.id)
}

const rarityRank: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
  mythic: 6,
}

export function sortSchematics(items: Schematic[], sortKey: SortKey): Schematic[] {
  const sorted = [...items]
  sorted.sort((a, b) => {
    switch (sortKey) {
      case 'name-desc':
        return -compareName(a, b)
      case 'filename':
        return collator.compare(a.file, b.file) || compareName(a, b)
      case 'category':
        return (
          CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] ||
          compareName(a, b)
        )
      case 'favorites-first':
        return Number(b.isFavorite) - Number(a.isFavorite) || compareName(a, b)
      case 'power-desc':
        return (
          (b.metadata?.powerLevel ?? -1) - (a.metadata?.powerLevel ?? -1) ||
          compareName(a, b)
        )
      case 'rarity-desc':
        return (
          (b.metadata?.rarity ? rarityRank[b.metadata.rarity] : 0) -
            (a.metadata?.rarity ? rarityRank[a.metadata.rarity] : 0) ||
          compareName(a, b)
        )
      case 'name-asc':
      default:
        return compareName(a, b)
    }
  })
  return sorted
}

export function categoryCounts(items: Schematic[]): Record<SchematicCategory | 'total', number> {
  const counts: Record<SchematicCategory | 'total', number> = {
    total: items.length,
    traps: 0,
    melee: 0,
    guns: 0,
  }
  for (const item of items) counts[item.category] += 1
  return counts
}

export function emptyFilters(): Filters {
  return {
    category: 'any',
    favoritesOnly: false,
    hasMetadataOnly: false,
    tags: [],
    rarity: 'any',
    element: 'any',
    subtype: 'any',
    minPower: null,
    maxPower: null,
  }
}

export function countCategoryItems(items: Schematic[], category: SchematicCategory): number {
  return items.reduce((count, item) => (item.category === category ? count + 1 : count), 0)
}

export function categoryLabel(category: SchematicCategory): string {
  return CATEGORY_INFO[category].label
}

export function categoriesList(): readonly SchematicCategory[] {
  return CATEGORIES
}
