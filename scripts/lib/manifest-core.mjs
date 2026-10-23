import { promises as fs } from 'node:fs'
import path from 'node:path'

export const CATEGORIES = ['traps', 'melee', 'guns']
export const SUPPORTED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif'])
export const THUMBNAIL_WIDTH = 720
export const THUMBNAIL_QUALITY = 82

const CATEGORY_INDEX = new Map(CATEGORIES.map((category, index) => [category, index]))
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function titleCaseWord(word) {
  if (!word) return word
  if (word === word.toLowerCase()) {
    return word.charAt(0).toUpperCase() + word.slice(1)
  }
  return word
}

/**
 * Produces a human-readable label without modifying the original filename.
 * Screenshot-style names are turned into a readable capture timestamp so the
 * gallery stays legible when the raw filename is machine-generated.
 */
export function deriveDisplayName(filename) {
  const stem = filename.replace(/\.[^.]+$/, '')
  const cleaned = stem
    .normalize('NFC')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-.\u2013\u2014]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const screenshot = cleaned.match(
    /^screenshot\s+(\d{4})[\s_-]?(\d{2})[\s_-]?(\d{2})[\s_-]+(\d{2})[\s_-]?(\d{2})[\s_-]?(\d{2})\b/i,
  )
  if (screenshot) {
    const [, year, month, day, hour, minute, second] = screenshot
    const monthName = MONTHS[Number(month) - 1]
    if (monthName && Number(month) >= 1 && Number(month) <= 12) {
      return `Screenshot ${year}-${month}-${day} ${hour}:${minute}:${second}`
    }
  }

  const readable = cleaned
    .split(' ')
    .map(titleCaseWord)
    .join(' ')
    .trim()

  return readable || stem || filename
}

function sortEntries(a, b) {
  return (
    (CATEGORY_INDEX.get(a.category) ?? 99) - (CATEGORY_INDEX.get(b.category) ?? 99) ||
    collator.compare(a.displayName, b.displayName) ||
    collator.compare(a.id, b.id)
  )
}

/**
 * Reads the three category folders. The returned records are the single source
 * of truth for which images exist.
 */
export async function discoverImages(publicDir) {
  const schematicsDir = path.join(publicDir, 'schematics')
  const seen = new Set()
  const images = []
  const warnings = []

  for (const category of CATEGORIES) {
    const categoryDir = path.join(schematicsDir, category)
    let entries
    try {
      entries = await fs.readdir(categoryDir, { withFileTypes: true })
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        warnings.push(`Missing folder: public/schematics/${category}`)
        continue
      }
      throw error
    }

    for (const entry of entries) {
      if (!entry.isFile() || entry.name.startsWith('.')) continue
      const extension = path.extname(entry.name).toLowerCase()
      if (!SUPPORTED_EXTENSIONS.has(extension)) continue

      const id = `${category}/${entry.name}`
      const dedupeKey = id.toLowerCase()
      if (seen.has(dedupeKey)) {
        warnings.push(`Duplicate manifest entry ignored: ${id}`)
        continue
      }
      seen.add(dedupeKey)

      images.push({
        id,
        category,
        file: entry.name,
        extension,
        displayName: deriveDisplayName(entry.name),
        url: `/schematics/${category}/${encodeURIComponent(entry.name)}`,
        thumbnailUrl: null,
        width: null,
        height: null,
      })
    }
  }

  images.sort(sortEntries)
  return { images, warnings }
}

function thumbnailRelativePath(image) {
  return `schematic-thumbnails/${image.category}/${image.file}.webp`
}

async function fileIsNewer(source, target) {
  try {
    const [sourceStat, targetStat] = await Promise.all([fs.stat(source), fs.stat(target)])
    return sourceStat.mtimeMs > targetStat.mtimeMs || sourceStat.size === 0
  } catch {
    return true
  }
}

/**
 * Creates small WebP previews for gallery cards. The full-resolution source is
 * never altered and remains the only image shown in the detail viewer.
 */
export async function generateThumbnails({ publicDir, images, logger = console }) {
  const outputRoot = path.join(publicDir, 'generated')
  let sharp = null

  try {
    const imported = await import('sharp')
    sharp = imported.default ?? imported
  } catch {
    logger.warn('[schematics] sharp is unavailable; gallery thumbnails will fall back to originals.')
    return { generated: 0, reused: 0, failed: 0, outputRoot, enabled: false }
  }

  const expected = new Set()
  let generated = 0
  let reused = 0
  let failed = 0

  await fs.mkdir(outputRoot, { recursive: true })

  for (const image of images) {
    const source = path.join(publicDir, 'schematics', image.category, image.file)
    const relative = thumbnailRelativePath(image)
    const target = path.join(outputRoot, relative)
    expected.add(path.resolve(target))

    try {
      if (await fileIsNewer(source, target)) {
        await fs.mkdir(path.dirname(target), { recursive: true })
        await sharp(source)
          .rotate()
          .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
          .webp({ quality: THUMBNAIL_QUALITY, effort: 4 })
          .toFile(target)
        generated += 1
      } else {
        reused += 1
      }
      image.thumbnailUrl = `/generated/${relative.split('/').map(encodeURIComponent).join('/')}`
    } catch (error) {
      failed += 1
      image.thumbnailUrl = null
      logger.warn(`[schematics] Could not create thumbnail for ${image.id}: ${error.message}`)
    }
  }

  // Remove previews whose source image was renamed or deleted.
  try {
    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          await walk(full)
          const remaining = await fs.readdir(full)
          if (remaining.length === 0) await fs.rmdir(full)
        } else if (entry.isFile() && !expected.has(path.resolve(full))) {
          await fs.unlink(full)
        }
      }
    }
    await walk(outputRoot)
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      logger.warn(`[schematics] Could not clean stale thumbnails: ${error.message}`)
    }
  }

  return { generated, reused, failed, outputRoot, enabled: true }
}

export async function buildManifest({ projectRoot, generatePreviews = true, logger = console }) {
  const publicDir = path.join(projectRoot, 'public')
  const { images, warnings } = await discoverImages(publicDir)

  let thumbnails = { generated: 0, reused: 0, failed: 0, enabled: false }
  if (generatePreviews) {
    thumbnails = await generateThumbnails({ publicDir, images, logger })
  }

  const counts = { total: images.length, traps: 0, melee: 0, guns: 0 }
  for (const image of images) counts[image.category] += 1

  const manifest = {
    generatedAt: new Date().toISOString(),
    counts,
    images,
  }

  return { manifest, warnings, thumbnails }
}

export async function writeManifest({
  projectRoot,
  generatePreviews = true,
  logger = console,
}) {
  const result = await buildManifest({ projectRoot, generatePreviews, logger })
  const outFile = path.join(projectRoot, 'src', 'data', 'schematic-manifest.generated.json')
  await fs.mkdir(path.dirname(outFile), { recursive: true })
  await fs.writeFile(outFile, `${JSON.stringify(result.manifest, null, 2)}\n`, 'utf8')

  for (const warning of result.warnings) logger.warn(`[schematics] ${warning}`)

  const { counts } = result.manifest
  const previewNote = result.thumbnails.enabled
    ? `${result.thumbnails.generated} new preview${result.thumbnails.generated === 1 ? '' : 's'}, ${result.thumbnails.reused} cached`
    : 'previews disabled'
  logger.log(
    `[schematics] Indexed ${counts.total} images (${counts.traps} traps, ${counts.melee} melee, ${counts.guns} guns) · ${previewNote}`,
  )

  return { ...result, outFile }
}
