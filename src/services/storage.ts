import type { DisplayMode, MainView, Preferences, VaultData } from '../types'
import { DISPLAY_MODES, MAIN_VIEWS } from '../types'
import { sanitizeMetadataMap } from '../lib/metadata'

export const STORAGE_KEY = 'stw-schematic-vault:data'
export const SCHEMA_VERSION = 1

export const DEFAULT_PREFERENCES: Preferences = {
  displayMode: 'comfortable',
  defaultView: 'all',
  wheelZoom: true,
  reducedMotion: false,
}

export interface LoadResult {
  data: VaultData
  fatalError: string | null
  warnings: string[]
  recoveryKey: string | null
  blockWrites: boolean
}

export function defaultVaultData(): VaultData {
  return {
    schemaVersion: SCHEMA_VERSION,
    metadata: {},
    favorites: [],
    preferences: { ...DEFAULT_PREFERENCES },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function sanitizePreferences(raw: unknown): Preferences {
  if (!isRecord(raw)) return { ...DEFAULT_PREFERENCES }
  return {
    displayMode: (DISPLAY_MODES as readonly string[]).includes(String(raw.displayMode))
      ? (raw.displayMode as DisplayMode)
      : DEFAULT_PREFERENCES.displayMode,
    defaultView: (MAIN_VIEWS as readonly string[]).includes(String(raw.defaultView))
      ? (raw.defaultView as MainView)
      : DEFAULT_PREFERENCES.defaultView,
    wheelZoom:
      typeof raw.wheelZoom === 'boolean' ? raw.wheelZoom : DEFAULT_PREFERENCES.wheelZoom,
    reducedMotion:
      typeof raw.reducedMotion === 'boolean'
        ? raw.reducedMotion
        : DEFAULT_PREFERENCES.reducedMotion,
  }
}

export function sanitizeFavorites(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const favorites: string[] = []
  for (const value of raw) {
    if (typeof value !== 'string') continue
    const id = value.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    favorites.push(id)
    if (favorites.length >= 100_000) break
  }
  return favorites
}

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

function archiveCorruptRaw(raw: string): string | null {
  const storage = getStorage()
  if (!storage) return null
  const key = `${STORAGE_KEY}:recovery:${Date.now()}`
  try {
    storage.setItem(key, raw)
    return key
  } catch {
    return null
  }
}

export function loadVault(): LoadResult {
  const storage = getStorage()
  const data = defaultVaultData()
  const warnings: string[] = []

  if (!storage) {
    return {
      data,
      fatalError: 'Browser storage is unavailable. Changes will not be saved on this device.',
      warnings,
      recoveryKey: null,
      blockWrites: false,
    }
  }

  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return {
      data,
      fatalError: 'Saved data could not be read because browser storage is blocked.',
      warnings,
      recoveryKey: null,
      blockWrites: false,
    }
  }

  if (!raw) return { data, fatalError: null, warnings, recoveryKey: null, blockWrites: false }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    const recoveryKey = archiveCorruptRaw(raw)
    return {
      data,
      fatalError: recoveryKey
        ? `Saved data was corrupted and could not be loaded. The original data was archived as "${recoveryKey}".`
        : 'Saved data was corrupted and could not be loaded.',
      warnings,
      recoveryKey,
      blockWrites: false,
    }
  }

  if (!isRecord(parsed)) {
    const recoveryKey = archiveCorruptRaw(raw)
    return {
      data,
      fatalError: recoveryKey
        ? `Saved data had an unexpected format. The original data was archived as "${recoveryKey}".`
        : 'Saved data had an unexpected format.',
      warnings,
      recoveryKey,
      blockWrites: false,
    }
  }

  const version = Number(parsed.schemaVersion)
  if (!Number.isInteger(version) || version < 1) {
    const recoveryKey = archiveCorruptRaw(raw)
    return {
      data,
      fatalError: recoveryKey
        ? `Saved data did not include a valid schema version. The original data was archived as "${recoveryKey}".`
        : 'Saved data did not include a valid schema version.',
      warnings,
      recoveryKey,
      blockWrites: false,
    }
  }

  if (version > SCHEMA_VERSION) {
    return {
      data,
      fatalError:
        'Saved data was created by a newer version of this app. It was left untouched so you can open it with that version. Changes in this session will not overwrite it.',
      warnings,
      recoveryKey: null,
      blockWrites: true,
    }
  }

  const { metadata, skipped } = sanitizeMetadataMap(parsed.metadata)
  if (skipped > 0) {
    warnings.push(`${skipped} saved metadata ${skipped === 1 ? 'record was' : 'records were'} invalid and skipped.`)
  }

  const favorites = sanitizeFavorites(parsed.favorites)
  const preferences = sanitizePreferences(parsed.preferences)

  return {
    data: { schemaVersion: SCHEMA_VERSION, metadata, favorites, preferences },
    fatalError: null,
    warnings,
    recoveryKey: null,
    blockWrites: false,
  }
}

export function saveVault(data: VaultData): string | null {
  const storage = getStorage()
  if (!storage) {
    return 'Browser storage is unavailable. Your changes were not saved.'
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
    return null
  } catch (error) {
    if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
      return 'Browser storage is full. Your changes were not saved. Export a backup and clear old data.'
    }
    return 'Browser storage rejected the save. Your changes were not saved.'
  }
}

export function clearVaultStorage(): string | null {
  const storage = getStorage()
  if (!storage) return 'Browser storage is unavailable.'
  try {
    storage.removeItem(STORAGE_KEY)
    return null
  } catch {
    return 'Browser storage could not be cleared.'
  }
}
