import type { Element, MainView, Rarity, SchematicCategory } from '../types'
import { CATEGORIES } from '../types'

export interface CategoryInfo {
  label: string
  plural: string
  description: string
  accent: string
  soft: string
}

export const CATEGORY_INFO: Record<SchematicCategory, CategoryInfo> = {
  traps: {
    label: 'Traps',
    plural: 'Traps',
    description: 'Defensive hardware, ceiling drops, and floor hazards.',
    accent: '#d7a84a',
    soft: 'rgba(215, 168, 74, 0.12)',
  },
  melee: {
    label: 'Melee',
    plural: 'Melee',
    description: 'Close-quarters tools for carving through the husk.',
    accent: '#5ad1c4',
    soft: 'rgba(90, 209, 196, 0.12)',
  },
  guns: {
    label: 'Guns',
    plural: 'Guns',
    description: 'Ranged firepower, from sidearms to heavy ordnance.',
    accent: '#7ea7e6',
    soft: 'rgba(126, 167, 230, 0.12)',
  },
}

export const CATEGORY_ORDER: Record<SchematicCategory, number> = {
  traps: 0,
  melee: 1,
  guns: 2,
}

export const RARITY_INFO: Record<Rarity, { label: string; color: string; rank: number }> = {
  common: { label: 'Common', color: '#a8aeb9', rank: 1 },
  uncommon: { label: 'Uncommon', color: '#65c46a', rank: 2 },
  rare: { label: 'Rare', color: '#58a4e6', rank: 3 },
  epic: { label: 'Epic', color: '#b579e5', rank: 4 },
  legendary: { label: 'Legendary', color: '#e5a24a', rank: 5 },
  mythic: { label: 'Mythic', color: '#e9cf74', rank: 6 },
}

export const ELEMENT_INFO: Record<Element, { label: string; color: string }> = {
  physical: { label: 'Physical', color: '#b8a98c' },
  fire: { label: 'Fire', color: '#f07a4a' },
  water: { label: 'Water', color: '#56a4e8' },
  nature: { label: 'Nature', color: '#67cd78' },
  energy: { label: 'Energy', color: '#b582e6' },
}

export const VIEW_LABELS: Record<MainView, string> = {
  all: 'All Schematics',
  traps: 'Traps',
  melee: 'Melee',
  guns: 'Guns',
  favorites: 'Favorites',
}

export function viewTitle(view: MainView): string {
  if (view === 'all') return 'All schematics'
  if (view === 'favorites') return 'Favorites'
  return CATEGORY_INFO[view].plural
}

export function isCategoryView(view: MainView): view is SchematicCategory {
  return (CATEGORIES as readonly string[]).includes(view)
}
