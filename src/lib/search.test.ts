import { describe, expect, it } from 'vitest'
import type { Schematic, SchematicCategory } from '../types'
import {
  activeFilterCount,
  applyFilters,
  createSearchMatcher,
  emptyFilters,
  getFacets,
  hasActiveCriteria,
  normalizeSearchText,
  sortSchematics,
  viewScope,
} from './search'

function item(
  id: string,
  category: SchematicCategory,
  overrides: Partial<Schematic> = {},
): Schematic {
  const file = overrides.file ?? `${id.replace('/', '_')}.png`
  return {
    id,
    file,
    url: `/schematics/${id}`,
    thumbnailUrl: null,
    sourceCategory: category,
    category,
    name: overrides.name ?? file,
    derivedName: overrides.derivedName ?? overrides.name ?? file,
    metadata: overrides.metadata ?? null,
    isFavorite: overrides.isFavorite ?? false,
    ...overrides,
  }
}

const hydra = item('guns/hydra.png', 'guns', {
  name: 'Hydra',
  metadata: {
    id: 'guns/hydra.png',
    rarity: 'legendary',
    element: 'fire',
    subtype: 'Shotgun',
    powerLevel: 130,
    tags: ['boss', 'solo'],
    notes: 'Good against mist monsters',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
})

const wallDarts = item('traps/wall-darts.png', 'traps', {
  name: 'Wall Darts',
  metadata: {
    id: 'traps/wall-darts.png',
    rarity: 'epic',
    subtype: 'Wall trap',
    powerLevel: 77,
    tags: ['trap'],
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
})

const bare = item('melee/bare.png', 'melee', {
  name: 'Screenshot 2026-10-23 14:27:33',
  isFavorite: true,
})

describe('normalizeSearchText', () => {
  it('normalizes case, diacritics, and punctuation into word gaps', () => {
    expect(normalizeSearchText('  Crème—Brûlée!!  ')).toBe('creme brulee')
    expect(normalizeSearchText('Screenshot_20261023_142733')).toBe(
      'screenshot 20261023 142733',
    )
  })
})

describe('createSearchMatcher', () => {
  it('matches across name, filename, metadata, and compact tokens', () => {
    expect(createSearchMatcher('hydra')(hydra)).toBe(true)
    expect(createSearchMatcher('guns hydra png')(hydra)).toBe(true)
    expect(createSearchMatcher('legendary fire boss')(hydra)).toBe(true)
    expect(createSearchMatcher('mist')(hydra)).toBe(true)
  })

  it('supports compact matching for split words', () => {
    const split = item('guns/shot-gun.png', 'guns', { name: 'Shot Gun' })
    expect(createSearchMatcher('shotgun')(split)).toBe(true)
  })

  it('returns a pass-through matcher for blank queries', () => {
    expect(createSearchMatcher('   ')(bare)).toBe(true)
  })
})

describe('viewScope', () => {
  it('scopes categories, favorites, and all items', () => {
    const all = [hydra, wallDarts, bare]
    expect(viewScope(all, 'all')).toHaveLength(3)
    expect(viewScope(all, 'guns')).toEqual([hydra])
    expect(viewScope(all, 'favorites')).toEqual([bare])
  })
})

describe('applyFilters', () => {
  it('matches any selected tag, not all tags', () => {
    const filters = { ...emptyFilters(), tags: ['boss', 'trap'] }
    const result = applyFilters([hydra, wallDarts, bare], filters, 'all')
    expect(result.map((entry) => entry.name)).toEqual(['Hydra', 'Wall Darts'])
  })

  it('supports classification, power, and metadata filters', () => {
    const filters = {
      ...emptyFilters(),
      rarity: 'legendary' as const,
      element: 'fire' as const,
      subtype: 'Shotgun',
      minPower: 100,
      maxPower: 150,
      hasMetadataOnly: true,
    }
    expect(applyFilters([hydra, wallDarts, bare], filters, 'all')).toEqual([hydra])
  })

  it('filters favorites and respects category views', () => {
    expect(applyFilters([hydra, bare], emptyFilters(), 'favorites')).toEqual([bare])
    expect(
      applyFilters([hydra, bare], { ...emptyFilters(), category: 'guns' }, 'all'),
    ).toEqual([hydra])
    expect(
      applyFilters([hydra, bare], { ...emptyFilters(), category: 'guns' }, 'melee'),
    ).toEqual([bare])
  })
})

describe('sortSchematics', () => {
  it('sorts names with numeric awareness in both directions', () => {
    const ten = item('guns/ten.png', 'guns', { name: 'Alpha 10' })
    const two = item('guns/two.png', 'guns', { name: 'Alpha 2' })
    const beta = item('guns/beta.png', 'guns', { name: 'Beta' })
    const source = [ten, beta, two]

    expect(sortSchematics(source, 'name-asc').map((entry) => entry.name)).toEqual([
      'Alpha 2',
      'Alpha 10',
      'Beta',
    ])
    expect(sortSchematics(source, 'name-desc').map((entry) => entry.name)).toEqual([
      'Beta',
      'Alpha 10',
      'Alpha 2',
    ])
  })

  it('sorts category, favorites, power, and rarity', () => {
    const source = [hydra, wallDarts, bare]
    expect(sortSchematics(source, 'category').map((entry) => entry.category)).toEqual([
      'traps',
      'melee',
      'guns',
    ])
    expect(sortSchematics(source, 'favorites-first')[0]).toBe(bare)
    expect(sortSchematics(source, 'power-desc')[0]).toBe(hydra)
    expect(sortSchematics(source, 'rarity-desc')[0]).toBe(hydra)
  })
})

describe('facets and criteria', () => {
  it('collects unique tags and only available classifications', () => {
    const facets = getFacets([hydra, wallDarts, bare])
    expect(facets.tags).toEqual(['boss', 'solo', 'trap'])
    expect(facets.rarities).toEqual(['epic', 'legendary'])
    expect(facets.elements).toEqual(['fire'])
    expect(facets.subtypes).toEqual(['Shotgun', 'Wall trap'])
    expect(facets.hasPowerLevels).toBe(true)
    expect(facets.hasAnyMetadata).toBe(true)
  })

  it('counts and detects active criteria', () => {
    const filters = { ...emptyFilters(), tags: ['boss'], minPower: 100 }
    expect(activeFilterCount(filters, 'all')).toBe(2)
    expect(hasActiveCriteria(filters, 'all', '')).toBe(true)
    expect(hasActiveCriteria(emptyFilters(), 'traps', 'hydra')).toBe(true)
    expect(hasActiveCriteria(emptyFilters(), 'traps', '')).toBe(false)
  })
})
