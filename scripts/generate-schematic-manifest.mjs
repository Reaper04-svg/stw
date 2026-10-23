#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeManifest } from './lib/manifest-core.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..')
const generatePreviews = !process.argv.includes('--no-thumbnails')

try {
  await writeManifest({ projectRoot, generatePreviews })
} catch (error) {
  console.error('[schematics] Manifest generation failed:', error)
  process.exitCode = 1
}
