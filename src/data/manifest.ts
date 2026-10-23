import rawManifest from './schematic-manifest.generated.json'
import type { ManifestImage, SchematicManifest } from '../types'

export const manifest = rawManifest as SchematicManifest

export const manifestImages: ManifestImage[] = manifest.images

export const manifestIds = new Set(manifestImages.map((image) => image.id))

export const manifestById = new Map(manifestImages.map((image) => [image.id, image]))
