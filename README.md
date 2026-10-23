# STW Schematic Vault

A front-end-only gallery for browsing a Fortnite Save the World schematic
collection. The app indexes images by folder, presents them in Guns, Melee, and
Traps tabs, and stores optional details in local browser storage.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Vitest
- `sharp` for build-time WebP thumbnails
- No backend, account system, or external API

## Quick start

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Node 22.12 or newer is required.

## Commands

| Command             | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| `npm run dev`       | Regenerate the manifest, then start Vite with HMR      |
| `npm run build`     | Regenerate the manifest, thumbnails, and production app |
| `npm run preview`   | Serve the production build locally                     |
| `npm test`          | Run the Vitest suite once                              |
| `npm run test:watch`| Run tests in watch mode                                |
| `npm run lint`      | Run ESLint                                             |
| `npm run typecheck` | Run the TypeScript project build check                 |
| `npm run manifest`  | Regenerate only the manifest and thumbnails            |

## Image layout

Images are discovered from three folders:

```text
public/schematics/
  traps/
  melee/
  guns/
```

Supported extensions are `.png`, `.jpg`, `.jpeg`, and `.webp`. Add or remove
files, then run `npm run manifest` (or restart `npm run dev`). In development,
the manifest watcher regenerates the index and reloads the page when the image
folders change.

The folder name is the source category. Do not rename files unless you also
want to change their stable ID. The original filename remains visible in the
list view and detail panel.

Generated thumbnails are written to:

```text
public/generated/schematic-thumbnails/{category}/{filename}.webp
```

They are 720 px wide, quality 82 WebP files. The app falls back to the original
image if a thumbnail is missing.

### Naming

This project does not OCR screenshots. New images get a readable timestamp
name derived from screenshot-style filenames, or a humanized filename. Use the
metadata editor to give a schematic its real name.

## Local metadata

Personal details are stored in the browser under:

```text
stw-schematic-vault:data
```

It includes display names, category overrides, rarity, power level, element,
subtype, tags, perks, notes, and the gallery layout preference. The schema is
versioned and corrupt or outdated storage is handled without blocking the
gallery.

`categoryOverride` changes where an item appears in the app. `sourceCategory`
always records the folder the image came from, so a gun image placed in the
traps folder can be corrected without moving the file.

## Accessibility and behavior

- Keyboard navigation and focus trapping in dialogs
- `Escape` closes the detail view and metadata editor
- Arrow-key navigation in the detail view when focus is not in a field
- Accessible names for icon-only controls and live count updates
- Reduced-motion preference respected at the app and OS level
- Optional wheel zoom in the image viewer

## Deploying to Netlify

`netlify.toml` is included:

- Build command: `npm run build`
- Publish directory: `dist`
- Node.js 22
- SPA fallback to `index.html`
- Basic security headers

Make sure `public/schematics` is included in the deployment. The collection is
large, so the deploy will be dominated by the original images even though cards
load the much smaller generated thumbnails.

## Project structure

```text
scripts/
  generate-schematic-manifest.mjs   Manifest and thumbnail CLI
  lib/manifest-core.mjs             Discovery, naming, thumbnails, cleanup
src/
  components/                       UI, gallery, and schematic views
  context/                          Vault state and persistence
  data/                             Generated manifest binding
  hooks/                            Media query helpers
  lib/                              Categories, metadata, formatting, view scope
  services/                         Storage and data utilities
  styles/                           Tailwind theme and component styles
  types/                            Shared model types
public/
  schematics/                       Source images
  generated/                        Generated thumbnails
```

## Data limitations

- Metadata is local to one browser profile and origin.
- Clearing site data removes any details added in the editor.
- There is no automated image recognition or external game-data lookup.
