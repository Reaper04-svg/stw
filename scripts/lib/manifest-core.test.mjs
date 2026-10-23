import { afterEach, describe, expect, it } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { deriveDisplayName, discoverImages } from './manifest-core.mjs'

const temporaryDirs = []

async function fixture(entries) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'stw-manifest-'))
  temporaryDirs.push(root)
  const publicDir = path.join(root, 'public')
  for (const category of ['traps', 'melee', 'guns']) {
    await fs.mkdir(path.join(publicDir, 'schematics', category), { recursive: true })
  }
  for (const [category, filename, contents = 'fixture'] of entries) {
    await fs.writeFile(path.join(publicDir, 'schematics', category, filename), contents)
  }
  return publicDir
}

afterEach(async () => {
  await Promise.all(
    temporaryDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })),
  )
})

describe('deriveDisplayName', () => {
  it('turns screenshot filenames into readable timestamps', () => {
    expect(deriveDisplayName('Screenshot_20261023_142733_146838.png')).toBe(
      'Screenshot 2026-10-23 14:27:33',
    )
    expect(deriveDisplayName('screenshot-2026-10-23-09-05-02.jpg')).toBe(
      'Screenshot 2026-10-23 09:05:02',
    )
  })

  it('humanizes ordinary filenames without inventing details', () => {
    expect(deriveDisplayName('wall_darts-legendary.png')).toBe('Wall Darts Legendary')
    expect(deriveDisplayName('HydraBlaster.png')).toBe('Hydra Blaster')
    expect(deriveDisplayName('.png')).toBe('.png')
  })
})

describe('discoverImages', () => {
  it('reads the three folders, filters unsupported files, and sorts by category', async () => {
    const publicDir = await fixture([
      ['guns', 'zeta.png'],
      ['guns', 'alpha.png'],
      ['guns', 'alpha-10.png'],
      ['traps', 'darts.png'],
      ['melee', 'sword.webp'],
      ['guns', 'ignored.gif'],
      ['guns', '.DS_Store'],
    ])

    const { images, warnings } = await discoverImages(publicDir)

    expect(warnings).toEqual([])
    expect(images).toHaveLength(5)
    expect(images.map((image) => image.category)).toEqual([
      'traps',
      'melee',
      'guns',
      'guns',
      'guns',
    ])
    expect(images.filter((image) => image.category === 'guns').map((image) => image.file)).toEqual([
      'alpha.png',
      'alpha-10.png',
      'zeta.png',
    ])
    expect(images[0]).toMatchObject({
      id: 'traps/darts.png',
      url: '/schematics/traps/darts.png',
      thumbnailUrl: null,
      width: null,
      height: null,
    })
  })

  it('warns when a category folder is missing instead of failing', async () => {
    const publicDir = await fixture([['guns', 'hydra.png']])
    await fs.rm(path.join(publicDir, 'schematics', 'melee'), { recursive: true })

    const { images, warnings } = await discoverImages(publicDir)
    expect(images).toHaveLength(1)
    expect(warnings).toEqual(['Missing folder: public/schematics/melee'])
  })

  it('encodes filenames in URLs while keeping the original file name', async () => {
    const publicDir = await fixture([['guns', 'hydra #1.png']])
    const { images } = await discoverImages(publicDir)
    expect(images[0].file).toBe('hydra #1.png')
    expect(images[0].url).toBe('/schematics/guns/hydra%20%231.png')
  })
})
