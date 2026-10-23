export const CATEGORIES = ['traps', 'melee', 'guns'] as const
export type SchematicCategory = (typeof CATEGORIES)[number]

export const RARITIES = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
] as const
export type Rarity = (typeof RARITIES)[number]

export const ELEMENTS = ['physical', 'fire', 'water', 'nature', 'energy'] as const
export type Element = (typeof ELEMENTS)[number]

export const DISPLAY_MODES = ['comfortable', 'compact', 'list'] as const
export type DisplayMode = (typeof DISPLAY_MODES)[number]

export const MAIN_VIEWS = ['all', 'traps', 'melee', 'guns', 'favorites'] as const
export type MainView = (typeof MAIN_VIEWS)[number]

export const SORT_KEYS = [
  'name-asc',
  'name-desc',
  'category',
  'filename',
  'favorites-first',
  'power-desc',
  'rarity-desc',
] as const
export type SortKey = (typeof SORT_KEYS)[number]

export interface ManifestImage {
  id: string
  category: SchematicCategory
  file: string
  extension: string
  displayName: string
  url: string
  thumbnailUrl: string | null
  width: number | null
  height: number | null
}

export interface SchematicManifest {
  generatedAt: string
  counts: Record<'total' | SchematicCategory, number>
  images: ManifestImage[]
}

export interface SchematicMetadata {
  id: string
  displayName?: string
  categoryOverride?: SchematicCategory
  rarity?: Rarity
  powerLevel?: number
  element?: Element
  subtype?: string
  perks?: string
  tags?: string[]
  notes?: string
  updatedAt: string
}

export type MetadataMap = Record<string, SchematicMetadata>

export interface Preferences {
  displayMode: DisplayMode
  defaultView: MainView
  wheelZoom: boolean
  reducedMotion: boolean
}

export interface VaultData {
  schemaVersion: number
  metadata: MetadataMap
  favorites: string[]
  preferences: Preferences
}

export interface Schematic {
  id: string
  file: string
  url: string
  thumbnailUrl: string | null
  sourceCategory: SchematicCategory
  category: SchematicCategory
  name: string
  derivedName: string
  metadata: SchematicMetadata | null
  isFavorite: boolean
}

export interface Filters {
  category: 'any' | SchematicCategory
  favoritesOnly: boolean
  hasMetadataOnly: boolean
  tags: string[]
  rarity: 'any' | Rarity
  element: 'any' | Element
  subtype: 'any' | string
  minPower: number | null
  maxPower: number | null
}

export interface Facets {
  tags: string[]
  rarities: Rarity[]
  elements: Element[]
  subtypes: string[]
  hasPowerLevels: boolean
  hasAnyMetadata: boolean
}

export interface BackupFile {
  format: 'stw-schematic-vault-backup'
  version: number
  app: string
  exportedAt: string
  metadata: MetadataMap
  favorites: string[]
  preferences: Preferences
}

export interface OrphanRecord {
  id: string
  fileName: string
  metadata: SchematicMetadata
}
