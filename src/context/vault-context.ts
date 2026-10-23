import { createContext, useContext } from 'react'
import type {
  BackupFile,
  Facets,
  MainView,
  MetadataMap,
  OrphanRecord,
  Preferences,
  Schematic,
  SchematicCategory,
  SchematicMetadata,
} from '../types'
import type { ImportMode } from '../services/backup'

export interface VaultContextValue {
  schematics: Schematic[]
  metadata: MetadataMap
  favorites: ReadonlySet<string>
  preferences: Preferences
  counts: Record<SchematicCategory | 'total', number>
  favoriteCount: number
  metadataCount: number
  orphans: OrphanRecord[]
  facets: Facets
  storageError: string | null
  writesBlocked: boolean
  startupWarning: string | null
  startupWarnings: string[]
  dismissStartupWarning: () => void
  toggleFavorite: (id: string) => void
  updateMetadata: (id: string, draft: SchematicMetadata) => void
  removeMetadata: (id: string) => void
  removeOrphan: (id: string) => void
  clearAllMetadata: () => void
  clearPreferences: () => void
  resetAllData: () => void
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
  importBackup: (backup: BackupFile, mode: ImportMode) => { orphanCount: number }
  createBackupFile: () => BackupFile
  applyDefaultView: (view: MainView) => void
}

export const VaultContext = createContext<VaultContextValue | null>(null)

export function useVault(): VaultContextValue {
  const context = useContext(VaultContext)
  if (!context) throw new Error('useVault must be used inside VaultProvider')
  return context
}
