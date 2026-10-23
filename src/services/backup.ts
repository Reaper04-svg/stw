import type { BackupFile, Preferences, VaultData } from '../types'
import { sanitizeMetadataMap } from '../lib/metadata'
import {
  DEFAULT_PREFERENCES,
  SCHEMA_VERSION,
  sanitizeFavorites,
  sanitizePreferences,
} from './storage'

export const BACKUP_FORMAT = 'stw-schematic-vault-backup' as const
export const BACKUP_VERSION = 1

export function createBackup(data: VaultData): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    app: 'STW Schematic Vault',
    exportedAt: new Date().toISOString(),
    metadata: data.metadata,
    favorites: data.favorites,
    preferences: data.preferences,
  }
}

export function backupFileName(date = new Date()): string {
  const iso = date.toISOString().slice(0, 10)
  return `stw-schematic-vault-backup-${iso}.json`
}

export interface ImportPreview {
  backup: BackupFile
  metadataCount: number
  favoriteCount: number
  missingImageCount: number
  warnings: string[]
}

export type BackupValidation =
  | { ok: true; preview: ImportPreview }
  | { ok: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateBackupText(text: string, knownImageIds: Set<string>): BackupValidation {
  if (text.length > 8_000_000) {
    return { ok: false, error: 'That file is too large to be a metadata backup (8 MB limit).' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' }
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: 'The backup must contain a JSON object.' }
  }

  if (parsed.format !== BACKUP_FORMAT) {
    return {
      ok: false,
      error: 'This is not an STW Schematic Vault backup. The file format marker is missing or different.',
    }
  }

  const version = Number(parsed.version)
  if (!Number.isInteger(version) || version < 1) {
    return { ok: false, error: 'The backup version is missing or invalid.' }
  }
  if (version > BACKUP_VERSION) {
    return {
      ok: false,
      error: `This backup uses format version ${version}, but this app supports up to version ${BACKUP_VERSION}. Update the app to import it.`,
    }
  }

  if (!isRecord(parsed.metadata)) {
    return { ok: false, error: 'The backup is missing its metadata records.' }
  }
  if (!Array.isArray(parsed.favorites)) {
    return { ok: false, error: 'The backup is missing its favorites list.' }
  }
  if (Object.keys(parsed.metadata).length > 100_000) {
    return { ok: false, error: 'The backup contains too many metadata records.' }
  }

  const warnings: string[] = []
  const { metadata, skipped } = sanitizeMetadataMap(parsed.metadata)
  if (skipped > 0) {
    warnings.push(
      `${skipped} invalid metadata ${skipped === 1 ? 'record was' : 'records were'} skipped.`,
    )
  }

  const favorites = sanitizeFavorites(parsed.favorites)
  if (favorites.length !== parsed.favorites.length) {
    warnings.push('Duplicate or invalid favorite entries were removed.')
  }

  let preferences: Preferences = { ...DEFAULT_PREFERENCES }
  if (isRecord(parsed.preferences)) {
    preferences = sanitizePreferences(parsed.preferences)
  } else {
    warnings.push('Preferences were missing and will use the defaults.')
  }

  const known = knownImageIds
  const missingImageCount = Object.keys(metadata).filter((id) => !known.has(id)).length

  const backup: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    app: typeof parsed.app === 'string' ? parsed.app : 'STW Schematic Vault',
    exportedAt:
      typeof parsed.exportedAt === 'string' && !Number.isNaN(Date.parse(parsed.exportedAt))
        ? parsed.exportedAt
        : new Date().toISOString(),
    metadata,
    favorites,
    preferences,
  }

  return {
    ok: true,
    preview: {
      backup,
      metadataCount: Object.keys(metadata).length,
      favoriteCount: favorites.length,
      missingImageCount,
      warnings,
    },
  }
}

export type ImportMode = 'merge' | 'replace'

export interface ApplyImportResult {
  data: VaultData
  orphanCount: number
}

export function applyBackup(
  current: VaultData,
  backup: BackupFile,
  mode: ImportMode,
): ApplyImportResult {
  const metadata =
    mode === 'merge' ? { ...current.metadata, ...backup.metadata } : { ...backup.metadata }
  const favorites =
    mode === 'merge'
      ? [...new Set([...current.favorites, ...backup.favorites])]
      : [...backup.favorites]
  const preferences = mode === 'replace' ? { ...backup.preferences } : { ...current.preferences }

  const data: VaultData = {
    schemaVersion: SCHEMA_VERSION,
    metadata,
    favorites,
    preferences,
  }

  return { data, orphanCount: 0 }
}
