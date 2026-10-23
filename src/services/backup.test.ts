import { describe, expect, it } from 'vitest'
import type { VaultData } from '../types'
import { DEFAULT_PREFERENCES, SCHEMA_VERSION } from './storage'
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  applyBackup,
  backupFileName,
  createBackup,
  validateBackupText,
} from './backup'

const knownIds = new Set(['guns/hydra.png', 'traps/darts.png'])

function vault(overrides: Partial<VaultData> = {}): VaultData {
  return {
    schemaVersion: SCHEMA_VERSION,
    metadata: {
      'guns/hydra.png': {
        id: 'guns/hydra.png',
        displayName: 'Hydra',
        rarity: 'legendary',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    },
    favorites: ['guns/hydra.png'],
    preferences: { ...DEFAULT_PREFERENCES },
    ...overrides,
  }
}

function backupJson(overrides: Record<string, unknown>): string {
  return JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    app: 'STW Schematic Vault',
    exportedAt: '2026-01-02T00:00:00.000Z',
    metadata: {},
    favorites: [],
    preferences: DEFAULT_PREFERENCES,
    ...overrides,
  })
}

describe('createBackup', () => {
  it('wraps vault data with format metadata and no image data', () => {
    const backup = createBackup(vault())
    expect(backup.format).toBe(BACKUP_FORMAT)
    expect(backup.version).toBe(BACKUP_VERSION)
    expect(backup.metadata['guns/hydra.png'].displayName).toBe('Hydra')
    expect(JSON.stringify(backup)).not.toContain('/schematics/')
  })

  it('creates a dated filename', () => {
    expect(backupFileName(new Date('2026-10-23T12:00:00.000Z'))).toBe(
      'stw-schematic-vault-backup-2026-10-23.json',
    )
  })
})

describe('validateBackupText', () => {
  it('accepts a valid backup and reports counts', () => {
    const result = validateBackupText(
      backupJson({
        metadata: {
          'guns/hydra.png': { displayName: 'Hydra', tags: ['Boss', 'boss'] },
          'unknown/image.png': { displayName: 'Missing' },
        },
        favorites: ['guns/hydra.png', 'guns/hydra.png', 12],
      }),
      knownIds,
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.preview.metadataCount).toBe(2)
    expect(result.preview.favoriteCount).toBe(1)
    expect(result.preview.missingImageCount).toBe(1)
    expect(result.preview.warnings).toContain(
      'Duplicate or invalid favorite entries were removed.',
    )
    expect(result.preview.backup.metadata['guns/hydra.png'].tags).toEqual(['Boss'])
  })

  it('rejects malformed JSON and foreign files', () => {
    expect(validateBackupText('{', knownIds)).toEqual({
      ok: false,
      error: 'The file is not valid JSON.',
    })
    expect(
      validateBackupText(JSON.stringify({ format: 'something-else' }), knownIds),
    ).toMatchObject({ ok: false })
  })

  it('rejects unsupported future versions', () => {
    const result = validateBackupText(
      backupJson({ version: BACKUP_VERSION + 1 }),
      knownIds,
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('format version')
  })

  it('rejects invalid container fields', () => {
    expect(validateBackupText(backupJson({ metadata: [] }), knownIds)).toMatchObject({
      ok: false,
      error: 'The backup is missing its metadata records.',
    })
    expect(validateBackupText(backupJson({ favorites: 'nope' }), knownIds)).toMatchObject({
      ok: false,
      error: 'The backup is missing its favorites list.',
    })
  })

  it('warns when preferences are absent', () => {
    const result = validateBackupText(backupJson({ preferences: null }), knownIds)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.preview.warnings).toContain(
      'Preferences were missing and will use the defaults.',
    )
    expect(result.preview.backup.preferences.wheelZoom).toBe(true)
  })

  it('caps oversized files', () => {
    const result = validateBackupText('x'.repeat(8_000_001), knownIds)
    expect(result).toMatchObject({
      ok: false,
      error: 'That file is too large to be a metadata backup (8 MB limit).',
    })
  })
})

describe('applyBackup', () => {
  const imported = createBackup({
    schemaVersion: SCHEMA_VERSION,
    metadata: {
      'traps/darts.png': {
        id: 'traps/darts.png',
        displayName: 'Darts',
        updatedAt: '2026-02-01T00:00:00.000Z',
      },
      'guns/hydra.png': {
        id: 'guns/hydra.png',
        displayName: 'Imported Hydra',
        updatedAt: '2026-02-01T00:00:00.000Z',
      },
    },
    favorites: ['traps/darts.png'],
    preferences: { ...DEFAULT_PREFERENCES, displayMode: 'list' },
  })

  it('merges metadata and combines favorites while keeping preferences', () => {
    const result = applyBackup(vault(), imported, 'merge')
    expect(result.data.metadata['guns/hydra.png'].displayName).toBe('Imported Hydra')
    expect(result.data.metadata['traps/darts.png'].displayName).toBe('Darts')
    expect(result.data.favorites.sort()).toEqual(['guns/hydra.png', 'traps/darts.png'])
    expect(result.data.preferences.displayMode).toBe(DEFAULT_PREFERENCES.displayMode)
  })

  it('replaces metadata, favorites, and preferences', () => {
    const result = applyBackup(vault(), imported, 'replace')
    expect(Object.keys(result.data.metadata)).toEqual(['traps/darts.png', 'guns/hydra.png'])
    expect(result.data.favorites).toEqual(['traps/darts.png'])
    expect(result.data.preferences.displayMode).toBe('list')
  })
})
