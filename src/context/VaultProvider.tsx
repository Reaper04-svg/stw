import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  BackupFile,
  MainView,
  MetadataMap,
  OrphanRecord,
  Preferences,
  Schematic,
  SchematicMetadata,
  VaultData,
} from '../types'
import { manifestImages, manifestIds } from '../data/manifest'
import { hasMetadataContent, sanitizeMetadata } from '../lib/metadata'
import { categoryCounts, getFacets } from '../lib/search'
import { applyBackup, createBackup, type ImportMode } from '../services/backup'
import {
  DEFAULT_PREFERENCES,
  SCHEMA_VERSION,
  clearVaultStorage,
  loadVault,
  saveVault,
} from '../services/storage'
import { VaultContext, type VaultContextValue } from './vault-context'

function buildVaultData(
  metadata: MetadataMap,
  favorites: ReadonlySet<string>,
  preferences: Preferences,
): VaultData {
  return {
    schemaVersion: SCHEMA_VERSION,
    metadata,
    favorites: [...favorites],
    preferences,
  }
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => loadVault())
  const [metadata, setMetadata] = useState<MetadataMap>(initial.data.metadata)
  const [favorites, setFavorites] = useState<ReadonlySet<string>>(
    () => new Set(initial.data.favorites),
  )
  const [preferences, setPreferences] = useState<Preferences>(initial.data.preferences)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [startupWarning, setStartupWarning] = useState<string | null>(initial.fatalError)
  const [writesBlocked, setWritesBlocked] = useState(initial.blockWrites)
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    if (writesBlocked) return
    const error = saveVault(buildVaultData(metadata, favorites, preferences))
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage errors must be surfaced after each write
    setSaveError(error)
  }, [metadata, favorites, preferences, writesBlocked])

  const schematics = useMemo<Schematic[]>(() => {
    return manifestImages.map((image) => {
      const record = metadata[image.id] ?? null
      return {
        id: image.id,
        file: image.file,
        url: image.url,
        thumbnailUrl: image.thumbnailUrl,
        sourceCategory: image.category,
        category: record?.categoryOverride ?? image.category,
        name: record?.displayName?.trim() || image.displayName,
        derivedName: image.displayName,
        metadata: record,
        isFavorite: favorites.has(image.id),
      }
    })
  }, [metadata, favorites])

  const counts = useMemo(() => categoryCounts(schematics), [schematics])

  const favoritesCount = useMemo(
    () => schematics.reduce((count, item) => (item.isFavorite ? count + 1 : count), 0),
    [schematics],
  )

  const metadataCount = useMemo(
    () => schematics.reduce((count, item) => (hasMetadataContent(item.metadata) ? count + 1 : count), 0),
    [schematics],
  )

  const orphans = useMemo<OrphanRecord[]>(() => {
    return Object.entries(metadata)
      .filter(([id]) => !manifestIds.has(id))
      .map(([id, record]) => ({
        id,
        fileName: id.split('/').pop() ?? id,
        metadata: record,
      }))
      .sort((a, b) => a.fileName.localeCompare(b.fileName))
  }, [metadata])

  const facets = useMemo(() => getFacets(schematics), [schematics])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const updateMetadata = useCallback((id: string, draft: SchematicMetadata) => {
    setMetadata((current) => {
      const record = sanitizeMetadata(
        { ...draft, id, updatedAt: new Date().toISOString() },
        id,
      )
      const next = { ...current }
      if (record) next[id] = record
      else delete next[id]
      return next
    })
  }, [])

  const removeMetadata = useCallback((id: string) => {
    setMetadata((current) => {
      if (!(id in current)) return current
      const next = { ...current }
      delete next[id]
      return next
    })
  }, [])

  const removeOrphan = useCallback((id: string) => {
    if (manifestIds.has(id)) return
    removeMetadata(id)
  }, [removeMetadata])

  const clearAllMetadata = useCallback(() => {
    setMetadata({})
  }, [])

  const clearPreferences = useCallback(() => {
    setPreferences({ ...DEFAULT_PREFERENCES })
  }, [])

  const resetAllData = useCallback(() => {
    clearVaultStorage()
    setMetadata({})
    setFavorites(new Set())
    setPreferences({ ...DEFAULT_PREFERENCES })
    setWritesBlocked(false)
    setStartupWarning(null)
    setSaveError(null)
  }, [])

  const setPreference = useCallback(
    <K extends keyof Preferences,>(key: K, value: Preferences[K]) => {
      setPreferences((current) => ({ ...current, [key]: value }))
    },
    [],
  )

  const importBackup = useCallback(
    (backup: BackupFile, mode: ImportMode) => {
      const result = applyBackup(
        buildVaultData(metadata, favorites, preferences),
        backup,
        mode,
      )
      const orphanCount = Object.keys(result.data.metadata).filter((id) => !manifestIds.has(id)).length
      setMetadata(result.data.metadata)
      setFavorites(new Set(result.data.favorites))
      setPreferences(result.data.preferences)
      return { orphanCount }
    },
    [metadata, favorites, preferences],
  )

  const createBackupFile = useCallback(
    () => createBackup(buildVaultData(metadata, favorites, preferences)),
    [metadata, favorites, preferences],
  )

  const applyDefaultView = useCallback((view: MainView) => {
    setPreferences((current) => ({ ...current, defaultView: view }))
  }, [])

  const value = useMemo<VaultContextValue>(
    () => ({
      schematics,
      metadata,
      favorites,
      preferences,
      counts,
      favoriteCount: favoritesCount,
      metadataCount,
      orphans,
      facets,
      storageError: saveError,
      writesBlocked,
      startupWarning,
      startupWarnings: initial.warnings,
      dismissStartupWarning: () => setStartupWarning(null),
      toggleFavorite,
      updateMetadata,
      removeMetadata,
      removeOrphan,
      clearAllMetadata,
      clearPreferences,
      resetAllData,
      setPreference,
      importBackup,
      createBackupFile,
      applyDefaultView,
    }),
    [
      schematics,
      metadata,
      favorites,
      preferences,
      counts,
      favoritesCount,
      metadataCount,
      orphans,
      facets,
      saveError,
      writesBlocked,
      startupWarning,
      initial.warnings,
      toggleFavorite,
      updateMetadata,
      removeMetadata,
      removeOrphan,
      clearAllMetadata,
      clearPreferences,
      resetAllData,
      setPreference,
      importBackup,
      createBackupFile,
      applyDefaultView,
    ],
  )

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}
