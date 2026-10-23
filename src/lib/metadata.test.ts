import { describe, expect, it } from 'vitest'
import {
  hasMetadataContent,
  normalizeTags,
  powerLevelOrNull,
  sanitizeMetadata,
  sanitizeMetadataMap,
  tagsFromRecords,
} from './metadata'

describe('normalizeTags', () => {
  it('trims, collapses whitespace, deduplicates case-insensitively, and caps length', () => {
    const tags = normalizeTags([
      '  Boss  ',
      'boss',
      'Solo   Target',
      '',
      null,
      12,
      'x'.repeat(60),
      ...Array.from({ length: 30 }, (_, index) => `tag-${index}`),
    ])
    expect(tags[0]).toBe('Boss')
    expect(tags[1]).toBe('Solo Target')
    expect(tags).toHaveLength(24)
    expect(tags[2]).toHaveLength(40)
  })

  it('returns an empty list for non-arrays', () => {
    expect(normalizeTags('boss')).toEqual([])
    expect(normalizeTags(null)).toEqual([])
  })
})

describe('powerLevelOrNull', () => {
  it('rounds and bounds valid values', () => {
    expect(powerLevelOrNull('130')).toBe(130)
    expect(powerLevelOrNull(12.6)).toBe(13)
    expect(powerLevelOrNull(0)).toBeUndefined()
    expect(powerLevelOrNull(1000)).toBeUndefined()
    expect(powerLevelOrNull('not a number')).toBeUndefined()
  })
})

describe('sanitizeMetadata', () => {
  it('normalizes a complete record', () => {
    const record = sanitizeMetadata(
      {
        id: 'guns/hydra.png',
        displayName: '  Hydra  ',
        categoryOverride: 'traps',
        rarity: 'legendary',
        element: 'fire',
        powerLevel: '130.4',
        subtype: ' Shotgun ',
        perks: '  Crit damage  ',
        notes: '  Good boss gun  ',
        tags: ['Boss', 'boss', 'Solo'],
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      'fallback',
    )

    expect(record).toMatchObject({
      id: 'guns/hydra.png',
      displayName: 'Hydra',
      categoryOverride: 'traps',
      rarity: 'legendary',
      element: 'fire',
      powerLevel: 130,
      subtype: 'Shotgun',
      perks: 'Crit damage',
      notes: 'Good boss gun',
      tags: ['Boss', 'Solo'],
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
  })

  it('drops invalid enum values and empty-only records', () => {
    expect(
      sanitizeMetadata(
        {
          displayName: '   ',
          categoryOverride: 'invalid',
          rarity: 'invalid',
          element: 'invalid',
          powerLevel: 1000,
          tags: [],
        },
        'guns/a.png',
      ),
    ).toBeNull()
  })

  it('uses the fallback id and generates a timestamp when missing', () => {
    const record = sanitizeMetadata({ displayName: 'Fallback' }, 'melee/a.png')
    expect(record?.id).toBe('melee/a.png')
    expect(Number.isNaN(Date.parse(record?.updatedAt ?? ''))).toBe(false)
  })
})

describe('sanitizeMetadataMap', () => {
  it('keeps valid records, skips empty ones, and reports the count', () => {
    const { metadata, skipped } = sanitizeMetadataMap({
      'guns/a.png': { displayName: 'A' },
      'guns/b.png': { displayName: '   ' },
      'guns/c.png': { rarity: 'epic' },
    })
    expect(Object.keys(metadata)).toEqual(['guns/a.png', 'guns/c.png'])
    expect(skipped).toBe(1)
  })

  it('gracefully handles non-object input', () => {
    expect(sanitizeMetadataMap(null)).toEqual({ metadata: {}, skipped: 0 })
    expect(sanitizeMetadataMap([])).toEqual({ metadata: {}, skipped: 0 })
  })
})

describe('hasMetadataContent', () => {
  it('ignores identity-only records', () => {
    expect(hasMetadataContent(null)).toBe(false)
    expect(
      hasMetadataContent({ id: 'a', updatedAt: '2026-01-01T00:00:00.000Z' }),
    ).toBe(false)
    expect(
      hasMetadataContent({
        id: 'a',
        updatedAt: '2026-01-01T00:00:00.000Z',
        powerLevel: 1,
      }),
    ).toBe(true)
  })
})

describe('tagsFromRecords', () => {
  it('combines tags with case-insensitive uniqueness and stable sorting', () => {
    expect(
      tagsFromRecords([
        { id: 'a', updatedAt: '2026-01-01T00:00:00.000Z', tags: ['Zeta', 'alpha'] },
        { id: 'b', updatedAt: '2026-01-01T00:00:00.000Z', tags: ['Alpha', 'beta'] },
      ]),
    ).toEqual(['alpha', 'beta', 'Zeta'])
  })
})
