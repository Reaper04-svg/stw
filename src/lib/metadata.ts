import type { Element, MetadataMap, Rarity, SchematicCategory, SchematicMetadata } from '../types'
import { CATEGORIES, ELEMENTS, RARITIES } from '../types'

const LIMITS = {
  displayName: 120,
  subtype: 80,
  perks: 4000,
  notes: 8000,
  tag: 40,
  tags: 24,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().replace(/\r\n/g, '\n')
  if (!trimmed) return undefined
  return trimmed.slice(0, maxLength)
}

export function isCategory(value: unknown): value is SchematicCategory {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value)
}

export function isRarity(value: unknown): value is Rarity {
  return typeof value === 'string' && (RARITIES as readonly string[]).includes(value)
}

export function isElement(value: unknown): value is Element {
  return typeof value === 'string' && (ELEMENTS as readonly string[]).includes(value)
}

export function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const tags: string[] = []
  for (const value of raw) {
    if (typeof value !== 'string') continue
    const tag = value.trim().replace(/\s+/g, ' ').slice(0, LIMITS.tag)
    if (!tag) continue
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    tags.push(tag)
    if (tags.length >= LIMITS.tags) break
  }
  return tags
}

export function powerLevelOrNull(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) return undefined
  const rounded = Math.round(number)
  if (rounded < 1 || rounded > 999) return undefined
  return rounded
}

export function sanitizeMetadata(raw: unknown, fallbackId: string): SchematicMetadata | null {
  if (!isRecord(raw)) return null
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : fallbackId
  const record: SchematicMetadata = {
    id,
    updatedAt:
      typeof raw.updatedAt === 'string' && !Number.isNaN(Date.parse(raw.updatedAt))
        ? raw.updatedAt
        : new Date().toISOString(),
  }

  const displayName = cleanString(raw.displayName, LIMITS.displayName)
  if (displayName) record.displayName = displayName

  if (isCategory(raw.categoryOverride)) record.categoryOverride = raw.categoryOverride
  if (isRarity(raw.rarity)) record.rarity = raw.rarity
  if (isElement(raw.element)) record.element = raw.element

  const powerLevel = powerLevelOrNull(raw.powerLevel)
  if (powerLevel !== undefined) record.powerLevel = powerLevel

  const subtype = cleanString(raw.subtype, LIMITS.subtype)
  if (subtype) record.subtype = subtype

  const perks = cleanString(raw.perks, LIMITS.perks)
  if (perks) record.perks = perks

  const notes = cleanString(raw.notes, LIMITS.notes)
  if (notes) record.notes = notes

  const tags = normalizeTags(raw.tags)
  if (tags.length > 0) record.tags = tags

  return hasMetadataContent(record) ? record : null
}

export function hasMetadataContent(metadata: SchematicMetadata | null | undefined): boolean {
  if (!metadata) return false
  return Boolean(
    metadata.displayName ||
      metadata.categoryOverride ||
      metadata.rarity ||
      metadata.powerLevel !== undefined ||
      metadata.element ||
      metadata.subtype ||
      metadata.perks ||
      metadata.notes ||
      (metadata.tags && metadata.tags.length > 0),
  )
}

export function sanitizeMetadataMap(raw: unknown): { metadata: MetadataMap; skipped: number } {
  if (!isRecord(raw)) return { metadata: {}, skipped: 0 }
  const metadata: MetadataMap = {}
  let skipped = 0
  for (const [key, value] of Object.entries(raw)) {
    const record = sanitizeMetadata(value, key)
    if (record) metadata[record.id] = record
    else skipped += 1
  }
  return { metadata, skipped }
}

export function emptyMetadata(id: string): SchematicMetadata {
  return { id, updatedAt: new Date().toISOString() }
}

export function tagsFromRecords(records: Iterable<SchematicMetadata>): string[] {
  const seen = new Map<string, string>()
  for (const record of records) {
    for (const tag of record.tags ?? []) {
      const key = tag.toLowerCase()
      if (!seen.has(key)) seen.set(key, tag)
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}
