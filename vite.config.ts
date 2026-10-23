import { execFile } from 'node:child_process'
import path from 'node:path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif'])

/**
 * Regenerates the manifest while the dev server is running so newly dropped
 * images appear without a manual restart. The initial generation is handled by
 * the `dev` npm script before Vite boots.
 */
function schematicWatcher(): Plugin {
  return {
    name: 'stw-schematic-watcher',
    apply: 'serve',
    configureServer(server) {
      const schematicsDir = path.resolve(server.config.root, 'public/schematics')
      const script = path.resolve(server.config.root, 'scripts/generate-schematic-manifest.mjs')
      let timer: NodeJS.Timeout | undefined
      let running = false
      let queued = false

      const regenerate = () => {
        if (running) {
          queued = true
          return
        }
        running = true
        execFile(process.execPath, [script], { cwd: server.config.root }, (error) => {
          running = false
          if (error) {
            server.config.logger.error(`[schematics] manifest regeneration failed: ${error.message}`)
          } else {
            server.ws.send({ type: 'full-reload' })
          }
          if (queued) {
            queued = false
            schedule()
          }
        })
      }

      const schedule = () => {
        clearTimeout(timer)
        timer = setTimeout(regenerate, 300)
      }

      const onFileEvent = (file: string) => {
        const resolved = path.resolve(file)
        if (!resolved.startsWith(schematicsDir)) return
        if (!IMAGE_EXTENSIONS.has(path.extname(resolved).toLowerCase())) return
        schedule()
      }

      server.watcher.add(schematicsDir)
      server.watcher.on('add', onFileEvent)
      server.watcher.on('unlink', onFileEvent)
      server.httpServer?.once('close', () => clearTimeout(timer))
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), schematicWatcher()],
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
    reporters: 'default',
  },
})
